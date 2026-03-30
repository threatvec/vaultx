// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"vaultx/internal/ai"
	"vaultx/internal/db"
	"vaultx/internal/projects"
	"vaultx/internal/scanner"
	"vaultx/internal/scheduler"
	"vaultx/internal/threat"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// App is the main application struct that holds all module references.
type App struct {
	ctx          context.Context
	db           *db.Database
	aiManager    *ai.Manager
	clipboard    *ClipboardWatcher
	updater      *Updater
	nightWatcher *threat.NightWatcher
	scheduler    *scheduler.Scheduler
	projects     *projects.Manager
}

// NewApp creates a new App application struct.
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	database, err := db.NewDatabase()
	if err != nil {
		log.Printf("Database init error: %v", err)
	}
	a.db = database

	a.aiManager = ai.NewManager(a.db)

	a.updater = NewUpdater()
	updateAvailable, latestVersion, err := a.updater.CheckUpdate()
	if err != nil {
		log.Printf("Update check error: %v", err)
	}
	if updateAvailable {
		wailsRuntime.EventsEmit(ctx, "update:available", latestVersion)
	}

	a.clipboard = NewClipboardWatcher(ctx)
	go a.clipboard.Start()

	ollamaAvailable := a.aiManager.DetectOllama()
	wailsRuntime.EventsEmit(ctx, "ai:ollama-status", ollamaAvailable)

	// Initialize NightWatcher (only if DB is available)
	var settings map[string]string
	if a.db != nil {
		settings, _ = a.db.GetAllSettings()
	}
	if settings == nil {
		settings = make(map[string]string)
	}

	discordWebhook := settings["discord_webhook"]
	a.nightWatcher = threat.NewNightWatcher(discordWebhook, func(result *threat.BreachResult) {
		wailsRuntime.EventsEmit(ctx, "nightwatch:alert", result)
	})
	go a.nightWatcher.Start(ctx)

	// Initialize scheduler
	a.scheduler = scheduler.NewScheduler(func(tool, target string) (string, error) {
		return fmt.Sprintf("scheduled scan: tool=%s target=%s", tool, target), nil
	})
	go a.scheduler.Start(ctx)

	// Initialize projects manager
	a.projects = projects.NewManager()
}

// shutdown is called when the app is closing.
func (a *App) shutdown(ctx context.Context) {
	if a.clipboard != nil {
		a.clipboard.Stop()
	}
	if a.nightWatcher != nil {
		a.nightWatcher.Stop()
	}
	if a.scheduler != nil {
		a.scheduler.Stop()
	}
	if a.db != nil {
		a.db.Close()
	}
}

// GetVersion returns the current application version.
func (a *App) GetVersion() string {
	return CurrentVersion
}

// CheckForUpdate checks if a new version is available.
func (a *App) CheckForUpdate() (bool, string, error) {
	return a.updater.CheckUpdate()
}

// GetOllamaStatus returns whether Ollama is available.
func (a *App) GetOllamaStatus() bool {
	return a.aiManager.DetectOllama()
}

// QueryAI sends a prompt to the active AI provider and returns the response.
func (a *App) QueryAI(prompt string) (string, error) {
	return a.aiManager.Query(prompt)
}

// AnalyzeWithAI sends scan results to AI for analysis.
func (a *App) AnalyzeWithAI(toolName, resultJSON string) (string, error) {
	return a.aiManager.AnalyzeScanResult(toolName, resultJSON)
}

// GenerateWeeklyReport generates a weekly security report using AI.
func (a *App) GenerateWeeklyReport() (string, error) {
	// Collect last 7 days of scan history
	tools := []string{
		"shadowscan", "urlscanner", "whoislookup", "dnsanalyzer", "sslinspector",
		"httpheaders", "webfingerprint", "phishing", "ipreputaton", "cvesearch",
		"ipintelligence", "portscan", "metadata", "exif", "hashlookup",
		"usernamesearch", "emailbreach", "passwordanalyzer", "emailheader",
	}
	var history []map[string]string
	for _, tool := range tools {
		rows, err := a.db.GetQueryHistory(tool, 20)
		if err != nil {
			continue
		}
		for _, row := range rows {
			history = append(history, map[string]string{
				"tool":   row.Tool,
				"query":  row.Query,
				"result": row.Result,
			})
		}
	}
	return a.aiManager.GenerateWeeklyReport(history)
}

// GetAIProvider returns the currently active AI provider name.
func (a *App) GetAIProvider() string {
	return a.aiManager.GetActiveProvider()
}

