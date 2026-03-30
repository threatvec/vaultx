// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package threat

import (
	"bytes"
	"context"
	"crypto/sha1"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gen2brain/beeep"
)

// WatchType represents the type of monitored target.
type WatchType string

const (
	WatchEmail    WatchType = "email"
	WatchDomain   WatchType = "domain"
	WatchIP       WatchType = "ip"
	WatchUsername WatchType = "username"
)

// WatchTarget represents a monitored entity.
type WatchTarget struct {
	ID        int       `json:"id"`
	Type      WatchType `json:"type"`
	Value     string    `json:"value"`
	AddedAt   time.Time `json:"added_at"`
	LastCheck time.Time `json:"last_check"`
	RiskScore int       `json:"risk_score"`
	Enabled   bool      `json:"enabled"`
}

// BreachResult represents a discovered breach or alert.
type BreachResult struct {
	Target      string    `json:"target"`
	TargetType  WatchType `json:"target_type"`
	Source      string    `json:"source"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	BreachDate  string    `json:"breach_date"`
	IsNew       bool      `json:"is_new"`
	DetectedAt  time.Time `json:"detected_at"`
}

// NightWatcher monitors targets for breaches and threats.
type NightWatcher struct {
	mu             sync.RWMutex
	targets        []WatchTarget
	knownBreaches  map[string]bool
	discordWebhook string
	onAlert        func(*BreachResult)
	stopChan       chan struct{}
}

// HIBPBreach represents a Have I Been Pwned breach entry.
type HIBPBreach struct {
	Name        string `json:"Name"`
	Title       string `json:"Title"`
	BreachDate  string `json:"BreachDate"`
	Description string `json:"Description"`
	IsVerified  bool   `json:"IsVerified"`
}

// NewNightWatcher creates a new watcher instance.
func NewNightWatcher(discordWebhook string, onAlert func(*BreachResult)) *NightWatcher {
	return &NightWatcher{
		knownBreaches:  make(map[string]bool),
		discordWebhook: discordWebhook,
		onAlert:        onAlert,
		stopChan:       make(chan struct{}),
	}
}

// Start begins the background monitoring loop (checks every 6 hours).
func (w *NightWatcher) Start(ctx context.Context) {
	w.checkAll(ctx)
	ticker := time.NewTicker(6 * time.Hour)
	defer ticker.Stop()
	for {
		select {
		case <-w.stopChan:
			return
		case <-ctx.Done():
			return
		case <-ticker.C:
			w.checkAll(ctx)
		}
	}
}

// Stop halts the monitoring loop.
func (w *NightWatcher) Stop() {
	select {
	case <-w.stopChan:
	default:
		close(w.stopChan)
	}
}

// AddTarget adds a new target to monitor.
func (w *NightWatcher) AddTarget(t WatchTarget) {
	t.AddedAt = time.Now()
	t.Enabled = true
	w.mu.Lock()
	w.targets = append(w.targets, t)
	w.mu.Unlock()
}

// RemoveTarget removes a target by value.
func (w *NightWatcher) RemoveTarget(value string) {
	w.mu.Lock()
	defer w.mu.Unlock()
	var remaining []WatchTarget
	for _, t := range w.targets {
		if t.Value != value {
			remaining = append(remaining, t)
		}
	}
	w.targets = remaining
}

// GetTargets returns all monitored targets.
func (w *NightWatcher) GetTargets() []WatchTarget {
	w.mu.RLock()
	defer w.mu.RUnlock()
	result := make([]WatchTarget, len(w.targets))
	copy(result, w.targets)
	return result
}

// checkAll runs checks on all enabled targets.
func (w *NightWatcher) checkAll(ctx context.Context) {
	w.mu.RLock()
	targets := make([]WatchTarget, len(w.targets))
	copy(targets, w.targets)
	w.mu.RUnlock()

	for i := range targets {
		if !targets[i].Enabled {
			continue
		}
		select {
		case <-ctx.Done():
			return
		default:
		}
		w.checkTarget(ctx, &targets[i])
		time.Sleep(200 * time.Millisecond)
	}

	w.mu.Lock()
	for i := range w.targets {
		w.targets[i].LastCheck = time.Now()
	}
	w.mu.Unlock()
}

// checkTarget checks a single target based on its type.
func (w *NightWatcher) checkTarget(ctx context.Context, target *WatchTarget) {
	switch target.Type {
	case WatchEmail:
		w.checkEmailHIBP(ctx, target)
	case WatchDomain:
		w.checkDomainHIBP(ctx, target)
	}
}

// checkEmailHIBP checks an email against HIBP API.
func (w *NightWatcher) checkEmailHIBP(ctx context.Context, target *WatchTarget) {
	client := &http.Client{Timeout: 15 * time.Second}
	req, err := http.NewRequestWithContext(ctx, "GET",
		fmt.Sprintf("https://haveibeenpwned.com/api/v3/breachedaccount/%s", target.Value),
		nil)
	if err != nil {
		return
	}
	req.Header.Set("User-Agent", "VAULTX-NightWatch/1.0")
	req.Header.Set("hibp-api-key", "")

	resp, err := client.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return
	}
	if resp.StatusCode != http.StatusOK {
		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return
	}

	var breaches []HIBPBreach
	if err := json.Unmarshal(body, &breaches); err != nil {
		return
	}

	for _, breach := range breaches {
		key := fmt.Sprintf("%s:%s", target.Value, breach.Name)
		w.mu.RLock()
		known := w.knownBreaches[key]
		w.mu.RUnlock()

		if !known {
			w.mu.Lock()
			w.knownBreaches[key] = true
			w.mu.Unlock()

			result := &BreachResult{
				Target:      target.Value,
				TargetType:  WatchEmail,
				Source:      "HaveIBeenPwned",
				Title:       breach.Title,
				Description: breach.Description,
				BreachDate:  breach.BreachDate,
				IsNew:       true,
				DetectedAt:  time.Now(),
			}

			w.notify(result)
		}
	}
}

// checkDomainHIBP checks a domain against HIBP domain search.
func (w *NightWatcher) checkDomainHIBP(ctx context.Context, target *WatchTarget) {
	client := &http.Client{Timeout: 15 * time.Second}
	req, err := http.NewRequestWithContext(ctx, "GET",
		fmt.Sprintf("https://haveibeenpwned.com/api/v3/breaches?domain=%s", target.Value),
		nil)
	if err != nil {
		return
	}
	req.Header.Set("User-Agent", "VAULTX-NightWatch/1.0")

	resp, err := client.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return
	}

	var breaches []HIBPBreach
	if err := json.Unmarshal(body, &breaches); err != nil {
		return
	}

	for _, breach := range breaches {
		key := fmt.Sprintf("%s:%s", target.Value, breach.Name)
		w.mu.RLock()
		known := w.knownBreaches[key]
		w.mu.RUnlock()

		if !known {
			w.mu.Lock()
			w.knownBreaches[key] = true
			w.mu.Unlock()

			result := &BreachResult{
				Target:      target.Value,
				TargetType:  WatchDomain,
				Source:      "HaveIBeenPwned",
				Title:       breach.Title,
				Description: breach.Description,
				BreachDate:  breach.BreachDate,
				IsNew:       true,
				DetectedAt:  time.Now(),
			}
			w.notify(result)
		}
	}
}

// CheckPasswordBreach uses HIBP k-anonymity API to check a password hash.
func CheckPasswordBreach(ctx context.Context, password string) (int, error) {
	hash := fmt.Sprintf("%X", sha1.Sum([]byte(password)))
	prefix := hash[:5]
	suffix := hash[5:]

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequestWithContext(ctx, "GET",
		fmt.Sprintf("https://api.pwnedpasswords.com/range/%s", prefix),
		nil)
	if err != nil {
		return 0, err
	}
	req.Header.Set("User-Agent", "VAULTX/1.0")

	resp, err := client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, err
	}

	for _, line := range strings.Split(string(body), "\r\n") {
		parts := strings.Split(line, ":")
		if len(parts) == 2 && strings.EqualFold(parts[0], suffix) {
			count := 0
			fmt.Sscanf(parts[1], "%d", &count)
			return count, nil
		}
	}
	return 0, nil
}

// notify sends alerts via system notification and Discord webhook.
func (w *NightWatcher) notify(result *BreachResult) {
	if w.onAlert != nil {
		w.onAlert(result)
	}

	beeep.Notify("VAULTX NightWatch Alert",
		fmt.Sprintf("Breach detected for %s: %s", result.Target, result.Title),
		"")

	if w.discordWebhook != "" {
		w.sendDiscordAlert(result)
	}
}

// sendDiscordAlert sends a breach notification to a Discord webhook.
func (w *NightWatcher) sendDiscordAlert(result *BreachResult) {
	payload := map[string]interface{}{
		"username": "VAULTX NightWatch",
		"embeds": []map[string]interface{}{
			{
				"title":       fmt.Sprintf("🚨 Breach Alert: %s", result.Title),
				"description": fmt.Sprintf("Target **%s** found in breach **%s**", result.Target, result.Title),
				"color":       16711680,
				"fields": []map[string]string{
					{"name": "Target", "value": result.Target, "inline": "true"},
					{"name": "Source", "value": result.Source, "inline": "true"},
					{"name": "Breach Date", "value": result.BreachDate, "inline": "true"},
				},
				"footer": map[string]string{
					"text": "VAULTX by threatvec & talkdedsec",
				},
				"timestamp": result.DetectedAt.Format(time.RFC3339),
			},
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Post(w.discordWebhook, "application/json", bytes.NewReader(body))
	if err != nil {
		return
	}
	resp.Body.Close()
}
