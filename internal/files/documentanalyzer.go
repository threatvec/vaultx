// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package files

import (
	"bytes"
	"fmt"
	"io"
	"os"
	"regexp"
	"strings"
)

// DocumentAnalysisResult holds deep document analysis findings.
type DocumentAnalysisResult struct {
	FileName        string           `json:"file_name"`
	FileType        string           `json:"file_type"`
	HasMacros       bool             `json:"has_macros"`
	HasHiddenText   bool             `json:"has_hidden_text"`
	HasTrackingPixel bool            `json:"has_tracking_pixel"`
	HasEmbeddedURLs bool             `json:"has_embedded_urls"`
	EmbeddedURLs    []EmbeddedURL    `json:"embedded_urls"`
	HiddenTexts     []string         `json:"hidden_texts"`
	MacroIndicators []string         `json:"macro_indicators"`
	Revisions       []RevisionEntry  `json:"revisions"`
	RiskScore       int              `json:"risk_score"`
	RiskLevel       string           `json:"risk_level"`
	Warnings        []string         `json:"warnings"`
	Error           string           `json:"error,omitempty"`
}

// EmbeddedURL is a URL found inside a document.
type EmbeddedURL struct {
	URL      string `json:"url"`
	Context  string `json:"context"`
	IsSuspicious bool `json:"is_suspicious"`
}

// RevisionEntry is a document revision/author history entry.
type RevisionEntry struct {
	Author    string `json:"author"`
	Timestamp string `json:"timestamp"`
	Action    string `json:"action"`
}

var urlRegex = regexp.MustCompile(`https?://[^\s"'<>\])\}\x00-\x1F]{4,512}`)
var trackingPatterns = []*regexp.Regexp{
	regexp.MustCompile(`https?://[^/]+/(?:track|pixel|beacon|open|t|img|1x1|spy)\b`),
	regexp.MustCompile(`width=["']?1["']?\s+height=["']?1["']?`),
	regexp.MustCompile(`height=["']?1["']?\s+width=["']?1["']?`),
	regexp.MustCompile(`\.(gif|png|jpg)\?.*(?:track|uid|email|user|id)=`),
}

// AnalyzeDocument performs deep security analysis on a document file.
func AnalyzeDocument(filePath string) (*DocumentAnalysisResult, error) {
	info, err := os.Stat(filePath)
	if err != nil {
		return nil, fmt.Errorf("cannot stat file: %w", err)
	}

	f, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("cannot open file: %w", err)
	}
	defer f.Close()

	result := &DocumentAnalysisResult{
		FileName: info.Name(),
	}

	header := make([]byte, 512)
	n, _ := f.Read(header)
	header = header[:n]
	f.Seek(0, io.SeekStart)

	ext := strings.ToLower(getExt(info.Name()))
	result.FileType = detectFileType(ext, header)

	data, err := io.ReadAll(f)
	if err != nil {
		result.Error = fmt.Sprintf("Cannot read file: %v", err)
		return result, nil
	}

	// Route to type-specific analysis
	switch {
	case isPDF(header):
		analyzePDFDocument(data, result)
	case isOfficeXML(header, ext):
		analyzeOfficeXMLDocument(data, result, ext)
	case isOldOffice(header):
		analyzeOldOfficeDocument(data, result)
	default:
		analyzeGenericDocument(data, result)
	}

	// Calculate risk score
	calculateDocumentRisk(result)

	return result, nil
}

