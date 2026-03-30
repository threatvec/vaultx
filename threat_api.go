// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package main

import (
	"context"
	"encoding/json"
	"time"

	"vaultx/internal/threat"
)

// CheckIPReputation performs IP reputation lookup.
func (a *App) CheckIPReputation(ip string) (*threat.IPReputationResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 30*time.Second)
	defer cancel()

	var abuseKey string
	if a.db != nil {
		settings, _ := a.db.GetAllSettings()
		abuseKey = settings["abuseipdb_api_key"]
	}

	result, err := threat.CheckIPReputation(ctx, ip, abuseKey)
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("ipreputation", ip, string(raw))
	}
	return result, nil
}

// SearchCVE searches the NVD for CVE information.
func (a *App) SearchCVE(query string) (*threat.CVESearchResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 30*time.Second)
	defer cancel()

	result, err := threat.SearchCVE(ctx, query)
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("cvesearch", query, string(raw))
	}
	return result, nil
}

// GetWatchTargets returns all NightWatch monitored targets.
func (a *App) GetWatchTargets() []threat.WatchTarget {
	if a.nightWatcher == nil {
		return []threat.WatchTarget{}
	}
	return a.nightWatcher.GetTargets()
}

// AddWatchTarget adds a new target to NightWatch.
func (a *App) AddWatchTarget(watchType, value string) error {
	if a.nightWatcher == nil {
		return nil
	}
	a.nightWatcher.AddTarget(threat.WatchTarget{
		Type:  threat.WatchType(watchType),
		Value: value,
	})
	return nil
}

// RemoveWatchTarget removes a target from NightWatch.
func (a *App) RemoveWatchTarget(value string) error {
	if a.nightWatcher == nil {
		return nil
	}
	a.nightWatcher.RemoveTarget(value)
	return nil
}

// CheckPasswordBreach checks if a password has been in a breach (k-anonymity).
func (a *App) CheckPasswordBreach(password string) (int, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 15*time.Second)
	defer cancel()
	return threat.CheckPasswordBreach(ctx, password)
}

// CheckPastes searches paste sites for mentions of the query.
func (a *App) CheckPastes(query string) (*threat.PasteMonitorResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 20*time.Second)
	defer cancel()

	result, err := threat.CheckPastes(ctx, query)
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("pastemonitor", query, string(raw))
	}
	return result, nil
}

// GetThreatFeedData fetches live threat feed from AbuseIPDB and OTX.
func (a *App) GetThreatFeedData() (*threat.ThreatFeedResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 30*time.Second)
	defer cancel()

	var abuseKey, otxKey string
	if a.db != nil {
		settings, _ := a.db.GetAllSettings()
		abuseKey = settings["abuseipdb_api_key"]
		otxKey = settings["otx_api_key"]
	}

	result, err := threat.GetThreatFeed(ctx, abuseKey, otxKey)
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("threatfeed", "feed", string(raw))
	}
	return result, nil
}
