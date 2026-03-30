// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package identity

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"
)

// PhoneLookupResult holds phone number intelligence data.
type PhoneLookupResult struct {
	Number      string `json:"number"`
	Valid       bool   `json:"valid"`
	Local       string `json:"local_format"`
	Intl        string `json:"international_format"`
	Country     string `json:"country_name"`
	CountryCode string `json:"country_code"`
	Location    string `json:"location"`
	Carrier     string `json:"carrier"`
	LineType    string `json:"line_type"`
	IsSuspicious bool  `json:"is_suspicious"`
	Error       string `json:"error,omitempty"`
}

type abstractPhoneResponse struct {
	Phone              string `json:"phone"`
	Valid              bool   `json:"valid"`
	LocalFormat        string `json:"local_format"`
	InternationalFormat string `json:"international_format"`
	CountryName        string `json:"country_name"`
	CountryCode        string `json:"country_code"`
	CountryPrefix      string `json:"country_prefix"`
	NumberType         string `json:"type"`
	Carrier            string `json:"carrier"`
	Location           string `json:"location"`
	Error              struct {
		Message string `json:"message"`
	} `json:"error"`
}

type numverifyResponse struct {
	Valid               bool   `json:"valid"`
	Number              string `json:"number"`
	LocalFormat         string `json:"local_format"`
	InternationalFormat string `json:"international_format"`
	CountryPrefix       string `json:"country_prefix"`
	CountryCode         string `json:"country_code"`
	CountryName         string `json:"country_name"`
	Location            string `json:"location"`
	Carrier             string `json:"carrier"`
	LineType            string `json:"line_type"`
	Error               struct {
		Code int    `json:"code"`
		Type string `json:"type"`
		Info string `json:"info"`
	} `json:"error"`
}

// LookupPhone validates and enriches a phone number via AbstractAPI (free tier).
func LookupPhone(ctx context.Context, number, abstractAPIKey string) (*PhoneLookupResult, error) {
	number = sanitizePhone(number)
	result := &PhoneLookupResult{Number: number}

	if abstractAPIKey != "" {
		return lookupAbstractAPI(ctx, number, abstractAPIKey, result)
	}

	// Fallback: basic validation only
	return basicPhoneValidation(number, result), nil
}

func lookupAbstractAPI(ctx context.Context, number, apiKey string, result *PhoneLookupResult) (*PhoneLookupResult, error) {
	client := &http.Client{Timeout: 12 * time.Second}
	apiURL := fmt.Sprintf("https://phonevalidation.abstractapi.com/v1/?api_key=%s&phone=%s",
		apiKey, url.QueryEscape(number))

	req, err := http.NewRequestWithContext(ctx, "GET", apiURL, nil)
	if err != nil {
		return nil, err
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var r abstractPhoneResponse
	if err := json.Unmarshal(body, &r); err != nil {
		return nil, fmt.Errorf("parse error: %w", err)
	}

	if r.Error.Message != "" {
		result.Error = r.Error.Message
		return result, nil
	}

	result.Valid = r.Valid
	result.Local = r.LocalFormat
	result.Intl = r.InternationalFormat
	result.Country = r.CountryName
	result.CountryCode = r.CountryCode
	result.Location = r.Location
	result.Carrier = r.Carrier
	result.LineType = r.NumberType
	result.IsSuspicious = isSuspiciousLineType(r.NumberType)

	return result, nil
}

func basicPhoneValidation(number string, result *PhoneLookupResult) *PhoneLookupResult {
	// Simple E.164 validation
	e164Re := regexp.MustCompile(`^\+?[1-9]\d{6,14}$`)
	cleaned := strings.ReplaceAll(strings.ReplaceAll(strings.ReplaceAll(number, " ", ""), "-", ""), "(", "")
	cleaned = strings.ReplaceAll(cleaned, ")", "")

	result.Valid = e164Re.MatchString(cleaned)
	if result.Valid {
		result.Intl = "+" + strings.TrimPrefix(cleaned, "+")
		// Basic country detection from prefix
		result.Country = detectCountryFromPrefix(cleaned)
		result.Error = "Detailed lookup requires AbstractAPI key"
	} else {
		result.Error = "Invalid phone number format"
	}
	return result
}

func detectCountryFromPrefix(number string) string {
	n := strings.TrimPrefix(number, "+")
	prefixes := map[string]string{
		"1": "United States / Canada",
		"44": "United Kingdom",
		"49": "Germany",
		"33": "France",
		"39": "Italy",
		"34": "Spain",
		"7": "Russia",
		"86": "China",
		"81": "Japan",
		"82": "South Korea",
		"91": "India",
		"55": "Brazil",
		"52": "Mexico",
		"61": "Australia",
		"64": "New Zealand",
		"31": "Netherlands",
		"46": "Sweden",
		"47": "Norway",
		"45": "Denmark",
		"358": "Finland",
		"41": "Switzerland",
		"43": "Austria",
		"32": "Belgium",
		"48": "Poland",
		"90": "Turkey",
		"380": "Ukraine",
		"971": "UAE",
		"966": "Saudi Arabia",
		"20": "Egypt",
		"27": "South Africa",
		"234": "Nigeria",
		"254": "Kenya",
		"65": "Singapore",
		"60": "Malaysia",
		"62": "Indonesia",
		"63": "Philippines",
		"66": "Thailand",
		"84": "Vietnam",
		"92": "Pakistan",
		"880": "Bangladesh",
		"98": "Iran",
		"972": "Israel",
	}
	for prefix, country := range prefixes {
		if strings.HasPrefix(n, prefix) {
			return country
		}
	}
	return "Unknown"
}

func sanitizePhone(s string) string {
	s = strings.TrimSpace(s)
	// Ensure starts with +
	if !strings.HasPrefix(s, "+") && len(s) > 0 {
		s = "+" + s
	}
	return s
}

func isSuspiciousLineType(t string) bool {
	suspicious := []string{"voip", "virtual", "prepaid", "toll_free"}
	t = strings.ToLower(t)
	for _, s := range suspicious {
		if strings.Contains(t, s) {
			return true
		}
	}
	return false
}