func analyzePDFDocument(data []byte, result *DocumentAnalysisResult) {
	text := string(data)

	// Macros/scripts
	scriptIndicators := []string{"/JavaScript", "/JS ", "/AA ", "/OpenAction", "/Launch", "/RichMedia", "/EmbeddedFile"}
	for _, ind := range scriptIndicators {
		if strings.Contains(text, ind) {
			result.HasMacros = true
			result.MacroIndicators = append(result.MacroIndicators, fmt.Sprintf("PDF action: %s", strings.TrimPrefix(ind, "/")))
		}
	}

	// Extract URLs
	urls := urlRegex.FindAllString(text, -1)
	seen := map[string]bool{}
	for _, u := range urls {
		u = strings.TrimRight(u, ".,;)")
		if seen[u] {
			continue
		}
		seen[u] = true
		eu := EmbeddedURL{URL: u, IsSuspicious: isURLSuspicious(u)}
		result.EmbeddedURLs = append(result.EmbeddedURLs, eu)
		result.HasEmbeddedURLs = true
	}

	// Tracking pixels
	for _, pat := range trackingPatterns {
		if pat.MatchString(text) {
			result.HasTrackingPixel = true
			result.Warnings = append(result.Warnings, "Potential tracking pixel or beacon detected")
			break
		}
	}

	// Hidden/white text (PDF color = 1 1 1 rg or similar)
	if strings.Contains(text, "1 1 1 rg") || strings.Contains(text, "1 1 1 RG") {
		result.HasHiddenText = true
		result.HiddenTexts = append(result.HiddenTexts, "White-on-white text detected (possible hidden content)")
	}

	// Revision info
	extractPDFRevisions(text, result)
}

func analyzeOfficeXMLDocument(data []byte, result *DocumentAnalysisResult, ext string) {
	// Extract all XML from zip entries
	allXML := extractAllZIPText(data)

	// Macros
	macroExts := map[string]bool{".docm": true, ".xlsm": true, ".pptm": true}
	if macroExts[ext] {
		result.HasMacros = true
		result.MacroIndicators = append(result.MacroIndicators, "Macro-enabled file format ("+ext+")")
	}

	// Check for VBA in zip entries
	if bytes.Contains(data, []byte("vbaProject.bin")) {
		result.HasMacros = true
		result.MacroIndicators = append(result.MacroIndicators, "VBA project binary detected (vbaProject.bin)")
	}

	// Extract URLs from relationships
	urls := urlRegex.FindAllString(allXML, -1)
	seen := map[string]bool{}
	for _, u := range urls {
		u = strings.TrimRight(u, `"'<>.,;)`)
		if seen[u] || strings.HasPrefix(u, "http://schemas.openxmlformats") || strings.HasPrefix(u, "http://purl.") {
			continue
		}
		seen[u] = true
		eu := EmbeddedURL{URL: u, IsSuspicious: isURLSuspicious(u)}
		result.EmbeddedURLs = append(result.EmbeddedURLs, eu)
		result.HasEmbeddedURLs = true
	}

	// Tracking pixels in HTML content
	for _, pat := range trackingPatterns {
		if pat.MatchString(allXML) {
			result.HasTrackingPixel = true
			result.Warnings = append(result.Warnings, "Potential tracking element detected in document")
			break
		}
	}

	// Hidden text (white color, hidden formatting)
	if strings.Contains(allXML, `<w:color w:val="FFFFFF"`) || strings.Contains(allXML, `<w:vanish/>`) {
		result.HasHiddenText = true
		result.HiddenTexts = append(result.HiddenTexts, "Hidden text (vanish or white color) detected")
	}

	// Revisions/authors
	authorRe := regexp.MustCompile(`w:author="([^"]+)"`)
	dateRe := regexp.MustCompile(`w:date="([^"]+)"`)
	authors := authorRe.FindAllStringSubmatch(allXML, -1)
	dates := dateRe.FindAllStringSubmatch(allXML, -1)
	seen2 := map[string]bool{}
	for i, a := range authors {
		if len(a) < 2 || seen2[a[1]] {
			continue
		}
		seen2[a[1]] = true
		rev := RevisionEntry{Author: a[1], Action: "edit"}
		if i < len(dates) && len(dates[i]) >= 2 {
			rev.Timestamp = dates[i][1]
		}
		result.Revisions = append(result.Revisions, rev)
	}

	// External links in relationships
	if bytes.Contains(data, []byte("Target=\"http")) || bytes.Contains(data, []byte("Target='http")) {
		result.Warnings = append(result.Warnings, "Document contains external hyperlinks")
	}
}

