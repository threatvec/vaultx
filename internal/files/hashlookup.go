// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package files

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// HashLookupResult holds VirusTotal scan results for a hash.
type HashLookupResult struct {
	Hash          string            `json:"hash"`
	HashType      string            `json:"hash_type"`
	Found         bool              `json:"found"`
	Malicious     int               `json:"malicious"`
	Suspicious    int               `json:"suspicious"`
	Undetected    int               `json:"undetected"`
	TotalEngines  int               `json:"total_engines"`
	MalwareFamily string            `json:"malware_family"`
	ThreatLabel   string            `json:"threat_label"`
	FileType      string            `json:"file_type"`
	FileName      string            `json:"file_name"`
	FileSize      int64             `json:"file_size"`
	Engines       []EngineResult    `json:"engines"`
	Tags          []string          `json:"tags"`
	FirstSeen     string            `json:"first_seen"`
	LastSeen      string            `json:"last_seen"`
	Permalink     string            `json:"permalink"`
	Error         string            `json:"error,omitempty"`
}

// EngineResult is one antivirus engine's verdict.
type EngineResult struct {
	Engine   string `json:"engine"`
	Category string `json:"category"`
	Result   string `json:"result"`
}

type vtFileResponse struct {
	Data struct {
		Attributes struct {
			LastAnalysisStats struct {
				Malicious  int `json:"malicious"`
				Suspicious int `json:"suspicious"`
				Undetected int `json:"undetected"`
				Harmless   int `json:"harmless"`
				Timeout    int `json:"timeout"`
			} `json:"last_analysis_stats"`
			LastAnalysisResults map[string]struct {
				Category    string `json:"category"`
				Result      string `json:"result"`
				EngineName  string `json:"engine_name"`
			} `json:"last_analysis_results"`
			PopularThreatClassification struct {
				SuggestedThreatLabel string `json:"suggested_threat_label"`
				PopularThreatCategory []struct {
					Value string `json:"value"`
					Count int    `json:"count"`
				} `json:"popular_threat_category"`
				PopularThreatName []struct {
					Value string `json:"value"`
					Count int    `json:"count"`
				} `json:"popular_threat_name"`
			} `json:"popular_threat_classification"`
			TypeDescription string   `json:"type_description"`
			Tags            []string `json:"tags"`
			FirstSubmission int64    `json:"first_submission_date"`
			LastSubmission  int64    `json:"last_submission_date"`
			Names           []string `json:"names"`
			Size            int64    `json:"size"`
		} `json:"attributes"`
	} `json:"data"`
	Error struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

// LookupHashVT queries VirusTotal for a file hash.
func LookupHashVT(ctx context.Context, hash, apiKey string) (*HashLookupResult, error) {
	if apiKey == "" {
		return &HashLookupResult{Hash: hash, Error: "VirusTotal API key required"}, nil
	}

	hash = strings.TrimSpace(strings.ToLower(hash))
	result := &HashLookupResult{Hash: hash}

	// Determine hash type
	switch len(hash) {
	case 32:
		result.HashType = "MD5"
	case 40:
		result.HashType = "SHA1"
	case 64:
		result.HashType = "SHA256"
	default:
		return &HashLookupResult{Hash: hash, Error: fmt.Sprintf("Invalid hash length %d (expected 32/40/64)", len(hash))}, nil
	}

	client := &http.Client{Timeout: 20 * time.Second}
	req, err := http.NewRequestWithContext(ctx, "GET",
		fmt.Sprintf("https://www.virustotal.com/api/v3/files/%s", hash), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("x-apikey", apiKey)
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var vtResp vtFileResponse
	if err := json.Unmarshal(body, &vtResp); err != nil {
		return nil, fmt.Errorf("VT parse error: %w", err)
	}

	if vtResp.Error.Code != "" {
		if vtResp.Error.Code == "NotFoundError" {
			result.Found = false
			result.Error = "Hash not found in VirusTotal database"
			return result, nil
		}
		result.Error = vtResp.Error.Message
		return result, nil
	}

	result.Found = true
	attr := vtResp.Data.Attributes
	result.Malicious = attr.LastAnalysisStats.Malicious
	result.Suspicious = attr.LastAnalysisStats.Suspicious
	result.Undetected = attr.LastAnalysisStats.Undetected
	result.TotalEngines = attr.LastAnalysisStats.Malicious + attr.LastAnalysisStats.Suspicious +
		attr.LastAnalysisStats.Undetected + attr.LastAnalysisStats.Harmless + attr.LastAnalysisStats.Timeout
	result.FileType = attr.TypeDescription
	result.Tags = attr.Tags
	result.FileSize = attr.Size
	result.ThreatLabel = attr.PopularThreatClassification.SuggestedThreatLabel

	if len(attr.Names) > 0 {
		result.FileName = attr.Names[0]
	}
	if len(attr.PopularThreatClassification.PopularThreatName) > 0 {
		result.MalwareFamily = attr.PopularThreatClassification.PopularThreatName[0].Value
	}

	if attr.FirstSubmission > 0 {
		result.FirstSeen = time.Unix(attr.FirstSubmission, 0).Format("2006-01-02")
	}
	if attr.LastSubmission > 0 {
		result.LastSeen = time.Unix(attr.LastSubmission, 0).Format("2006-01-02")
	}

	result.Permalink = fmt.Sprintf("https://www.virustotal.com/gui/file/%s", hash)

	// Collect engine results
	for engineName, res := range attr.LastAnalysisResults {
		if res.Category == "malicious" || res.Category == "suspicious" {
			result.Engines = append(result.Engines, EngineResult{
				Engine:   engineName,
				Category: res.Category,
				Result:   res.Result,
			})
		}
	}

	return result, nil
}

// SubmitFileToVT submits a file for VirusTotal analysis and returns the analysis ID.
func SubmitFileToVT(ctx context.Context, filePath, apiKey string) (string, error) {
	if apiKey == "" {
		return "", fmt.Errorf("VirusTotal API key required")
	}

	// Get upload URL
	client := &http.Client{Timeout: 30 * time.Second}
	req, err := http.NewRequestWithContext(ctx, "GET", "https://www.virustotal.com/api/v3/files/upload_url", nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("x-apikey", apiKey)

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var uploadResp struct {
		Data string `json:"data"`
	}
	if err := json.Unmarshal(body, &uploadResp); err != nil {
		return "", err
	}

	return uploadResp.Data, nil
}

// urlToBase64 base64-encodes a URL for VT URL analysis.
func urlToBase64(rawURL string) string {
	encoded := base64.URLEncoding.EncodeToString([]byte(rawURL))
	return strings.TrimRight(encoded, "=")
}
