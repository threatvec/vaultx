// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package threat

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"
)

// PasteEntry represents a found paste containing monitored content.
type PasteEntry struct {
	URL       string    `json:"url"`
	Source    string    `json:"source"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Match     string    `json:"match"`
	FoundAt   time.Time `json:"found_at"`
}

// PasteMonitorResult holds results from paste monitoring.
type PasteMonitorResult struct {
	Query    string       `json:"query"`
	Found    []PasteEntry `json:"found"`
	Total    int          `json:"total"`
	Error    string       `json:"error,omitempty"`
}

// pasteAPI is the public Pastebin scraping endpoint.
const pasteArchiveAPI = "https://psbdmp.ws/api/search"

type psbdmpResponse struct {
	Count int `json:"count"`
	Data  []struct {
		ID   string `json:"id"`
		Text string `json:"text"`
		Time string `json:"time"`
	} `json:"data"`
}

// CheckPastes searches public paste sites for mentions of the query string.
func CheckPastes(ctx context.Context, query string) (*PasteMonitorResult, error) {
	result := &PasteMonitorResult{Query: query}
	client := &http.Client{Timeout: 20 * time.Second}

	// Try psbdmp.ws search API
	req, err := http.NewRequestWithContext(ctx, "GET",
		fmt.Sprintf("%s/%s", pasteArchiveAPI, strings.ReplaceAll(query, "@", "%40")),
		nil)
	if err != nil {
		result.Error = err.Error()
		return result, nil
	}
	req.Header.Set("User-Agent", "VAULTX/1.0")

	resp, err := client.Do(req)
	if err != nil {
		result.Error = fmt.Sprintf("paste search failed: %v", err)
		return result, nil
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		result.Error = err.Error()
		return result, nil
	}

	entries := parsePsbdmpResponse(body, query)
	result.Found = entries
	result.Total = len(entries)

	return result, nil
}

// parsePsbdmpResponse parses psbdmp search results and filters relevant matches.
func parsePsbdmpResponse(body []byte, query string) []PasteEntry {
	var entries []PasteEntry
	queryLower := strings.ToLower(query)

	lines := strings.Split(string(body), "\n")
	idRegex := regexp.MustCompile(`\b[A-Za-z0-9]{8}\b`)

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		if strings.Contains(strings.ToLower(line), queryLower) {
			ids := idRegex.FindAllString(line, -1)
			for _, id := range ids {
				entries = append(entries, PasteEntry{
					URL:     fmt.Sprintf("https://pastebin.com/%s", id),
					Source:  "pastebin.com",
					Title:   fmt.Sprintf("Paste %s", id),
					Content: truncate(line, 200),
					Match:   query,
					FoundAt: time.Now(),
				})
			}
		}
	}

	return entries
}

// truncate shortens a string to maxLen with ellipsis.
func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}
