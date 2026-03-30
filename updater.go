// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

// CurrentVersion is the current application version.
const CurrentVersion = "1.0.0"

// UpdateAPI is the GitHub API endpoint for checking latest releases.
const UpdateAPI = "https://api.github.com/repos/threatvec/vaultx/releases/latest"

// Updater handles version checking and update notifications.
type Updater struct {
	client *http.Client
}

// githubRelease represents the GitHub release API response.
type githubRelease struct {
	TagName string `json:"tag_name"`
	HTMLURL string `json:"html_url"`
}

// NewUpdater creates a new Updater instance.
func NewUpdater() *Updater {
	return &Updater{
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

// CheckUpdate checks GitHub for the latest version and returns whether an update is available.
func (u *Updater) CheckUpdate() (bool, string, error) {
	resp, err := u.client.Get(UpdateAPI)
	if err != nil {
		return false, "", fmt.Errorf("update check failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return false, "", fmt.Errorf("update API returned status %d", resp.StatusCode)
	}

	var release githubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return false, "", fmt.Errorf("failed to parse release info: %w", err)
	}

	remoteVersion := strings.TrimPrefix(release.TagName, "v")
	if compareVersions(CurrentVersion, remoteVersion) < 0 {
		return true, remoteVersion, nil
	}

	return false, CurrentVersion, nil
}

// GetDownloadURL returns the GitHub releases page URL.
func (u *Updater) GetDownloadURL() string {
	return "https://github.com/threatvec/vaultx/releases/latest"
}

// compareVersions compares two semantic version strings.
// Returns -1 if a < b, 0 if a == b, 1 if a > b.
func compareVersions(a, b string) int {
	partsA := strings.Split(a, ".")
	partsB := strings.Split(b, ".")

	for i := 0; i < 3; i++ {
		var numA, numB int
		if i < len(partsA) {
			fmt.Sscanf(partsA[i], "%d", &numA)
		}
		if i < len(partsB) {
			fmt.Sscanf(partsB[i], "%d", &numB)
		}
		if numA < numB {
			return -1
		}
		if numA > numB {
			return 1
		}
	}
	return 0
}
