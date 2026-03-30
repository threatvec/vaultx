// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package identity

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"
)

// SnapshotEntry represents one Wayback Machine archive snapshot.
type SnapshotEntry struct {
	Timestamp  string `json:"timestamp"`
	URL        string `json:"url"`
	StatusCode string `json:"status_code"`
	MimeType   string `json:"mime_type"`
	ArchiveURL string `json:"archive_url"`
	Year       int    `json:"year"`
}

// YearSummary aggregates snapshot counts per year.
type YearSummary struct {
	Year  int `json:"year"`
	Count int `json:"count"`
}

// WaybackResult holds all Wayback Machine data for a domain.
type WaybackResult struct {
	Domain      string          `json:"domain"`
	Total       int             `json:"total"`
	FirstSeen   string          `json:"first_seen"`
	LastSeen    string          `json:"last_seen"`
	Snapshots   []SnapshotEntry `json:"snapshots"`
	YearSummary []YearSummary   `json:"year_summary"`
	Error       string          `json:"error,omitempty"`
}

// LookupWayback fetches archive snapshots for a domain from the Wayback CDX API.
func LookupWayback(ctx context.Context, domain string) (*WaybackResult, error) {
	domain = strings.TrimSpace(domain)
	domain = strings.TrimPrefix(domain, "http://")
	domain = strings.TrimPrefix(domain, "https://")
	domain = strings.Split(domain, "/")[0]

	result := &WaybackResult{Domain: domain}
	client := &http.Client{Timeout: 30 * time.Second}

	// CDX API: fetch snapshots with summary (limit 1000 for speed)
	cdxURL := fmt.Sprintf(
		"https://web.archive.org/cdx/search/cdx?url=%s/*&output=json&fl=timestamp,original,statuscode,mimetype&collapse=digest&limit=1000&filter=statuscode:200",
		url.QueryEscape(domain),
	)

	req, err := http.NewRequestWithContext(ctx, "GET", cdxURL, nil)
	if err != nil {
		return nil, err
	}

	resp, err := client.Do(req)
	if err != nil {
		result.Error = fmt.Sprintf("Wayback API unavailable: %v", err)
		return result, nil
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		result.Error = fmt.Sprintf("Read error: %v", err)
		return result, nil
	}

	// CDX returns JSON array of arrays
	var rows [][]string
	if err := json.Unmarshal(body, &rows); err != nil {
		result.Error = fmt.Sprintf("Parse error: %v", err)
		return result, nil
	}

	if len(rows) <= 1 {
		result.Error = "No snapshots found"
		return result, nil
	}

	// Skip header row
	rows = rows[1:]
	yearMap := map[int]int{}

	for _, row := range rows {
		if len(row) < 4 {
			continue
		}
		ts := row[0]
		orig := row[1]
		status := row[2]
		mime := row[3]

		var year int
		if len(ts) >= 4 {
			year, _ = strconv.Atoi(ts[:4])
		}

		archiveURL := fmt.Sprintf("https://web.archive.org/web/%s/%s", ts, orig)

		snap := SnapshotEntry{
			Timestamp:  formatTimestamp(ts),
			URL:        orig,
			StatusCode: status,
			MimeType:   mime,
			ArchiveURL: archiveURL,
			Year:       year,
		}
		result.Snapshots = append(result.Snapshots, snap)
		yearMap[year]++
	}

	result.Total = len(result.Snapshots)

	if result.Total > 0 {
		result.FirstSeen = result.Snapshots[0].Timestamp
		result.LastSeen = result.Snapshots[len(result.Snapshots)-1].Timestamp
	}

	// Build year summary
	for year, count := range yearMap {
		result.YearSummary = append(result.YearSummary, YearSummary{Year: year, Count: count})
	}
	sort.Slice(result.YearSummary, func(i, j int) bool {
		return result.YearSummary[i].Year < result.YearSummary[j].Year
	})

	// Keep only most recent 200 snapshots in response (avoid huge payload)
	if len(result.Snapshots) > 200 {
		result.Snapshots = result.Snapshots[len(result.Snapshots)-200:]
	}

	return result, nil
}

// formatTimestamp converts "20060102150405" to "2006-01-02 15:04:05".
func formatTimestamp(ts string) string {
	if len(ts) < 14 {
		return ts
	}
	t, err := time.Parse("20060102150405", ts[:14])
	if err != nil {
		return ts
	}
	return t.Format("2006-01-02 15:04:05")
}
