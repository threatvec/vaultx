// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package identity

import (
	"context"
	"strings"
	"sync"
)

// OSINTTarget type hint
type TargetType string

const (
	TargetDomain   TargetType = "domain"
	TargetEmail    TargetType = "email"
	TargetUsername TargetType = "username"
)

// OSINTModuleStatus tracks the state of one dashboard module.
type OSINTModuleStatus struct {
	Name    string `json:"name"`
	Status  string `json:"status"` // "running","done","error","skipped"
	Message string `json:"message"`
}

// OSINTDashboardResult holds the aggregated OSINT scan result.
type OSINTDashboardResult struct {
	Target      string               `json:"target"`
	TargetType  TargetType           `json:"target_type"`
	Modules     []OSINTModuleStatus  `json:"modules"`
	Username    *UsernameSearchResult `json:"username,omitempty"`
	EmailBreach *EmailBreachResult    `json:"email_breach,omitempty"`
	Wayback     *WaybackResult        `json:"wayback,omitempty"`
	Dorks       *DorkResult           `json:"dorks,omitempty"`
	RiskScore   int                   `json:"risk_score"`
	RiskLevel   string                `json:"risk_level"`
	Error       string                `json:"error,omitempty"`
}

// RunOSINTDashboard performs a parallel multi-module OSINT scan.
func RunOSINTDashboard(ctx context.Context, target, hibpKey string, progressCh chan<- OSINTModuleStatus) (*OSINTDashboardResult, error) {
	result := &OSINTDashboardResult{
		Target:     target,
		TargetType: detectTargetType(target),
	}

	var mu sync.Mutex
	var wg sync.WaitGroup

	setModule := func(name, status, msg string) {
		s := OSINTModuleStatus{Name: name, Status: status, Message: msg}
		mu.Lock()
		result.Modules = append(result.Modules, s)
		mu.Unlock()
		if progressCh != nil {
			select {
			case progressCh <- s:
			default:
			}
		}
	}

	// Username search (for all target types)
	wg.Add(1)
	go func() {
		defer wg.Done()
		setModule("Username Search", "running", "Checking 100+ platforms...")
		r, err := SearchUsername(ctx, target, nil)
		if err != nil {
			setModule("Username Search", "error", err.Error())
			return
		}
		mu.Lock()
		result.Username = r
		mu.Unlock()
		setModule("Username Search", "done", formatFoundMsg(r.FoundCount, r.Total, "platform"))
	}()

	// Email breach (only for email targets)
	if result.TargetType == TargetEmail {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if hibpKey == "" {
				setModule("Email Breach Check", "skipped", "HIBP API key required")
				return
			}
			setModule("Email Breach Check", "running", "Checking HaveIBeenPwned...")
			r, err := CheckEmailBreach(ctx, target, hibpKey)
			if err != nil {
				setModule("Email Breach Check", "error", err.Error())
				return
			}
			mu.Lock()
			result.EmailBreach = r
			mu.Unlock()
			if r.Found {
				setModule("Email Breach Check", "done", formatFoundMsg(r.BreachCount, 0, "breach"))
			} else {
				setModule("Email Breach Check", "done", "No breaches found")
			}
		}()
	}

	// Wayback (for domain targets)
	domainTarget := extractDomain(target)
	if domainTarget != "" {
		wg.Add(1)
		go func() {
			defer wg.Done()
			setModule("Wayback Machine", "running", "Fetching archive snapshots...")
			r, err := LookupWayback(ctx, domainTarget)
			if err != nil {
				setModule("Wayback Machine", "error", err.Error())
				return
			}
			mu.Lock()
			result.Wayback = r
			mu.Unlock()
			setModule("Wayback Machine", "done", formatFoundMsg(r.Total, 0, "snapshot"))
		}()

		// Google Dorks (instant, no API needed)
		wg.Add(1)
		go func() {
			defer wg.Done()
			setModule("Google Dorks", "running", "Generating dork queries...")
			r := GenerateDorks(domainTarget)
			mu.Lock()
			result.Dorks = r
			mu.Unlock()
			setModule("Google Dorks", "done", formatFoundMsg(r.Total, 0, "dork"))
		}()
	}

	wg.Wait()

	// Calculate risk score
	score := 0
	if result.EmailBreach != nil && result.EmailBreach.Found {
		score += result.EmailBreach.BreachCount * 10
	}
	if result.Username != nil {
		score += result.Username.FoundCount
	}
	if score > 100 {
		score = 100
	}
	result.RiskScore = score
	switch {
	case score >= 70:
		result.RiskLevel = "critical"
	case score >= 40:
		result.RiskLevel = "high"
	case score >= 20:
		result.RiskLevel = "medium"
	default:
		result.RiskLevel = "low"
	}

	return result, nil
}

// detectTargetType guesses the type of an OSINT target.
func detectTargetType(target string) TargetType {
	if strings.Contains(target, "@") {
		return TargetEmail
	}
	if strings.Contains(target, ".") && !strings.Contains(target, " ") {
		return TargetDomain
	}
	return TargetUsername
}

// extractDomain pulls a domain from an email or returns the value as-is.
func extractDomain(target string) string {
	if strings.Contains(target, "@") {
		parts := strings.Split(target, "@")
		if len(parts) == 2 {
			return parts[1]
		}
	}
	if strings.Contains(target, ".") {
		return target
	}
	return ""
}

func formatFoundMsg(count, total int, unit string) string {
	if total > 0 {
		msg := strings.Replace("Found X of Y Zs", "X", itoa(count), 1)
		msg = strings.Replace(msg, "Y", itoa(total), 1)
		msg = strings.Replace(msg, "Zs", unit+"s", 1)
		return msg
	}
	return strings.Replace("Found X "+unit+"s", "X", itoa(count), 1)
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	s := ""
	for n > 0 {
		s = string(rune('0'+n%10)) + s
		n /= 10
	}
	return s
}
