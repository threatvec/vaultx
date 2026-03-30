// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package main

import (
	"context"
	"encoding/json"
	"time"

	"vaultx/internal/domain"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// RunShadowScan starts a full domain scan and streams progress events.
func (a *App) RunShadowScan(cfg domain.ScanConfig) (*domain.ShadowScanResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 5*time.Minute)
	defer cancel()

	progress := make(chan domain.ScanProgress, 50)
	go func() {
		for p := range progress {
			wailsRuntime.EventsEmit(a.ctx, "shadowscan:progress", p)
		}
	}()

	result, err := domain.RunShadowScan(ctx, cfg, progress)
	if err != nil {
		return nil, err
	}

	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("shadowscan", cfg.Target, string(raw))
	}
	return result, nil
}

// LookupDNS performs DNS enumeration for a domain.
func (a *App) LookupDNS(target string) (*domain.DNSResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 30*time.Second)
	defer cancel()
	result, err := domain.LookupDNS(ctx, target)
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("dns", target, string(raw))
	}
	return result, nil
}

// InspectSSL analyzes SSL/TLS for a domain.
func (a *App) InspectSSL(target string) (*domain.SSLResult, error) {
	result, err := domain.InspectSSL(target)
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("ssl", target, string(raw))
	}
	return result, nil
}

// LookupWHOIS queries WHOIS data for a domain.
func (a *App) LookupWHOIS(target string) (*domain.WHOISResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 30*time.Second)
	defer cancel()
	result, err := domain.LookupWHOIS(ctx, target)
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("whois", target, string(raw))
	}
	return result, nil
}

// ScanURL scans a URL for threats.
func (a *App) ScanURL(rawURL string) (*domain.URLScanResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 30*time.Second)
	defer cancel()

	var vtKey string
	if a.db != nil {
		settings, _ := a.db.GetAllSettings()
		vtKey = settings["virustotal_api_key"]
	}

	result, err := domain.ScanURL(ctx, rawURL, vtKey)
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("urlscanner", rawURL, string(raw))
	}
	return result, nil
}

// GetHTTPHeaders fetches HTTP headers for a URL.
func (a *App) GetHTTPHeaders(rawURL string) (*domain.URLScanResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 30*time.Second)
	defer cancel()
	result, err := domain.ScanURL(ctx, rawURL, "")
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("httpheaders", rawURL, string(raw))
	}
	return result, nil
}

// FingerprintWeb detects technologies used by a website.
func (a *App) FingerprintWeb(targetURL string) (*domain.FingerprintResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 30*time.Second)
	defer cancel()
	result, err := domain.FingerprintWeb(ctx, targetURL)
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("fingerprint", targetURL, string(raw))
	}
	return result, nil
}

// AnalyzePhishing generates typosquatting variants and checks activity.
func (a *App) AnalyzePhishing(target string) (*domain.PhishingResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 60*time.Second)
	defer cancel()
	result, err := domain.AnalyzePhishing(ctx, target)
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("phishing", target, string(raw))
	}
	return result, nil
}

// GenerateDorks generates Google dork queries for a domain.
func (a *App) GenerateDorks(target string) []domain.DorkCategory {
	dorks := domain.GenerateDorks(target)
	if a.db != nil {
		raw, _ := json.Marshal(dorks)
		a.db.SaveQueryHistory("dorks", target, string(raw))
	}
	return dorks
}

// ExportShadowScanPDF generates a PDF report for a scan result.
func (a *App) ExportShadowScanPDF(result *domain.ShadowScanResult) ([]byte, error) {
	return domain.GeneratePDFReport(result)
}
