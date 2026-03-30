// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package files

import (
	"crypto/md5"
	"crypto/sha1"
	"crypto/sha256"
	"crypto/sha512"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"strings"
)

// HashSet holds multiple hash values for the same input.
type HashSet struct {
	MD5    string `json:"md5"`
	SHA1   string `json:"sha1"`
	SHA256 string `json:"sha256"`
	SHA512 string `json:"sha512"`
	Source string `json:"source"` // "text" or "file"
	Name   string `json:"name,omitempty"`
	Size   int64  `json:"size,omitempty"`
	Error  string `json:"error,omitempty"`
}

// CompareResult holds the comparison of two hash strings.
type CompareResult struct {
	HashA   string `json:"hash_a"`
	HashB   string `json:"hash_b"`
	Match   bool   `json:"match"`
	TypeA   string `json:"type_a"`
	TypeB   string `json:"type_b"`
}

// HashText computes all hashes for a plain text string.
func HashText(text string) *HashSet {
	data := []byte(text)
	return &HashSet{
		MD5:    md5Hex(data),
		SHA1:   sha1Hex(data),
		SHA256: sha256Hex(data),
		SHA512: sha512Hex(data),
		Source: "text",
		Name:   fmt.Sprintf("%q", truncate(text, 40)),
	}
}

// HashFile computes all hashes for a file.
func HashFile(filePath string) *HashSet {
	f, err := os.Open(filePath)
	if err != nil {
		return &HashSet{Error: fmt.Sprintf("Cannot open file: %v", err)}
	}
	defer f.Close()

	info, _ := f.Stat()

	hMD5 := md5.New()
	hSHA1 := sha1.New()
	hSHA256 := sha256.New()
	hSHA512 := sha512.New()

	writers := io.MultiWriter(hMD5, hSHA1, hSHA256, hSHA512)
	if _, err := io.Copy(writers, f); err != nil {
		return &HashSet{Error: fmt.Sprintf("Read error: %v", err)}
	}

	var size int64
	if info != nil {
		size = info.Size()
	}

	return &HashSet{
		MD5:    hex.EncodeToString(hMD5.Sum(nil)),
		SHA1:   hex.EncodeToString(hSHA1.Sum(nil)),
		SHA256: hex.EncodeToString(hSHA256.Sum(nil)),
		SHA512: hex.EncodeToString(hSHA512.Sum(nil)),
		Source: "file",
		Name:   filePath,
		Size:   size,
	}
}

// CompareHashes checks if two hash strings are equal (case-insensitive).
func CompareHashes(a, b string) *CompareResult {
	a = strings.TrimSpace(strings.ToLower(a))
	b = strings.TrimSpace(strings.ToLower(b))
	return &CompareResult{
		HashA: a,
		HashB: b,
		Match: a == b,
		TypeA: classifyHash(a),
		TypeB: classifyHash(b),
	}
}

// classifyHash returns the hash type based on length.
func classifyHash(h string) string {
	switch len(h) {
	case 32:
		return "MD5"
	case 40:
		return "SHA1"
	case 64:
		return "SHA256"
	case 128:
		return "SHA512"
	}
	return "Unknown"
}

func md5Hex(data []byte) string {
	h := md5.Sum(data)
	return hex.EncodeToString(h[:])
}

func sha1Hex(data []byte) string {
	h := sha1.Sum(data)
	return hex.EncodeToString(h[:])
}

func sha256Hex(data []byte) string {
	h := sha256.Sum256(data)
	return hex.EncodeToString(h[:])
}

func sha512Hex(data []byte) string {
	h := sha512.Sum512(data)
	return hex.EncodeToString(h[:])
}

func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max] + "..."
}
