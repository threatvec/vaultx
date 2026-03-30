// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package domain

import (
	"context"
	"strings"
	"time"
	"unicode"

	"github.com/likexian/whois"
)

// WHOISResult holds parsed WHOIS data for a domain.
type WHOISResult struct {
	Domain      string    `json:"domain"`
	Registrar   string    `json:"registrar"`
	CreatedDate string    `json:"created_date"`
	UpdatedDate string    `json:"updated_date"`
	ExpiryDate  string    `json:"expiry_date"`
	Status      []string  `json:"status"`
	Nameservers []string  `json:"nameservers"`
	RawText     string    `json:"raw_text"`
	DaysUntilExpiry int   `json:"days_until_expiry"`
	Error       string    `json:"error,omitempty"`
}

// LookupWHOIS queries WHOIS data for the given domain.
func LookupWHOIS(ctx context.Context, domain string) (*WHOISResult, error) {
	result := &WHOISResult{Domain: domain}

	done := make(chan error, 1)
	var raw string
	go func() {
		var err error
		raw, err = whois.Whois(domain)
		done <- err
	}()

	select {
	case <-ctx.Done():
		result.Error = "request timed out"
		return result, nil
	case err := <-done:
		if err != nil {
			result.Error = err.Error()
			return result, nil
		}
	}

	result.RawText = raw
	result.Registrar = extractField(raw, []string{"Registrar:", "registrar:"})
	result.CreatedDate = extractField(raw, []string{
		"Creation Date:", "Created Date:", "created:", "Created:", "Registration Time:",
	})
	result.UpdatedDate = extractField(raw, []string{
		"Updated Date:", "Last Modified:", "Last Updated:", "modified:", "Updated:",
	})
	result.ExpiryDate = extractField(raw, []string{
		"Registry Expiry Date:", "Expiry Date:", "Expiration Date:", "expires:", "Expires:",
	})
	result.Status = extractMultiField(raw, []string{"Domain Status:", "Status:"})
	result.Nameservers = extractMultiField(raw, []string{"Name Server:", "Nameserver:", "nserver:"})

	if result.ExpiryDate != "" {
		formats := []string{
			"2006-01-02T15:04:05Z",
			"2006-01-02",
			"02-Jan-2006",
			"2006.01.02",
		}
		for _, f := range formats {
			t, err := time.Parse(f, strings.TrimSpace(result.ExpiryDate))
			if err == nil {
				result.DaysUntilExpiry = int(time.Until(t).Hours() / 24)
				break
			}
		}
	}

	return result, nil
}

// extractField extracts the first matching field value from raw WHOIS text.
func extractField(raw string, keys []string) string {
	for _, line := range strings.Split(raw, "\n") {
		line = strings.TrimSpace(line)
		for _, key := range keys {
			if strings.HasPrefix(strings.ToLower(line), strings.ToLower(key)) {
				val := strings.TrimSpace(line[len(key):])
				val = strings.TrimFunc(val, func(r rune) bool {
					return !unicode.IsPrint(r)
				})
				if val != "" {
					return val
				}
			}
		}
	}
	return ""
}

// extractMultiField extracts multiple values for a field from raw WHOIS text.
func extractMultiField(raw string, keys []string) []string {
	var results []string
	seen := make(map[string]bool)
	for _, line := range strings.Split(raw, "\n") {
		line = strings.TrimSpace(line)
		for _, key := range keys {
			if strings.HasPrefix(strings.ToLower(line), strings.ToLower(key)) {
				val := strings.TrimSpace(line[len(key):])
				val = strings.ToLower(val)
				if val != "" && !seen[val] {
					seen[val] = true
					results = append(results, strings.TrimSpace(line[len(key):]))
				}
			}
		}
	}
	return results
}
