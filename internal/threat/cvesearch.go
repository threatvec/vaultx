// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package threat

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// CVEResult holds information about a CVE vulnerability.
type CVEResult struct {
	CVEID       string   `json:"cve_id"`
	Description string   `json:"description"`
	CVSSv3Score float64  `json:"cvss_v3_score"`
	CVSSv3Vector string  `json:"cvss_v3_vector"`
	Severity    string   `json:"severity"`
	Published   string   `json:"published"`
	Modified    string   `json:"modified"`
	References  []string `json:"references"`
	CPEs        []string `json:"cpes"`
	HasExploit  bool     `json:"has_exploit"`
	ExploitURL  string   `json:"exploit_url,omitempty"`
	Error       string   `json:"error,omitempty"`
}

// CVESearchResult holds a list of CVE results.
type CVESearchResult struct {
	Query      string      `json:"query"`
	Total      int         `json:"total"`
	Results    []CVEResult `json:"results"`
	Error      string      `json:"error,omitempty"`
}

type nvdResponse struct {
	TotalResults int `json:"totalResults"`
	Vulnerabilities []struct {
		CVE struct {
			ID          string `json:"id"`
			Published   string `json:"published"`
			LastModified string `json:"lastModified"`
			Descriptions []struct {
				Lang  string `json:"lang"`
				Value string `json:"value"`
			} `json:"descriptions"`
			Metrics struct {
				CVSSMetricV31 []struct {
					CVSSData struct {
						BaseScore    float64 `json:"baseScore"`
						VectorString string  `json:"vectorString"`
						BaseSeverity string  `json:"baseSeverity"`
					} `json:"cvssData"`
				} `json:"cvssMetricV31"`
				CVSSMetricV30 []struct {
					CVSSData struct {
						BaseScore    float64 `json:"baseScore"`
						VectorString string  `json:"vectorString"`
						BaseSeverity string  `json:"baseSeverity"`
					} `json:"cvssData"`
				} `json:"cvssMetricV30"`
			} `json:"metrics"`
			References []struct {
				URL  string   `json:"url"`
				Tags []string `json:"tags"`
			} `json:"references"`
			Configurations []struct {
				Nodes []struct {
					CPEMatch []struct {
						Criteria string `json:"criteria"`
					} `json:"cpeMatch"`
				} `json:"nodes"`
			} `json:"configurations"`
		} `json:"cve"`
	} `json:"vulnerabilities"`
}

// SearchCVE searches the NVD for CVEs by keyword or CVE ID.
func SearchCVE(ctx context.Context, query string) (*CVESearchResult, error) {
	result := &CVESearchResult{Query: query}
	client := &http.Client{Timeout: 30 * time.Second}

	var apiURL string
	query = strings.TrimSpace(query)

	if strings.HasPrefix(strings.ToUpper(query), "CVE-") {
		apiURL = fmt.Sprintf("https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=%s", url.QueryEscape(query))
	} else {
		apiURL = fmt.Sprintf("https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=%s&resultsPerPage=20", url.QueryEscape(query))
	}

	req, err := http.NewRequestWithContext(ctx, "GET", apiURL, nil)
	if err != nil {
		result.Error = err.Error()
		return result, nil
	}
	req.Header.Set("User-Agent", "VAULTX/1.0")

	resp, err := client.Do(req)
	if err != nil {
		result.Error = fmt.Sprintf("NVD API request failed: %v", err)
		return result, nil
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		result.Error = err.Error()
		return result, nil
	}

	var nvdResp nvdResponse
	if err := json.Unmarshal(body, &nvdResp); err != nil {
		result.Error = fmt.Sprintf("failed to parse NVD response: %v", err)
		return result, nil
	}

	result.Total = nvdResp.TotalResults

	for _, vuln := range nvdResp.Vulnerabilities {
		cve := vuln.CVE
		entry := CVEResult{
			CVEID:     cve.ID,
			Published: cve.Published,
			Modified:  cve.LastModified,
		}

		for _, desc := range cve.Descriptions {
			if desc.Lang == "en" {
				entry.Description = desc.Value
				break
			}
		}

		if len(cve.Metrics.CVSSMetricV31) > 0 {
			m := cve.Metrics.CVSSMetricV31[0].CVSSData
			entry.CVSSv3Score = m.BaseScore
			entry.CVSSv3Vector = m.VectorString
			entry.Severity = m.BaseSeverity
		} else if len(cve.Metrics.CVSSMetricV30) > 0 {
			m := cve.Metrics.CVSSMetricV30[0].CVSSData
			entry.CVSSv3Score = m.BaseScore
			entry.CVSSv3Vector = m.VectorString
			entry.Severity = m.BaseSeverity
		}

		for _, ref := range cve.References {
			entry.References = append(entry.References, ref.URL)
			for _, tag := range ref.Tags {
				if tag == "Exploit" {
					entry.HasExploit = true
					entry.ExploitURL = ref.URL
				}
			}
		}

		for _, cfg := range cve.Configurations {
			for _, node := range cfg.Nodes {
				for _, cpe := range node.CPEMatch {
					entry.CPEs = append(entry.CPEs, cpe.Criteria)
				}
			}
		}

		result.Results = append(result.Results, entry)
	}

	return result, nil
}
