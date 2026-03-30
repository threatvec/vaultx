// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"os"
	"time"

	"vaultx/internal/files"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// OpenFileDialog opens a native file picker for documents and returns the selected path.
func (a *App) OpenFileDialog(title string) (string, error) {
	return wailsRuntime.OpenFileDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title: title,
		Filters: []wailsRuntime.FileFilter{
			{DisplayName: "All Supported Files", Pattern: "*.pdf;*.doc;*.docx;*.xls;*.xlsx;*.ppt;*.pptx;*.jpg;*.jpeg;*.png;*.gif;*.tiff;*.tif;*.webp"},
			{DisplayName: "PDF Files", Pattern: "*.pdf"},
			{DisplayName: "Office Documents", Pattern: "*.doc;*.docx;*.xls;*.xlsx;*.ppt;*.pptx"},
			{DisplayName: "Images", Pattern: "*.jpg;*.jpeg;*.png;*.gif;*.tiff;*.tif;*.webp"},
			{DisplayName: "All Files", Pattern: "*"},
		},
	})
}

// OpenImageDialog opens a native file picker for images only.
func (a *App) OpenImageDialog(title string) (string, error) {
	return wailsRuntime.OpenFileDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title: title,
		Filters: []wailsRuntime.FileFilter{
			{DisplayName: "Images", Pattern: "*.jpg;*.jpeg;*.png;*.gif;*.tiff;*.tif;*.webp;*.bmp"},
			{DisplayName: "All Files", Pattern: "*"},
		},
	})
}

// OpenAnyFileDialog opens a native file picker with no filter.
func (a *App) OpenAnyFileDialog(title string) (string, error) {
	return wailsRuntime.OpenFileDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title: title,
		Filters: []wailsRuntime.FileFilter{
			{DisplayName: "All Files", Pattern: "*"},
		},
	})
}

// ExtractFileMetadata extracts metadata from any supported file type.
func (a *App) ExtractFileMetadata(filePath string) (*files.MetadataResult, error) {
	result, err := files.ExtractMetadata(filePath)
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("metadata", filePath, string(raw))
	}
	return result, nil
}

// ExtractImageEXIF extracts EXIF data from an image file.
func (a *App) ExtractImageEXIF(filePath string) (*files.EXIFResult, error) {
	result, err := files.ExtractEXIFFromPath(filePath)
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("imageexif", filePath, string(raw))
	}
	return result, nil
}

// LookupHashVT looks up a file hash on VirusTotal.
func (a *App) LookupHashVT(hash string) (*files.HashLookupResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 25*time.Second)
	defer cancel()

	var vtKey string
	if a.db != nil {
		settings, _ := a.db.GetAllSettings()
		vtKey = settings["virustotal_api_key"]
	}

	result, err := files.LookupHashVT(ctx, hash, vtKey)
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("hashlookup", hash, string(raw))
	}
	return result, nil
}

// HashFileVT computes a file's SHA256 and looks it up on VirusTotal.
func (a *App) HashFileVT(filePath string) (*files.HashLookupResult, error) {
	hashSet := files.HashFile(filePath)
	if hashSet.Error != "" {
		return &files.HashLookupResult{Error: hashSet.Error}, nil
	}
	return a.LookupHashVT(hashSet.SHA256)
}

// HashText computes MD5/SHA1/SHA256/SHA512 of a text string.
func (a *App) HashText(text string) *files.HashSet {
	return files.HashText(text)
}

// HashFilePath computes MD5/SHA1/SHA256/SHA512 of a file.
func (a *App) HashFilePath(filePath string) *files.HashSet {
	return files.HashFile(filePath)
}

// CompareHashes checks if two hash strings match.
func (a *App) CompareHashes(hashA, hashB string) *files.CompareResult {
	return files.CompareHashes(hashA, hashB)
}

// DecodeQR decodes a QR code from an image file path.
func (a *App) DecodeQR(filePath string) (*files.QRResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 20*time.Second)
	defer cancel()

	result, err := files.DecodeQR(ctx, filePath)
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("qranalyzer", filePath, string(raw))
	}
	return result, nil
}

// AnalyzeDocument performs deep security analysis on a document file.
func (a *App) AnalyzeDocument(filePath string) (*files.DocumentAnalysisResult, error) {
	result, err := files.AnalyzeDocument(filePath)
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("documentanalyzer", filePath, string(raw))
	}
	return result, nil
}

// ReadFileAsBase64 reads a file and returns base64-encoded content (for image preview).
func (a *App) ReadFileAsBase64(filePath string) (string, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(data), nil
}
