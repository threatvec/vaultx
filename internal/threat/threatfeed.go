// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package threat

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// FeedEntry represents a single threat feed entry.
type FeedEntry struct {
	IP          string    `json:"ip"`
	Domain      string    `json:"domain,omitempty"`
	Category    string    `json:"category"`
	Confidence  int       `json:"confidence"`
	Country     string    `json:"country"`
	CountryCode string    `json:"country_code"`
	Source      string    `json:"source"`
	Timestamp   time.Time `json:"timestamp"`
	Description string    `json:"description,omitempty"`
}

// ThreatFeedResult holds the combined threat feed results.
type ThreatFeedResult struct {
	Entries   []FeedEntry `json:"entries"`
	Total     int         `json:"total"`
	UpdatedAt time.Time   `json:"updated_at"`
	Error     string      `json:"error,omitempty"`
}

// GetThreatFeed fetches threat data from AbuseIPDB blacklist and OTX pulses.
func GetThreatFeed(ctx context.Context, abuseKey, otxKey string) (*ThreatFeedResult, error) {
	result := &ThreatFeedResult{
		Entries:   []FeedEntry{},
		UpdatedAt: time.Now(),
	}

	if abuseKey == "" && otxKey == "" {
		result.Error = "API keys required: AbuseIPDB and/or AlienVault OTX"
		return result, nil
	}

	client := &http.Client{Timeout: 20 * time.Second}
	errChan := make(chan error, 2)

	// Fetch AbuseIPDB blacklist
	if abuseKey != "" {
		go func() {
			entries, err := fetchAbuseBlacklist(ctx, client, abuseKey)
			if err != nil {
				errChan <- err
				return
			}
			result.Entries = append(result.Entries, entries...)
			errChan <- nil
		}()
	} else {
		errChan <- nil
	}

	// Fetch OTX pulses
	if otxKey != "" {
		go func() {
			entries, err := fetchOTXPulses(ctx, client, otxKey)
			if err != nil {
				errChan <- err
				return
			}
			result.Entries = append(result.Entries, entries...)
			errChan <- nil
		}()
	} else {
		errChan <- nil
	}

	// Wait for both
	for i := 0; i < 2; i++ {
		<-errChan
	}

	result.Total = len(result.Entries)

	// Sort by timestamp desc (most recent first), limit to 100
	if len(result.Entries) > 100 {
		result.Entries = result.Entries[:100]
	}

	return result, nil
}

// fetchAbuseBlacklist gets the latest blacklisted IPs from AbuseIPDB.
func fetchAbuseBlacklist(ctx context.Context, client *http.Client, apiKey string) ([]FeedEntry, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", "https://api.abuseipdb.com/api/v2/blacklist?confidenceMinimum=90&limit=50", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Key", apiKey)
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 429 {
		return nil, fmt.Errorf("AbuseIPDB rate limit exceeded")
	}
	if resp.StatusCode == 401 {
		return nil, fmt.Errorf("AbuseIPDB: invalid API key")
	}
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("AbuseIPDB returned status %d", resp.StatusCode)
	}

	body, _ := io.ReadAll(resp.Body)

	var apiResp struct {
		Data []struct {
			IPAddress            string `json:"ipAddress"`
			CountryCode          string `json:"countryCode"`
			AbuseConfidenceScore int    `json:"abuseConfidenceScore"`
			LastReportedAt       string `json:"lastReportedAt"`
		} `json:"data"`
	}
	if err := json.Unmarshal(body, &apiResp); err != nil {
		return nil, err
	}

	entries := make([]FeedEntry, 0, len(apiResp.Data))
	for _, d := range apiResp.Data {
		ts, _ := time.Parse(time.RFC3339, d.LastReportedAt)
		cat := "Malicious"
		if d.AbuseConfidenceScore > 95 {
			cat = "Critical"
		}
		entries = append(entries, FeedEntry{
			IP:          d.IPAddress,
			Category:    cat,
			Confidence:  d.AbuseConfidenceScore,
			CountryCode: d.CountryCode,
			Source:      "AbuseIPDB",
			Timestamp:   ts,
		})
	}
	return entries, nil
}

// fetchOTXPulses gets the latest pulses from AlienVault OTX.
func fetchOTXPulses(ctx context.Context, client *http.Client, apiKey string) ([]FeedEntry, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", "https://otx.alienvault.com/api/v1/pulses/subscribed?limit=30&modified_since="+time.Now().Add(-24*time.Hour).Format("2006-01-02"), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-OTX-API-KEY", apiKey)

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 403 || resp.StatusCode == 401 {
		return nil, fmt.Errorf("OTX: invalid API key")
	}
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("OTX returned status %d", resp.StatusCode)
	}

	body, _ := io.ReadAll(resp.Body)

	var apiResp struct {
		Results []struct {
			Name        string `json:"name"`
			Description string `json:"description"`
			Created     string `json:"created"`
			Indicators  []struct {
				Indicator string `json:"indicator"`
				Type      string `json:"type"`
			} `json:"indicators"`
			Tags []string `json:"tags"`
		} `json:"results"`
	}
	if err := json.Unmarshal(body, &apiResp); err != nil {
		return nil, err
	}

	entries := make([]FeedEntry, 0)
	for _, pulse := range apiResp.Results {
		ts, _ := time.Parse("2006-01-02T15:04:05.000000", pulse.Created)
		cat := "OTX Pulse"
		if len(pulse.Tags) > 0 {
			cat = pulse.Tags[0]
		}
		for _, ind := range pulse.Indicators {
			if ind.Type == "IPv4" || ind.Type == "domain" || ind.Type == "hostname" {
				entry := FeedEntry{
					Category:    cat,
					Confidence:  80,
					Source:      "OTX",
					Timestamp:   ts,
					Description: pulse.Name,
				}
				if ind.Type == "IPv4" {
					entry.IP = ind.Indicator
				} else {
					entry.Domain = ind.Indicator
				}
				entries = append(entries, entry)
				if len(entries) > 50 {
					return entries, nil
				}
			}
		}
	}
	return entries, nil
}
