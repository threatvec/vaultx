// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package files

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"
)

// MetadataResult holds extracted metadata from a file.
type MetadataResult struct {
	FileName    string            `json:"file_name"`
	FileSize    int64             `json:"file_size"`
	FileType    string            `json:"file_type"`
	MimeType    string            `json:"mime_type"`
	Fields      map[string]string `json:"fields"`
	RawFields   []MetaField       `json:"raw_fields"`
	HasGPS      bool              `json:"has_gps"`
	GPSLat      float64           `json:"gps_lat"`
	GPSLon      float64           `json:"gps_lon"`
	Warnings    []string          `json:"warnings"`
	Error       string            `json:"error,omitempty"`
}

// MetaField is a single labeled metadata field.
type MetaField struct {
	Label string `json:"label"`
	Value string `json:"value"`
	Risk  string `json:"risk,omitempty"` // "high","medium","low",""
}

// ExtractMetadata parses a file by path and returns its metadata.
func ExtractMetadata(filePath string) (*MetadataResult, error) {
	info, err := os.Stat(filePath)
	if err != nil {
		return nil, fmt.Errorf("cannot stat file: %w", err)
	}

	result := &MetadataResult{
		FileName: info.Name(),
		FileSize: info.Size(),
		Fields:   make(map[string]string),
	}

	f, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("cannot open file: %w", err)
	}
	defer f.Close()

	// Read first 512 bytes to detect type
	header := make([]byte, 512)
	n, _ := f.Read(header)
	header = header[:n]
	f.Seek(0, io.SeekStart)

	ext := strings.ToLower(filepath.Ext(filePath))
	result.FileType = detectFileType(ext, header)
	result.MimeType = detectMIME(ext, header)

	switch {
	case isPDF(header):
		parsePDFMeta(f, result)
	case isOfficeXML(header, ext):
		parseOfficeXMLMeta(f, result, ext)
	case isOldOffice(header):
		parseOldOfficeMeta(f, result)
	case isImage(ext):
		parseImageMeta(f, result)
	default:
		result.RawFields = append(result.RawFields, MetaField{
			Label: "Info",
			Value: fmt.Sprintf("File type '%s' — basic metadata only", result.FileType),
		})
	}

	result.Fields["File Name"] = result.FileName
	result.Fields["File Size"] = humanSize(info.Size())
	result.Fields["Modified"] = info.ModTime().Format(time.RFC3339)
	result.Fields["Type"] = result.FileType

	return result, nil
}

// parsePDFMeta extracts metadata from PDF files by scanning for /Info dictionary.
func parsePDFMeta(f *os.File, result *MetadataResult) {
	data, err := io.ReadAll(f)
	if err != nil {
		return
	}

	// Look for PDF info dictionary
	infoKeys := []struct{ key, label, risk string }{
		{"/Author", "Author", "medium"},
		{"/Creator", "Creator Application", "low"},
		{"/Producer", "PDF Producer", "low"},
		{"/CreationDate", "Creation Date", "low"},
		{"/ModDate", "Modification Date", "low"},
		{"/Title", "Title", "low"},
		{"/Subject", "Subject", "low"},
		{"/Keywords", "Keywords", "low"},
		{"/Company", "Company", "high"},
	}

	text := string(data)
	for _, k := range infoKeys {
		val := extractPDFValue(text, k.key)
		if val != "" {
			result.RawFields = append(result.RawFields, MetaField{
				Label: k.label,
				Value: val,
				Risk:  k.risk,
			})
			result.Fields[k.label] = val
		}
	}

	// Check for JavaScript
	if strings.Contains(text, "/JavaScript") || strings.Contains(text, "/JS") {
		result.Warnings = append(result.Warnings, "PDF contains JavaScript — potential security risk")
	}
	// Check for embedded files
	if strings.Contains(text, "/EmbeddedFile") {
		result.Warnings = append(result.Warnings, "PDF contains embedded files")
	}
	// Check for forms
	if strings.Contains(text, "/AcroForm") {
		result.Warnings = append(result.Warnings, "PDF contains interactive forms")
	}
}

// extractPDFValue extracts a value from a PDF key like /Author (value)
func extractPDFValue(text, key string) string {
	idx := strings.Index(text, key)
	if idx < 0 {
		return ""
	}
	rest := text[idx+len(key):]
	rest = strings.TrimSpace(rest)

	if len(rest) == 0 {
		return ""
	}

	// Handle (string) format
	if rest[0] == '(' {
		end := strings.Index(rest[1:], ")")
		if end >= 0 {
			val := rest[1 : end+1]
			if utf8.ValidString(val) {
				return strings.TrimSpace(val)
			}
		}
	}
	// Handle <hex> format
	if rest[0] == '<' {
		end := strings.Index(rest[1:], ">")
		if end >= 0 {
			return strings.TrimSpace(rest[1 : end+1])
		}
	}
	// Handle plain token
	parts := strings.Fields(rest)
	if len(parts) > 0 {
		val := parts[0]
		if utf8.ValidString(val) && len(val) < 200 {
			return val
		}
	}
	return ""
}

