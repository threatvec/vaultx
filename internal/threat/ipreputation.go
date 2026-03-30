// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package threat

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

// IPReputationResult holds IP reputation analysis results.
type IPReputationResult struct {
	IP             string   `json:"ip"`
	AbuseScore     int      `json:"abuse_score"`
	TotalReports   int      `json:"total_reports"`
	CountryCode    string   `json:"country_code"`
	Country        string   `json:"country"`
	ISP            string   `json:"isp"`
	Domain         string   `json:"domain"`
	IsVPN          bool     `json:"is_vpn"`
	IsProxy        bool     `json:"is_proxy"`
	IsTor          bool     `json:"is_tor"`
	IsBotnet       bool     `json:"is_botnet"`
	IsDataCenter   bool     `json:"is_datacenter"`
	UsageType      string   `json:"usage_type"`
	Blacklists     []string `json:"blacklists"`
	LastReportedAt string   `json:"last_reported_at"`
	RiskScore      int      `json:"risk_score"`
	Error          string   `json:"error,omitempty"`
}

type abuseIPDBCheckResponse struct {
	Data struct {
		IPAddress            string `json:"ipAddress"`
		AbuseConfidenceScore int    `json:"abuseConfidenceScore"`
		CountryCode          string `json:"countryCode"`
		UsageType            string `json:"usageType"`
		ISP                  string `json:"isp"`
		Domain               string `json:"domain"`
		TotalReports         int    `json:"totalReports"`
		LastReportedAt       string `json:"lastReportedAt"`
	} `json:"data"`
}

// CheckIPReputation performs a comprehensive IP reputation check.
func CheckIPReputation(ctx context.Context, ip, abuseAPIKey string) (*IPReputationResult, error) {
	result := &IPReputationResult{IP: ip}
	var mu sync.Mutex
	var wg sync.WaitGroup

	if abuseAPIKey != "" {
		wg.Add(1)
		go func() {
			defer wg.Done()
			checkAbuseIPDB(ctx, ip, abuseAPIKey, result, &mu)
		}()
	}

	wg.Add(1)
	go func() {
		defer wg.Done()
		checkIPAPI(ctx, ip, result, &mu)
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		checkDNSBLs(ctx, ip, result, &mu)
	}()

	wg.Wait()

	mu.Lock()
	result.RiskScore = calculateIPRisk(result)
	mu.Unlock()

	return result, nil
}

func checkAbuseIPDB(ctx context.Context, ip, apiKey string, result *IPReputationResult, mu *sync.Mutex) {
	client := &http.Client{Timeout: 15 * time.Second}
	req, err := http.NewRequestWithContext(ctx, "GET",
		fmt.Sprintf("https://api.abuseipdb.com/api/v2/check?ipAddress=%s&maxAgeInDays=90", url.QueryEscape(ip)),
		nil)
	if err != nil {
		return
	}
	req.Header.Set("Key", apiKey)
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return
	}

	var abuseResp abuseIPDBCheckResponse
	if err := json.Unmarshal(body, &abuseResp); err != nil {
		return
	}

	d := abuseResp.Data
	mu.Lock()
	result.AbuseScore = d.AbuseConfidenceScore
	result.TotalReports = d.TotalReports
	result.CountryCode = d.CountryCode
	result.ISP = d.ISP
	result.Domain = d.Domain
	result.UsageType = d.UsageType
	result.LastReportedAt = d.LastReportedAt
	result.IsDataCenter = strings.Contains(strings.ToLower(d.UsageType), "data center") ||
		strings.Contains(strings.ToLower(d.UsageType), "hosting")
	mu.Unlock()
}

func checkIPAPI(ctx context.Context, ip string, result *IPReputationResult, mu *sync.Mutex) {
	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequestWithContext(ctx, "GET",
		fmt.Sprintf("http://ip-api.com/json/%s?fields=country,countryCode,isp,org,proxy,hosting,tor,status", ip),
		nil)
	if err != nil {
		return
	}

	resp, err := client.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	var raw map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	if err := json.Unmarshal(body, &raw); err != nil {
		return
	}

	mu.Lock()
	if result.Country == "" {
		if v, ok := raw["country"].(string); ok {
			result.Country = v
		}
	}
	if result.CountryCode == "" {
		if v, ok := raw["countryCode"].(string); ok {
			result.CountryCode = v
		}
	}
	if result.ISP == "" {
		if v, ok := raw["isp"].(string); ok {
			result.ISP = v
		}
	}
	if v, ok := raw["proxy"].(bool); ok {
		result.IsProxy = v
	}
	if v, ok := raw["hosting"].(bool); ok && v {
		result.IsDataCenter = true
	}
	if v, ok := raw["tor"].(bool); ok {
		result.IsTor = v
	}
	mu.Unlock()
}

// checkDNSBLs checks common DNS blacklists for the IP.
func checkDNSBLs(ctx context.Context, ip string, result *IPReputationResult, mu *sync.Mutex) {
	dnsblHosts := []string{
		"zen.spamhaus.org",
		"bl.spamcop.net",
		"dnsbl.sorbs.net",
		"b.barracudacentral.org",
		"dnsbl-1.uceprotect.net",
		"cbl.abuseat.org",
	}

	parts := strings.Split(ip, ".")
	if len(parts) != 4 {
		return
	}
	reversed := fmt.Sprintf("%s.%s.%s.%s", parts[3], parts[2], parts[1], parts[0])

	var found []string
	var mu2 sync.Mutex
	var wg sync.WaitGroup

	resolver := &net.Resolver{}
	for _, bl := range dnsblHosts {
		wg.Add(1)
		go func(bl string) {
			defer wg.Done()
			query := fmt.Sprintf("%s.%s", reversed, bl)
			addrs, err := resolver.LookupHost(ctx, query)
			if err == nil && len(addrs) > 0 {
				mu2.Lock()
				found = append(found, bl)
				mu2.Unlock()
			}
		}(bl)
	}
	wg.Wait()

	mu.Lock()
	result.Blacklists = found
	if len(found) > 0 {
		result.IsBotnet = true
	}
	mu.Unlock()
}

// calculateIPRisk computes a risk score from reputation findings.
func calculateIPRisk(r *IPReputationResult) int {
	score := r.AbuseScore
	if r.IsTor {
		score += 20
	}
	if r.IsProxy {
		score += 10
	}
	if r.IsBotnet {
		score += 30
	}
	if len(r.Blacklists) > 0 {
		score += len(r.Blacklists) * 5
	}
	if score > 100 {
		score = 100
	}
	return score
}