// TestOllamaConnection tests if Ollama is reachable at the given URL via Go backend.
func (a *App) TestOllamaConnection(url string) bool {
	if url == "" {
		url = "http://localhost:11434"
	}
	return a.aiManager.TestOllamaURL(url)
}

// ListOllamaModels returns available Ollama models using the configured URL.
func (a *App) ListOllamaModels() ([]ai.OllamaModelInfo, error) {
	url := "http://localhost:11434"
	if a.db != nil {
		if settings, err := a.db.GetAllSettings(); err == nil {
			if u := settings["ollama_url"]; u != "" {
				url = u
			}
		}
	}
	return a.aiManager.ListOllamaModelsFromURL(url)
}

// SetAIProvider saves the preferred AI provider and credentials.
func (a *App) SetAIProvider(provider, apiKey, model string) error {
	return a.aiManager.SetProvider(provider, apiKey, model)
}

// TestAIProvider tests a specific AI provider connection.
func (a *App) TestAIProvider(provider, apiKey, model string) (*ai.ProviderStatus, error) {
	return a.aiManager.TestProvider(provider, apiKey, model)
}

// GetAIHistory returns the last N AI messages from history.
func (a *App) GetAIHistory(limit int) ([]map[string]string, error) {
	if a.db == nil {
		return nil, nil
	}
	rows, err := a.db.GetQueryHistory("ai_chat", limit)
	if err != nil {
		return nil, err
	}
	var messages []map[string]string
	for _, r := range rows {
		messages = append(messages, map[string]string{
			"role":      r.Query,
			"content":   r.Result,
			"timestamp": r.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}
	return messages, nil
}

// SaveAIMessage saves an AI chat message to history.
func (a *App) SaveAIMessage(role, content string) error {
	if a.db != nil {
		return a.db.SaveQueryHistory("ai_chat", role, content)
	}
	return nil
}

// RunSelfScan performs a comprehensive self-scan with live progress.
func (a *App) RunSelfScan() (*scanner.SelfScanResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 60*time.Second)
	defer cancel()

	progressFn := func(step scanner.ScanStep) {
		wailsRuntime.EventsEmit(a.ctx, "scanme:progress", step)
	}

	result, err := scanner.RunSelfScan(ctx, progressFn)
	if err != nil {
		return nil, err
	}

	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("scanme", "self", string(raw))
		a.checkBadges("scanme")
	}
	return result, nil
}

// GetBadges returns all earned badges.
func (a *App) GetBadges() ([]db.Badge, error) {
	if a.db == nil {
		return nil, nil
	}
	return a.db.GetBadges()
}

// GetDashboardStats returns aggregated stats for the dashboard.
func (a *App) GetDashboardStats() map[string]interface{} {
	stats := map[string]interface{}{
		"totalScans":       0,
		"threatsDetected":  0,
		"securityScore":    0,
		"activeMonitors":   0,
		"badgeCount":       0,
	}
	if a.db == nil {
		return stats
	}
	total := a.db.GetTotalQueryCount()
	stats["totalScans"] = total

	threats := a.db.GetToolQueryCount("ipreputaton") + a.db.GetToolQueryCount("cvesearch") + a.db.GetToolQueryCount("emailbreach")
	stats["threatsDetected"] = threats

	// Get last scan-me score
	history, err := a.db.GetQueryHistory("scanme", 1)
	if err == nil && len(history) > 0 {
		var scanResult scanner.SelfScanResult
		if json.Unmarshal([]byte(history[0].Result), &scanResult) == nil {
			stats["securityScore"] = scanResult.SecurityScore
		}
	}

	// Active monitors
	monitors := a.db.GetToolQueryCount("nightwatch")
	stats["activeMonitors"] = monitors

	badges, _ := a.db.GetBadges()
	stats["badgeCount"] = len(badges)

	return stats
}

// GetRecentActivity returns the last N activities.
func (a *App) GetRecentActivity(limit int) ([]map[string]string, error) {
	if a.db == nil {
		return nil, nil
	}
	history, err := a.db.GetRecentActivity(limit)
	if err != nil {
		return nil, err
	}
	var items []map[string]string
	for _, h := range history {
		items = append(items, map[string]string{
			"tool":      h.Tool,
			"query":     h.Query,
			"timestamp": h.CreatedAt.Format("2006-01-02 15:04"),
		})
	}
	return items, nil
}