// parseOfficeXMLMeta parses .docx/.xlsx/.pptx (ZIP-based Office XML) for metadata.
func parseOfficeXMLMeta(f *os.File, result *MetadataResult, ext string) {
	data, err := io.ReadAll(f)
	if err != nil {
		return
	}

	// Office XML is a ZIP; we look for core.xml and app.xml by scanning for XML tags
	coreXML := extractZIPEntry(data, "docProps/core.xml")
	appXML := extractZIPEntry(data, "docProps/app.xml")

	xmlFields := []struct{ tag, label, risk string }{
		{"dc:creator", "Author", "high"},
		{"cp:lastModifiedBy", "Last Modified By", "high"},
		{"dc:title", "Title", "low"},
		{"dc:subject", "Subject", "low"},
		{"dc:description", "Description", "low"},
		{"cp:keywords", "Keywords", "low"},
		{"dcterms:created", "Created", "low"},
		{"dcterms:modified", "Modified", "low"},
		{"cp:revision", "Revision", "medium"},
		{"cp:lastPrinted", "Last Printed", "low"},
	}

	for _, xf := range xmlFields {
		val := extractXMLTag(coreXML, xf.tag)
		if val != "" {
			result.RawFields = append(result.RawFields, MetaField{
				Label: xf.label,
				Value: val,
				Risk:  xf.risk,
			})
			result.Fields[xf.label] = val
		}
	}

	appFields := []struct{ tag, label, risk string }{
		{"Application", "Application", "low"},
		{"Company", "Company", "high"},
		{"Manager", "Manager", "high"},
		{"AppVersion", "App Version", "low"},
		{"Pages", "Pages", "low"},
		{"Words", "Word Count", "low"},
		{"Characters", "Characters", "low"},
		{"Slides", "Slides", "low"},
	}

	for _, xf := range appFields {
		val := extractXMLTag(appXML, xf.tag)
		if val != "" {
			result.RawFields = append(result.RawFields, MetaField{
				Label: xf.label,
				Value: val,
				Risk:  xf.risk,
			})
			result.Fields[xf.label] = val
		}
	}

	// Check for macros in xlsm/docm/pptm
	if ext == ".xlsm" || ext == ".docm" || ext == ".pptm" {
		result.Warnings = append(result.Warnings, "File contains macros ("+ext+") — potential security risk")
	}
}

// parseOldOfficeMeta parses legacy .doc/.xls/.ppt (OLE2) files for metadata.
func parseOldOfficeMeta(f *os.File, result *MetadataResult) {
	data, err := io.ReadAll(f)
	if err != nil {
		return
	}

	// OLE2 SummaryInformation stream: scan for printable strings
	// Extract readable ASCII strings of length 4+
	re := regexp.MustCompile(`[\x20-\x7E]{4,}`)
	matches := re.FindAllString(string(data), -1)

	seen := map[string]bool{}
	var interesting []string
	for _, m := range matches {
		if seen[m] {
			continue
		}
		seen[m] = true
		// Filter to plausible metadata (names, version strings, etc.)
		if looksLikeMetadata(m) {
			interesting = append(interesting, m)
		}
	}

	for i, s := range interesting {
		if i >= 10 {
			break
		}
		result.RawFields = append(result.RawFields, MetaField{
			Label: fmt.Sprintf("String #%d", i+1),
			Value: s,
			Risk:  "low",
		})
	}

	result.Warnings = append(result.Warnings, "Legacy Office format — may contain macros or embedded objects")
}

// parseImageMeta extracts basic image metadata (EXIF handled by exif.go).
func parseImageMeta(f *os.File, result *MetadataResult) {
	// Delegate to EXIF extractor
	f.Seek(0, io.SeekStart)
	exifResult, err := ExtractEXIF(f)
	if err != nil || exifResult == nil {
		return
	}
	for _, field := range exifResult.Fields {
		result.RawFields = append(result.RawFields, MetaField{
			Label: field.Label,
			Value: field.Value,
			Risk:  field.Risk,
		})
		result.Fields[field.Label] = field.Value
	}
	if exifResult.HasGPS {
		result.HasGPS = true
		result.GPSLat = exifResult.GPSLat
		result.GPSLon = exifResult.GPSLon
	}
}

