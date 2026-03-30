// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package domain

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// URLScanResult holds URL scanning results.
type URLScanResult struct {
	URL            string            `json:"url"`
	FinalURL       string            `json:"final_url"`
	RedirectChain  []string          `json:"redirect_chain"`
	StatusCode     int               `json:"status_code"`
	ContentType    string            `json:"content_type"`
	SecurityHeaders map[string]string `json:"security_headers"`
	VTMalicious    int               `json:"vt_malicious"`
	VTSuspicious   int               `json:"vt_suspicious"`
	VTTotal        int               `json:"vt_total"`
	VTPermalink    string            `json:"vt_permalink"`
	IsSafe         bool              `json:"is_safe"`
	RiskScore      int               `json:"risk_score"`
	Error          string            `json:"error,omitempty"`
}

var securityHeaderChecks = []string{
	"Strict-Transport-Security",
	"Content-Security-Policy",
	"X-Frame-Options",
	"X-Content-Type-Options",
	"Referrer-Policy",
	"Permissions-Policy",
	"X-XSS-Protection",
}

// ScanURL scans a URL using VirusTotal API and checks security headers.
func ScanURL(ctx context.Context, rawURL, vtAPIKey string) (*URLScanResult, error) {
	result := &URLScanResult{URL: rawURL}

	client := &http.Client{
		Timeout: 30 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 10 {
				return fmt.Errorf("too many redirects")
			}
			result.RedirectChain = append(result.RedirectChain, req.URL.String())
			return nil
		},
	}

	req, err := http.NewRequestWithContext(ctx, "GET", rawURL, nil)
	if err != nil {
		result.Error = fmt.Sprintf("invalid URL: %v", err)
		return result, nil
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; VAULTX/1.0)")

	resp, err := client.Do(req)
	if err == nil {
		defer resp.Body.Close()
		result.FinalURL = resp.Request.URL.String()
		result.StatusCode = resp.StatusCode
		result.ContentType = resp.Header.Get("Content-Type")
		result.SecurityHeaders = make(map[string]string)
		for _, h := range securityHeaderChecks {
			val := resp.Header.Get(h)
			if val == "" {
				val = "missing"
			}
			result.SecurityHeaders[h] = val
		}
	}

	if vtAPIKey != "" {
		vtResult := scanURLVirusTotal(ctx, rawURL, vtAPIKey)
		result.VTMalicious = vtResult.malicious
		result.VTSuspicious = vtResult.suspicious
		result.VTTotal = vtResult.total
		result.VTPermalink = vtResult.permalink
	}

	result.RiskScore = calculateURLRisk(result)
	result.IsSafe = result.RiskScore < 30

	return result, nil
}

type vtURLResult struct {
	malicious  int
	suspicious int
	total      int
	permalink  string
}

type vtURLAnalysis struct {
	Data struct {
		Attributes struct {
			Stats struct {
				Malicious  int `json:"malicious"`
				Suspicious int `json:"suspicious"`
				Harmless   int `json:"harmless"`
				Undetected int `json:"undetected"`
			} `json:"last_analysis_stats"`
		} `json:"attributes"`
		Links struct {
			Self string `json:"self"`
		} `json:"links"`
	} `json:"data"`
}

func scanURLVirusTotal(ctx context.Context, rawURL, apiKey string) vtURLResult {
	client := &http.Client{Timeout: 30 * time.Second}
	urlID := base64.StdEncoding.EncodeToString([]byte(rawURL))
	urlID = strings.TrimRight(urlID, "=")

	req, err := http.NewRequestWithContext(ctx, "GET",
		fmt.Sprintf("https://www.virustotal.com/api/v3/urls/%s", urlID), nil)
	if err != nil {
		return vtURLResult{}
	}
	req.Header.Set("x-apikey", apiKey)

	resp, err := client.Do(req)
	if err != nil {
		return vtURLResult{}
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		submitReq, err := http.NewRequestWithContext(ctx, "POST",
			"https://www.virustotal.com/api/v3/urls",
			strings.NewReader("url="+rawURL))
		if err != nil {
			return vtURLResult{}
		}
		submitReq.Header.Set("x-apikey", apiKey)
		submitReq.Header.Set("content-type", "application/x-www-form-urlencoded")
		client.Do(submitReq)
		return vtURLResult{}
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return vtURLResult{}
	}

	var analysis vtURLAnalysis
	if err := json.Unmarshal(body, &analysis); err != nil {
		return vtURLResult{}
	}

	stats := analysis.Data.Attributes.Stats
	total := stats.Malicious + stats.Suspicious + stats.Harmless + stats.Undetected
	return vtURLResult{
		malicious:  stats.Malicious,
		suspicious: stats.Suspicious,
		total:      total,
		permalink:  analysis.Data.Links.Self,
	}
}

func calculateURLRisk(r *URLScanResult) int {
	score := 0
	if r.VTMalicious > 0 {
		score += r.VTMalicious * 10
	}
	if r.VTSuspicious > 0 {
		score += r.VTSuspicious * 5
	}
	if r.SecurityHeaders != nil {
		missing := 0
		for _, v := range r.SecurityHeaders {
			if v == "missing" {
				missing++
			}
		}
		score += missing * 3
	}
	if score > 100 {
		score = 100
	}
	return score
}