// checkBadges checks and awards badges based on activity.
func (a *App) checkBadges(tool string) {
	if a.db == nil {
		return
	}

	total := a.db.GetTotalQueryCount()

	// First Scan badge
	if total >= 1 {
		earned, _ := a.db.EarnBadge("First Step", "Completed your first scan", "🔰")
		if earned {
			wailsRuntime.EventsEmit(a.ctx, "badge:earned", map[string]string{"name": "First Step", "icon": "🔰"})
		}
	}

	// Researcher
	if total >= 50 {
		earned, _ := a.db.EarnBadge("Researcher", "Completed 50 scans", "🔍")
		if earned {
			wailsRuntime.EventsEmit(a.ctx, "badge:earned", map[string]string{"name": "Researcher", "icon": "🔍"})
		}
	}

	// Security Expert
	if total >= 500 {
		earned, _ := a.db.EarnBadge("Security Expert", "Completed 500 scans", "🛡️")
		if earned {
			wailsRuntime.EventsEmit(a.ctx, "badge:earned", map[string]string{"name": "Security Expert", "icon": "🛡️"})
		}
	}

	// Breach Hunter
	breachCount := a.db.GetToolQueryCount("emailbreach")
	if breachCount >= 10 {
		earned, _ := a.db.EarnBadge("Breach Hunter", "Checked 10 email breaches", "🎯")
		if earned {
			wailsRuntime.EventsEmit(a.ctx, "badge:earned", map[string]string{"name": "Breach Hunter", "icon": "🎯"})
		}
	}

	// Network Detective
	portCount := a.db.GetToolQueryCount("portscan")
	if portCount >= 20 {
		earned, _ := a.db.EarnBadge("Network Detective", "Performed 20 port scans", "🌐")
		if earned {
			wailsRuntime.EventsEmit(a.ctx, "badge:earned", map[string]string{"name": "Network Detective", "icon": "🌐"})
		}
	}

	// OSINT Master
	osintCount := a.db.GetToolQueryCount("usernamesearch")
	if osintCount >= 5 {
		earned, _ := a.db.EarnBadge("OSINT Master", "Performed 5 username searches", "👁️")
		if earned {
			wailsRuntime.EventsEmit(a.ctx, "badge:earned", map[string]string{"name": "OSINT Master", "icon": "👁️"})
		}
	}

	// NightWatch Guardian
	watchCount := a.db.GetToolQueryCount("nightwatch")
	if watchCount >= 1 {
		earned, _ := a.db.EarnBadge("NightWatch Guardian", "Set up NightWatch monitoring", "🦉")
		if earned {
			wailsRuntime.EventsEmit(a.ctx, "badge:earned", map[string]string{"name": "NightWatch Guardian", "icon": "🦉"})
		}
	}

	// AI Analyst
	aiCount := a.db.GetToolQueryCount("ai_chat")
	if aiCount >= 10 {
		earned, _ := a.db.EarnBadge("AI Analyst", "Asked 10 AI questions", "🤖")
		if earned {
			wailsRuntime.EventsEmit(a.ctx, "badge:earned", map[string]string{"name": "AI Analyst", "icon": "🤖"})
		}
	}

	// Self-Aware
	if tool == "scanme" {
		earned, _ := a.db.EarnBadge("Self-Aware", "Ran your first self-scan", "🪞")
		if earned {
			wailsRuntime.EventsEmit(a.ctx, "badge:earned", map[string]string{"name": "Self-Aware", "icon": "🪞"})
		}
	}
}

// GetSettings returns all settings from the database.
func (a *App) GetSettings() (map[string]string, error) {
	if a.db == nil {
		return make(map[string]string), nil
	}
	return a.db.GetAllSettings()
}

// SaveSetting saves a key-value setting to the database.
func (a *App) SaveSetting(key, value string) error {
	if a.db == nil {
		return fmt.Errorf("database not available")
	}
	return a.db.SaveSetting(key, value)
}

// GetQueryHistory returns the last N queries from history.
func (a *App) GetQueryHistory(toolName string, limit int) ([]db.QueryHistory, error) {
	if a.db == nil {
		return nil, nil
	}
	return a.db.GetQueryHistory(toolName, limit)
}

// GetClipboardWatcherEnabled returns the clipboard watcher state.
func (a *App) GetClipboardWatcherEnabled() bool {
	if a.clipboard == nil {
		return false
	}
	return a.clipboard.enabled
}

// SetClipboardWatcherEnabled enables or disables the clipboard watcher.
func (a *App) SetClipboardWatcherEnabled(enabled bool) {
	if a.clipboard != nil {
		a.clipboard.enabled = enabled
	}
}
