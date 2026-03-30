// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package files

import (
	"context"
	"encoding/base64"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"net/url"
	"os"
	"regexp"
	"strings"

	"github.com/makiuchi-d/gozxing"
	"github.com/makiuchi-d/gozxing/qrcode"
)

// QRResult holds QR code analysis results.
type QRResult struct {
	FilePath    string      `json:"file_path"`
	Content     string      `json:"content"`
	ContentType string      `json:"content_type"` // "url","email","phone","wifi","text"
	IsURL       bool        `json:"is_url"`
	URL         string      `json:"url,omitempty"`
	URLSafe     bool        `json:"url_safe"`
	IsSuspicious bool       `json:"is_suspicious"`
	Warnings    []string    `json:"warnings"`
	Preview     string      `json:"preview"` // base64 image data for UI
	Error       string      `json:"error,omitempty"`
}

// DecodeQR decodes a QR code from an image file.
func DecodeQR(ctx context.Context, filePath string) (*QRResult, error) {
	result := &QRResult{FilePath: filePath}

	f, err := os.Open(filePath)
	if err != nil {
		result.Error = fmt.Sprintf("Cannot open file: %v", err)
		return result, nil
	}
	defer f.Close()

	img, _, err := image.Decode(f)
	if err != nil {
		result.Error = fmt.Sprintf("Cannot decode image: %v", err)
		return result, nil
	}

	// Prepare bitmap for gozxing
	bmp, err := gozxing.NewBinaryBitmapFromImage(img)
	if err != nil {
		result.Error = fmt.Sprintf("Cannot process image: %v", err)
		return result, nil
	}

	// Decode QR
	reader := qrcode.NewQRCodeReader()
	decResult, err := reader.Decode(bmp, nil)
	if err != nil {
		result.Error = fmt.Sprintf("No QR code found in image: %v", err)
		return result, nil
	}

	result.Content = decResult.GetText()
	result.ContentType = classifyQRContent(result.Content)

	if result.ContentType == "url" {
		result.IsURL = true
		result.URL = result.Content
		analyzeQRURL(result)
	}

	// Load image as base64 for preview
	f.Seek(0, 0)
	data, err := os.ReadFile(filePath)
	if err == nil {
		result.Preview = base64.StdEncoding.EncodeToString(data)
	}

	return result, nil
}

// classifyQRContent determines the type of QR content.
func classifyQRContent(content string) string {
	lower := strings.ToLower(content)
	switch {
	case strings.HasPrefix(lower, "http://") || strings.HasPrefix(lower, "https://"):
		return "url"
	case strings.HasPrefix(lower, "mailto:"):
		return "email"
	case strings.HasPrefix(lower, "tel:") || strings.HasPrefix(lower, "sms:"):
		return "phone"
	case strings.HasPrefix(lower, "wifi:"):
		return "wifi"
	case strings.HasPrefix(lower, "bitcoin:") || strings.HasPrefix(lower, "ethereum:"):
		return "crypto"
	case strings.HasPrefix(lower, "begin:vcard"):
		return "vcard"
	case strings.HasPrefix(lower, "geo:"):
		return "geo"
	default:
		return "text"
	}
}

// analyzeQRURL analyzes the safety of a URL extracted from a QR code.
func analyzeQRURL(result *QRResult) {
	u, err := url.Parse(result.URL)
	if err != nil {
		result.Warnings = append(result.Warnings, "Invalid URL format")
		result.IsSuspicious = true
		return
	}

	host := strings.ToLower(u.Hostname())

	// Check for IP address instead of domain
	ipRegex := regexp.MustCompile(`^\d{1,3}(\.\d{1,3}){3}$`)
	if ipRegex.MatchString(host) {
		result.Warnings = append(result.Warnings, "URL uses an IP address instead of a domain name")
		result.IsSuspicious = true
	}

	// Check for HTTP (non-HTTPS)
	if u.Scheme == "http" {
		result.Warnings = append(result.Warnings, "URL uses insecure HTTP protocol")
	}

	// Check for suspicious TLDs
	suspiciousTLDs := []string{".xyz", ".tk", ".ml", ".ga", ".cf", ".gq", ".top", ".club", ".work", ".link"}
	for _, tld := range suspiciousTLDs {
		if strings.HasSuffix(host, tld) {
			result.Warnings = append(result.Warnings, fmt.Sprintf("Suspicious TLD: %s", tld))
			result.IsSuspicious = true
		}
	}

	// Check for URL shorteners
	shorteners := []string{"bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", "short.link", "rebrand.ly", "cutt.ly"}
	for _, sh := range shorteners {
		if host == sh || strings.HasSuffix(host, "."+sh) {
			result.Warnings = append(result.Warnings, fmt.Sprintf("URL shortener detected (%s) — destination unknown", sh))
			result.IsSuspicious = true
		}
	}

	// Check for excessively long URL
	if len(result.URL) > 200 {
		result.Warnings = append(result.Warnings, "Unusually long URL — may be obfuscating destination")
		result.IsSuspicious = true
	}

	// Check for multiple redirects encoded
	if strings.Count(result.URL, "http") > 1 {
		result.Warnings = append(result.Warnings, "URL contains embedded URL (redirect chain)")
		result.IsSuspicious = true
	}

	// Check for homograph characters
	if containsHomograph(host) {
		result.Warnings = append(result.Warnings, "URL may contain homograph characters (IDN homograph attack)")
		result.IsSuspicious = true
	}

	// Check for known phishing keywords in domain
	phishingKeywords := []string{"login", "signin", "verify", "secure", "account", "update", "banking", "paypal", "amazon", "apple", "microsoft", "google"}
	hostParts := strings.Split(host, ".")
	if len(hostParts) > 2 {
		subdomain := strings.Join(hostParts[:len(hostParts)-2], ".")
		for _, kw := range phishingKeywords {
			if strings.Contains(subdomain, kw) {
				result.Warnings = append(result.Warnings, fmt.Sprintf("Phishing keyword '%s' in subdomain", kw))
				result.IsSuspicious = true
				break
			}
		}
	}

	result.URLSafe = !result.IsSuspicious
}

// containsHomograph checks if a string contains non-ASCII Unicode that looks like ASCII.
func containsHomograph(s string) bool {
	for _, r := range s {
		if r > 127 {
			return true
		}
	}
	return false
}