func analyzeOldOfficeDocument(data []byte, result *DocumentAnalysisResult) {
	result.HasMacros = true
	result.MacroIndicators = append(result.MacroIndicators, "Legacy Office format — may contain embedded VBA macros")

	// Extract URLs
	text := string(data)
	urls := urlRegex.FindAllString(text, -1)
	seen := map[string]bool{}
	for _, u := range urls {
		if seen[u] {
			continue
		}
		seen[u] = true
		result.EmbeddedURLs = append(result.EmbeddedURLs, EmbeddedURL{URL: u, IsSuspicious: isURLSuspicious(u)})
		result.HasEmbeddedURLs = true
	}

	result.Warnings = append(result.Warnings, "Legacy binary format (.doc/.xls/.ppt) — recommend converting to modern format")
}

func analyzeGenericDocument(data []byte, result *DocumentAnalysisResult) {
	text := string(data)
	urls := urlRegex.FindAllString(text, -1)
	seen := map[string]bool{}
	for _, u := range urls {
		if seen[u] {
			continue
		}
		seen[u] = true
		result.EmbeddedURLs = append(result.EmbeddedURLs, EmbeddedURL{URL: u, IsSuspicious: isURLSuspicious(u)})
		result.HasEmbeddedURLs = true
	}
}

func extractPDFRevisions(text string, result *DocumentAnalysisResult) {
	// Look for author/creator patterns
	authorRe := regexp.MustCompile(`/Author\s*\(([^)]+)\)`)
	matches := authorRe.FindAllStringSubmatch(text, -1)
	seen := map[string]bool{}
	for _, m := range matches {
		if len(m) >= 2 && !seen[m[1]] {
			seen[m[1]] = true
			result.Revisions = append(result.Revisions, RevisionEntry{
				Author: m[1],
				Action: "author",
			})
		}
	}
}

func calculateDocumentRisk(result *DocumentAnalysisResult) {
	score := 0
	if result.HasMacros {
		score += 40
		result.Warnings = append(result.Warnings, "Document contains macros — DO NOT enable macros from unknown sources")
	}
	if result.HasHiddenText {
		score += 25
		result.Warnings = append(result.Warnings, "Hidden text detected — may contain concealed instructions or data")
	}
	if result.HasTrackingPixel {
		score += 20
		result.Warnings = append(result.Warnings, "Tracking pixel/beacon — opening this file may alert the sender")
	}
	for _, eu := range result.EmbeddedURLs {
		if eu.IsSuspicious {
			score += 10
		}
	}
	if score > 100 {
		score = 100
	}
	result.RiskScore = score

	switch {
	case score >= 70:
		result.RiskLevel = "critical"
	case score >= 40:
		result.RiskLevel = "high"
	case score >= 20:
		result.RiskLevel = "medium"
	default:
		result.RiskLevel = "low"
	}
}

func isURLSuspicious(u string) bool {
	lower := strings.ToLower(u)
	suspiciousPatterns := []string{
		"bit.ly", "tinyurl", "goo.gl", "t.co",
		".xyz/", ".tk/", ".ml/", ".ga/",
		"login", "verify", "account", "update",
		"exe", "dll", "bat", "cmd", "ps1",
	}
	for _, p := range suspiciousPatterns {
		if strings.Contains(lower, p) {
			return true
		}
	}
	// IP-based URL
	ipRe := regexp.MustCompile(`https?://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}`)
	return ipRe.MatchString(u)
}

func extractAllZIPText(data []byte) string {
	var sb strings.Builder
	sig := []byte{0x50, 0x4B, 0x03, 0x04}
	for i := 0; i < len(data)-30; i++ {
		if !bytes.Equal(data[i:i+4], sig) {
			continue
		}
		if i+30 > len(data) {
			break
		}
		fnLen := int(data[i+26]) | int(data[i+27])<<8
		extraLen := int(data[i+28]) | int(data[i+29])<<8
		compSz := int(data[i+18]) | int(data[i+19])<<8 | int(data[i+20])<<16 | int(data[i+21])<<24
		dataStart := i + 30 + fnLen + extraLen
		dataEnd := dataStart + compSz
		if dataEnd > len(data) {
			continue
		}
		sb.Write(data[dataStart:dataEnd])
		sb.WriteByte('\n')
	}
	return sb.String()
}

func getExt(name string) string {
	for i := len(name) - 1; i >= 0; i-- {
		if name[i] == '.' {
			return name[i:]
		}
	}
	return ""
}
