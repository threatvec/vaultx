// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package auth

import (
	"context"
	"encoding/xml"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// PasteResult holds information about a single paste.
type PasteResult struct {
	Title     string `json:"title"`
	URL       string `json:"url"`
	Date      string `json:"date"`
	Snippet   string `json:"snippet"`
	MatchType string `json:"match_type"` // email, domain, keyword
}

// PasteMonitorResult holds paste monitoring results.
type PasteMonitorResult struct {
	Target  string        `json:"target"`
	Found   bool          `json:"found"`
	Count   int           `json:"count"`
	Pastes  []PasteResult `json:"pastes"`
	Error   string        `json:"error,omitempty"`
	Source  string        `json:"source"`
}

type rssItem struct {
	Title       string `xml:"title"`
	Link        string `xml:"link"`
	Description string `xml:"description"`
	PubDate     string `xml:"pubDate"`
}

type rssChannel struct {
	Items []rssItem `xml:"item"`
}

type rssFeed struct {
	Channel rssChannel `xml:"channel"`
}

// MonitorPastes checks Pastebin and other paste sites for mentions of the target.
func MonitorPastes(ctx context.Context, target string) (*PasteMonitorResult, error) {
	result := &PasteMonitorResult{
		Target: target,
		Source: "Pastebin RSS",
	}

	target = strings.TrimSpace(target)
	if target == "" {
		result.Error = "Target cannot be empty"
		return result, nil
	}

	pastes, err := searchPastebinRSS(ctx, target)
	if err != nil {
		result.Error = fmt.Sprintf("Pastebin search failed: %v", err)
		// Return partial result, not hard error
		return result, nil
	}

	result.Pastes = pastes
	result.Count = len(pastes)
	result.Found = len(pastes) > 0

	return result, nil
}

func searchPastebinRSS(ctx context.Context, query string) ([]PasteResult, error) {
	// Pastebin search RSS endpoint
	searchURL := fmt.Sprintf("https://pastebin.com/search?q=%s&output=rss",
		strings.ReplaceAll(query, " ", "+"))

	client := &http.Client{Timeout: 15 * time.Second}
	req, err := http.NewRequestWithContext(ctx, "GET", searchURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 429 {
		return nil, fmt.Errorf("rate limited by Pastebin")
	}
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("Pastebin returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, err
	}

	return parseRSSFeed(string(body), query)
}

func parseRSSFeed(feedXML, query string) ([]PasteResult, error) {
	var feed rssFeed
	err := xml.Unmarshal([]byte(feedXML), &feed)
	if err != nil {
		// Try to manually extract items if XML parsing fails
		return extractPastesManually(feedXML, query), nil
	}

	var pastes []PasteResult
	queryLower := strings.ToLower(query)

	for _, item := range feed.Channel.Items {
		desc := item.Description
		titleLower := strings.ToLower(item.Title)
		descLower := strings.ToLower(desc)

		// Determine match type
		matchType := "keyword"
		if strings.Contains(query, "@") {
			matchType = "email"
		} else if strings.Contains(query, ".") && !strings.Contains(query, " ") {
			matchType = "domain"
		}

		// Check if query appears in title or description
		if !strings.Contains(titleLower, queryLower) && !strings.Contains(descLower, queryLower) {
			continue
		}

		// Create snippet
		snippet := extractSnippet(desc, query, 200)

		pastes = append(pastes, PasteResult{
			Title:     item.Title,
			URL:       item.Link,
			Date:      item.PubDate,
			Snippet:   snippet,
			MatchType: matchType,
		})
	}

	return pastes, nil
}

func extractPastesManually(feedXML, query string) []PasteResult {
	var pastes []PasteResult
	queryLower := strings.ToLower(query)

	// Simple regex-free extraction
	parts := strings.Split(feedXML, "<item>")
	for i := 1; i < len(parts); i++ {
		item := parts[i]

		title := extractXMLTag(item, "title")
		link := extractXMLTag(item, "link")
		desc := extractXMLTag(item, "description")
		pubDate := extractXMLTag(item, "pubDate")

		if strings.Contains(strings.ToLower(title+desc), queryLower) {
			snippet := extractSnippet(desc, query, 200)

			matchType := "keyword"
			if strings.Contains(query, "@") {
				matchType = "email"
			} else if strings.Contains(query, ".") && !strings.Contains(query, " ") {
				matchType = "domain"
			}

			pastes = append(pastes, PasteResult{
				Title:     title,
				URL:       link,
				Date:      pubDate,
				Snippet:   snippet,
				MatchType: matchType,
			})
		}
	}
	return pastes
}

func extractXMLTag(xml, tag string) string {
	start := "<" + tag + ">"
	end := "</" + tag + ">"
	sIdx := strings.Index(xml, start)
	eIdx := strings.Index(xml, end)
	if sIdx < 0 || eIdx < 0 || eIdx <= sIdx {
		return ""
	}
	return strings.TrimSpace(xml[sIdx+len(start) : eIdx])
}

func extractSnippet(text, query string, maxLen int) string {
	// Strip HTML tags
	text = stripHTMLTags(text)

	// Find query position
	queryLower := strings.ToLower(query)
	textLower := strings.ToLower(text)
	idx := strings.Index(textLower, queryLower)

	var snippet string
	if idx >= 0 {
		start := idx - 50
		if start < 0 {
			start = 0
		}
		end := idx + len(query) + 150
		if end > len(text) {
			end = len(text)
		}
		snippet = text[start:end]
		if start > 0 {
			snippet = "..." + snippet
		}
		if end < len(text) {
			snippet = snippet + "..."
		}
	} else {
		if len(text) > maxLen {
			snippet = text[:maxLen] + "..."
		} else {
			snippet = text
		}
	}

	return strings.TrimSpace(snippet)
}

func stripHTMLTags(html string) string {
	var sb strings.Builder
	inTag := false
	for _, c := range html {
		if c == '<' {
			inTag = true
		} else if c == '>' {
			inTag = false
			sb.WriteRune(' ')
		} else if !inTag {
			sb.WriteRune(c)
		}
	}
	// Collapse multiple spaces
	result := sb.String()
	for strings.Contains(result, "  ") {
		result = strings.ReplaceAll(result, "  ", " ")
	}
	return strings.TrimSpace(result)
}
