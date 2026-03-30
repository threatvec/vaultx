// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package main

import (
	"context"
	"encoding/json"
	"time"

	"vaultx/internal/identity"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// SearchUsername checks 100+ platforms for a username with live progress events.
func (a *App) SearchUsername(username string) (*identity.UsernameSearchResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 120*time.Second)
	defer cancel()

	progressCh := make(chan identity.PlatformResult, 200)
	go func() {
		for p := range progressCh {
			wailsRuntime.EventsEmit(a.ctx, "username:progress", p)
		}
	}()

	result, err := identity.SearchUsername(ctx, username, progressCh)
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("usernamesearch", username, string(raw))
	}
	return result, nil
}

// CheckEmailBreach queries HaveIBeenPwned for email breaches.
func (a *App) CheckEmailBreach(email string) (*identity.EmailBreachResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 20*time.Second)
	defer cancel()

	var hibpKey string
	if a.db != nil {
		settings, _ := a.db.GetAllSettings()
		hibpKey = settings["hibp_api_key"]
	}

	result, err := identity.CheckEmailBreach(ctx, email, hibpKey)
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("emailbreach", email, string(raw))
	}
	return result, nil
}

// LookupPhone performs phone number intelligence lookup.
func (a *App) LookupPhone(number string) (*identity.PhoneLookupResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 15*time.Second)
	defer cancel()

	var abstractKey string
	if a.db != nil {
		settings, _ := a.db.GetAllSettings()
		abstractKey = settings["abstractapi_key"]
	}

	result, err := identity.LookupPhone(ctx, number, abstractKey)
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("phonelookup", number, string(raw))
	}
	return result, nil
}

// LookupWayback fetches Wayback Machine snapshots for a domain.
func (a *App) LookupWayback(domain string) (*identity.WaybackResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 45*time.Second)
	defer cancel()

	result, err := identity.LookupWayback(ctx, domain)
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("wayback", domain, string(raw))
	}
	return result, nil
}

// GenerateIdentityDorks generates Google dork queries for a domain.
func (a *App) GenerateIdentityDorks(domain string) *identity.DorkResult {
	result := identity.GenerateDorks(domain)
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("identitydorks", domain, string(raw))
	}
	return result
}

// RunOSINTDashboard runs a full parallel OSINT scan on a target.
func (a *App) RunOSINTDashboard(target string) (*identity.OSINTDashboardResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 120*time.Second)
	defer cancel()

	var hibpKey string
	if a.db != nil {
		settings, _ := a.db.GetAllSettings()
		hibpKey = settings["hibp_api_key"]
	}

	progressCh := make(chan identity.OSINTModuleStatus, 50)
	go func() {
		for p := range progressCh {
			wailsRuntime.EventsEmit(a.ctx, "osint:progress", p)
		}
	}()

	result, err := identity.RunOSINTDashboard(ctx, target, hibpKey, progressCh)
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("osintdashboard", target, string(raw))
	}
	return result, nil
}
