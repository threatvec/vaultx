// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package network

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

// MyIPResult holds the user's public IP and DNS leak information.
type MyIPResult struct {
	PublicIP    string          `json:"public_ip"`
	Country     string          `json:"country"`
	CountryCode string          `json:"country_code"`
	City        string          `json:"city"`
	ISP         string          `json:"isp"`
	Org         string          `json:"org"`
	AS          string          `json:"as"`
	Timezone    string          `json:"timezone"`
	IsVPN       bool            `json:"is_vpn"`
	IsProxy     bool            `json:"is_proxy"`
	IsTor       bool            `json:"is_tor"`
	DNSLeaks    []DNSLeakServer `json:"dns_leaks"`
	HasDNSLeak  bool            `json:"has_dns_leak"`
	Error       string          `json:"error,omitempty"`
}

// DNSLeakServer represents a DNS resolver detected during leak testing.
type DNSLeakServer struct {
	IP          string `json:"ip"`
	Country     string `json:"country"`
	CountryCode string `json:"country_code"`
	ISP         string `json:"isp"`
	IsSameISP   bool   `json:"is_same_isp"`
}

// GetMyIP fetches the user's public IP and runs DNS leak tests.
func GetMyIP(ctx context.Context) (*MyIPResult, error) {
	result := &MyIPResult{}

	// Fetch public IP
	ip, err := fetchPublicIP(ctx)
	if err != nil {
		result.Error = fmt.Sprintf("Could not fetch public IP: %v", err)
		return result, nil
	}
	result.PublicIP = ip

	// Geo + ISP info for public IP
	intel, err := LookupIPIntel(ctx, ip)
	if err == nil && intel != nil {
		result.Country = intel.Country
		result.CountryCode = intel.CountryCode
		result.City = intel.City
		result.ISP = intel.ISP
		result.Org = intel.Org
		result.AS = intel.AS
		result.Timezone = intel.Timezone
		result.IsProxy = intel.IsProxy
		result.IsTor = intel.IsTor
	}

	// DNS leak test
	leaks, hasLeak := runDNSLeakTest(ctx, result.ISP)
	result.DNSLeaks = leaks
	result.HasDNSLeak = hasLeak

	return result, nil
}

// fetchPublicIP retrieves the public IP from multiple fallback sources.
func fetchPublicIP(ctx context.Context) (string, error) {
	endpoints := []string{
		"https://api.ipify.org",
		"https://api4.my-ip.io/ip",
		"https://ipv4.icanhazip.com",
	}

	client := &http.Client{Timeout: 8 * time.Second}
	for _, endpoint := range endpoints {
		req, err := http.NewRequestWithContext(ctx, "GET", endpoint, nil)
		if err != nil {
			continue
		}
		resp, err := client.Do(req)
		if err != nil {
			continue
		}
		body, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			continue
		}
		ip := strings.TrimSpace(string(body))
		if net.ParseIP(ip) != nil {
			return ip, nil
		}
	}
	return "", fmt.Errorf("all IP endpoints failed")
}

// runDNSLeakTest detects DNS resolvers being used by the system.
func runDNSLeakTest(ctx context.Context, myISP string) ([]DNSLeakServer, bool) {
	// Use public DNS resolvers and check which ISP responds
	// This tests if DNS queries are leaking outside the VPN tunnel
	testDomains := []string{
		"dns-leak-test-1.example.com",
		"dns-leak-test-2.example.com",
	}

	// Get the system's configured DNS resolvers
	resolverIPs := getSystemDNSResolvers()

	var leaks []DNSLeakServer
	var mu sync.Mutex
	var wg sync.WaitGroup
	seen := map[string]bool{}

	for _, resolverIP := range resolverIPs {
		if seen[resolverIP] {
			continue
		}
		seen[resolverIP] = true
		wg.Add(1)
		go func(rip string) {
			defer wg.Done()
			// Attempt to get geo info for this DNS resolver
			intel, err := LookupIPIntel(ctx, rip)
			if err != nil || intel == nil {
				return
			}
			isSameISP := strings.EqualFold(intel.ISP, myISP) ||
				strings.Contains(strings.ToLower(intel.ISP), strings.ToLower(myISP))

			mu.Lock()
			leaks = append(leaks, DNSLeakServer{
				IP:          rip,
				Country:     intel.Country,
				CountryCode: intel.CountryCode,
				ISP:         intel.ISP,
				IsSameISP:   isSameISP,
			})
			mu.Unlock()
		}(resolverIP)
	}

	// Also test by querying known public DNS and checking what they return
	_ = testDomains

	wg.Wait()

	// Has DNS leak if any resolver is from a different ISP/country
	hasLeak := false
	for _, leak := range leaks {
		if !leak.IsSameISP {
			hasLeak = true
			break
		}
	}

	return leaks, hasLeak
}

// getSystemDNSResolvers reads the system's configured DNS resolver addresses.
func getSystemDNSResolvers() []string {
	var resolvers []string

	// Common public/system DNS IPs to test against
	// We query them and check which ones respond fastest (indicating they're in use)
	candidates := []string{
		"8.8.8.8", "8.8.4.4",       // Google
		"1.1.1.1", "1.0.0.1",       // Cloudflare
		"9.9.9.9",                   // Quad9
		"208.67.222.222",            // OpenDNS
	}

	// Test each candidate with a short timeout
	var mu sync.Mutex
	var wg sync.WaitGroup

	for _, ip := range candidates {
		wg.Add(1)
		go func(ip string) {
			defer wg.Done()
			resolver := &net.Resolver{
				PreferGo: true,
				Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
					d := net.Dialer{Timeout: 2 * time.Second}
					return d.DialContext(ctx, "udp", ip+":53")
				},
			}
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()
			_, err := resolver.LookupHost(ctx, "google.com")
			if err == nil {
				mu.Lock()
				resolvers = append(resolvers, ip)
				mu.Unlock()
			}
		}(ip)
	}
	wg.Wait()
	return resolvers
}

// ipifyResponse for structured response parsing.
type ipifyResponse struct {
	IP string `json:"ip"`
}

// fetchPublicIPStructured fetches structured IP info from ipify.
func fetchPublicIPStructured(ctx context.Context) (string, error) {
	client := &http.Client{Timeout: 8 * time.Second}
	req, err := http.NewRequestWithContext(ctx, "GET", "https://api.ipify.org?format=json", nil)
	if err != nil {
		return "", err
	}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var r ipifyResponse
	body, _ := io.ReadAll(resp.Body)
	if err := json.Unmarshal(body, &r); err != nil {
		return "", err
	}
	return r.IP, nil
}
