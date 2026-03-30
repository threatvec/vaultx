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
	"time"
)

// BreachEntry holds details about a single data breach.
type BreachEntry struct {
	Name        string   `json:"name"`
	Title       string   `json:"title"`
	Domain      string   `json:"domain"`
	BreachDate  string   `json:"breach_date"`
	AddedDate   string   `json:"added_date"`
	Description string   `json:"description"`
	DataClasses []string `json:"data_classes"`
	PwnCount    int      `json:"pwn_count"`
	IsVerified  bool     `json:"is_verified"`
	IsSensitive bool     `json:"is_sensitive"`
	LogoPath    string   `json:"logo_path"`
}

// EmailBreachResult holds HIBP breach check results for an email.
type EmailBreachResult struct {
	Email       string        `json:"email"`
	Found       bool          `json:"found"`
	BreachCount int           `json:"breach_count"`
	Breaches    []BreachEntry `json:"breaches"`
	Error       string        `json:"error,omitempty"`
}

type hibpBreachItem struct {
	Name        string   `json:"Name"`
	Title       string   `json:"Title"`
	Domain      string   `json:"Domain"`
	BreachDate  string   `json:"BreachDate"`
	AddedDate   string   `json:"AddedDate"`
	Description string   `json:"Description"`
	DataClasses []string `json:"DataClasses"`
	PwnCount    int      `json:"PwnCount"`
	IsVerified  bool     `json:"IsVerified"`
	IsSensitive bool     `json:"IsSensitive"`
	LogoPath    string   `json:"LogoPath"`
}

// CheckEmailBreach checks an email address against HaveIBeenPwned.
func CheckEmailBreach(ctx context.Context, email, hibpAPIKey string) (*EmailBreachResult, error) {
	if hibpAPIKey == "" {
		return &EmailBreachResult{Email: email, Error: "HaveIBeenPwned API key required (get free key at haveibeenpwned.com/API/Key)"}, nil
	}

	result := &EmailBreachResult{Email: email}
	client := &http.Client{Timeout: 15 * time.Second}

	apiURL := fmt.Sprintf("https://haveibeenpwned.com/api/v3/breachedaccount/%s?truncateResponse=false", url.PathEscape(email))
	req, err := http.NewRequestWithContext(ctx, "GET", apiURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("hibp-api-key", hibpAPIKey)
	req.Header.Set("User-Agent", "VAULTX-Security-Tool/1.0")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 404 {
		result.Found = false
		result.BreachCount = 0
		return result, nil
	}

	if resp.StatusCode == 401 {
		return &EmailBreachResult{Email: email, Error: "Invalid HIBP API key"}, nil
	}

	if resp.StatusCode == 429 {
		return &EmailBreachResult{Email: email, Error: "Rate limited by HaveIBeenPwned — please wait a moment"}, nil
	}

	if resp.StatusCode != 200 {
		return &EmailBreachResult{Email: email, Error: fmt.Sprintf("HIBP API error: HTTP %d", resp.StatusCode)}, nil
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var items []hibpBreachItem
	if err := json.Unmarshal(body, &items); err != nil {
		return nil, fmt.Errorf("HIBP parse error: %w", err)
	}

	result.Found = len(items) > 0
	result.BreachCount = len(items)

	for _, item := range items {
		result.Breaches = append(result.Breaches, BreachEntry{
			Name:        item.Name,
			Title:       item.Title,
			Domain:      item.Domain,
			BreachDate:  item.BreachDate,
			AddedDate:   item.AddedDate,
			Description: stripHTML(item.Description),
			DataClasses: item.DataClasses,
			PwnCount:    item.PwnCount,
			IsVerified:  item.IsVerified,
			IsSensitive: item.IsSensitive,
			LogoPath:    item.LogoPath,
		})
	}

	return result, nil
}

// CheckDomainBreach checks if a domain has been in any breach.
func CheckDomainBreach(ctx context.Context, domain, hibpAPIKey string) (*EmailBreachResult, error) {
	if hibpAPIKey == "" {
		return &EmailBreachResult{Email: domain, Error: "HaveIBeenPwned API key required"}, nil
	}

	result := &EmailBreachResult{Email: domain}
	client := &http.Client{Timeout: 15 * time.Second}

	apiURL := fmt.Sprintf("https://haveibeenpwned.com/api/v3/breaches?domain=%s", url.QueryEscape(domain))
	req, err := http.NewRequestWithContext(ctx, "GET", apiURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("hibp-api-key", hibpAPIKey)
	req.Header.Set("User-Agent", "VAULTX-Security-Tool/1.0")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == 200 {
		body, _ := io.ReadAll(resp.Body)
		var items []hibpBreachItem
		if err := json.Unmarshal(body, &items); err == nil {
			result.Found = len(items) > 0
			result.BreachCount = len(items)
			for _, item := range items {
				result.Breaches = append(result.Breaches, BreachEntry{
					Name:        item.Name,
					Title:       item.Title,
					Domain:      item.Domain,
					BreachDate:  item.BreachDate,
					DataClasses: item.DataClasses,
					PwnCount:    item.PwnCount,
					IsVerified:  item.IsVerified,
					LogoPath:    item.LogoPath,
				})
			}
		}
	}

	return result, nil
}

// stripHTML removes basic HTML tags from a string.
func stripHTML(s string) string {
	result := make([]byte, 0, len(s))
	inTag := false
	for i := 0; i < len(s); i++ {
		if s[i] == '<' {
			inTag = true
			continue
		}
		if s[i] == '>' {
			inTag = false
			continue
		}
		if !inTag {
			result = append(result, s[i])
		}
	}
	return string(result)
}