// extractZIPEntry extracts file content from a ZIP archive by filename (simple scan).
func extractZIPEntry(data []byte, name string) string {
	// ZIP local file header signature
	sig := []byte{0x50, 0x4B, 0x03, 0x04}
	needle := []byte(name)

	for i := 0; i < len(data)-30; i++ {
		if !bytes.Equal(data[i:i+4], sig) {
			continue
		}
		// filename length at offset 26
		if i+30 > len(data) {
			continue
		}
		fnLen := int(binary.LittleEndian.Uint16(data[i+26 : i+28]))
		extraLen := int(binary.LittleEndian.Uint16(data[i+28 : i+30]))
		fnStart := i + 30
		fnEnd := fnStart + fnLen
		if fnEnd > len(data) {
			continue
		}
		if bytes.Equal(data[fnStart:fnEnd], needle) {
			compSize := int(binary.LittleEndian.Uint32(data[i+18 : i+22]))
			dataStart := fnEnd + extraLen
			dataEnd := dataStart + compSize
			if dataEnd > len(data) {
				continue
			}
			return string(data[dataStart:dataEnd])
		}
	}
	return ""
}

// extractXMLTag extracts the inner text of an XML tag.
func extractXMLTag(xml, tag string) string {
	open := "<" + tag + ">"
	close := "</" + tag + ">"
	start := strings.Index(xml, open)
	if start < 0 {
		// Try with namespace stripped
		parts := strings.SplitN(tag, ":", 2)
		if len(parts) == 2 {
			return extractXMLTag(xml, parts[1])
		}
		return ""
	}
	start += len(open)
	end := strings.Index(xml[start:], close)
	if end < 0 {
		return ""
	}
	return strings.TrimSpace(xml[start : start+end])
}

// detectFileType returns a human-readable file type string.
func detectFileType(ext string, header []byte) string {
	switch ext {
	case ".pdf":
		return "PDF Document"
	case ".docx":
		return "Word Document (DOCX)"
	case ".doc":
		return "Word Document (DOC)"
	case ".xlsx":
		return "Excel Spreadsheet (XLSX)"
	case ".xls":
		return "Excel Spreadsheet (XLS)"
	case ".pptx":
		return "PowerPoint Presentation (PPTX)"
	case ".ppt":
		return "PowerPoint Presentation (PPT)"
	case ".jpg", ".jpeg":
		return "JPEG Image"
	case ".png":
		return "PNG Image"
	case ".gif":
		return "GIF Image"
	case ".tiff", ".tif":
		return "TIFF Image"
	case ".webp":
		return "WebP Image"
	case ".mp4":
		return "MP4 Video"
	case ".zip":
		return "ZIP Archive"
	}
	if len(header) >= 4 && header[0] == 0x25 && header[1] == 0x50 {
		return "PDF Document"
	}
	return strings.TrimPrefix(ext, ".")
}

// detectMIME returns a MIME type string.
func detectMIME(ext string, header []byte) string {
	switch ext {
	case ".pdf":
		return "application/pdf"
	case ".docx":
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	case ".doc":
		return "application/msword"
	case ".xlsx":
		return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	case ".xls":
		return "application/vnd.ms-excel"
	case ".pptx":
		return "application/vnd.openxmlformats-officedocument.presentationml.presentation"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	case ".zip":
		return "application/zip"
	}
	return "application/octet-stream"
}

func isPDF(header []byte) bool {
	return len(header) >= 4 && header[0] == 0x25 && header[1] == 0x50 && header[2] == 0x44 && header[3] == 0x46
}

func isOfficeXML(header []byte, ext string) bool {
	// Office XML files start with PK (ZIP signature)
	isZip := len(header) >= 2 && header[0] == 0x50 && header[1] == 0x4B
	xmlExts := map[string]bool{".docx": true, ".xlsx": true, ".pptx": true, ".docm": true, ".xlsm": true, ".pptm": true}
	return isZip && xmlExts[ext]
}

func isOldOffice(header []byte) bool {
	// OLE2 compound document
	return len(header) >= 8 && header[0] == 0xD0 && header[1] == 0xCF && header[2] == 0x11 && header[3] == 0xE0
}

func isImage(ext string) bool {
	imgExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".tiff": true, ".tif": true, ".webp": true, ".gif": true}
	return imgExts[ext]
}

func looksLikeMetadata(s string) bool {
	if len(s) < 4 || len(s) > 100 {
		return false
	}
	// Skip strings that look like binary noise
	if strings.ContainsAny(s, "\x00\x01\x02\x03") {
		return false
	}
	// Prefer strings with spaces or version-like patterns
	hasSpace := strings.Contains(s, " ")
	hasDot := strings.Contains(s, ".")
	return hasSpace || hasDot
}

func humanSize(b int64) string {
	const unit = 1024
	if b < unit {
		return fmt.Sprintf("%d B", b)
	}
	div, exp := int64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(b)/float64(div), "KMGTPE"[exp])
}
