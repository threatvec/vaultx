// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package auth

import (
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"html"
	"net/url"
	"strings"
)

// EncoderResult holds encode/decode results for all formats.
type EncoderResult struct {
	Input   string            `json:"input"`
	Format  string            `json:"format"`
	Mode    string            `json:"mode"` // encode or decode
	Output  string            `json:"output"`
	Error   string            `json:"error,omitempty"`
	AllFormats map[string]string `json:"all_formats,omitempty"`
}

// EncodeAll encodes input in all supported formats simultaneously.
func EncodeAll(input string) map[string]string {
	results := make(map[string]string)
	results["base64"] = Base64Encode(input)
	results["url"] = URLEncode(input)
	results["html"] = HTMLEncode(input)
	results["hex"] = HexEncode(input)
	results["binary"] = BinaryEncode(input)
	results["rot13"] = ROT13(input)
	results["morse"] = MorseEncode(input)
	return results
}

// ProcessEncoder handles encode or decode for a specific format.
func ProcessEncoder(input, format, mode string, caesarShift int) *EncoderResult {
	result := &EncoderResult{
		Input:  input,
		Format: format,
		Mode:   mode,
	}

	if input == "" {
		result.Output = ""
		return result
	}

	var output string
	var err error

	switch strings.ToLower(format) {
	case "base64":
		if mode == "decode" {
			output, err = Base64Decode(input)
		} else {
			output = Base64Encode(input)
		}
	case "url":
		if mode == "decode" {
			output, err = URLDecode(input)
		} else {
			output = URLEncode(input)
		}
	case "html":
		if mode == "decode" {
			output = HTMLDecode(input)
		} else {
			output = HTMLEncode(input)
		}
	case "hex":
		if mode == "decode" {
			output, err = HexDecode(input)
		} else {
			output = HexEncode(input)
		}
	case "binary":
		if mode == "decode" {
			output, err = BinaryDecode(input)
		} else {
			output = BinaryEncode(input)
		}
	case "rot13":
		output = ROT13(input)
	case "caesar":
		if mode == "decode" {
			output = CaesarCipher(input, 26-caesarShift)
		} else {
			output = CaesarCipher(input, caesarShift)
		}
	case "morse":
		if mode == "decode" {
			output, err = MorseDecode(input)
		} else {
			output = MorseEncode(input)
		}
	default:
		result.Error = fmt.Sprintf("Unknown format: %s", format)
		return result
	}

	if err != nil {
		result.Error = err.Error()
		result.Output = ""
	} else {
		result.Output = output
	}

	return result
}

// Base64Encode encodes a string to Base64.
func Base64Encode(input string) string {
	return base64.StdEncoding.EncodeToString([]byte(input))
}

// Base64Decode decodes a Base64 string.
func Base64Decode(input string) (string, error) {
	// Try standard first, then URL encoding
	b, err := base64.StdEncoding.DecodeString(input)
	if err != nil {
		b, err = base64.URLEncoding.DecodeString(input)
		if err != nil {
			// Try with padding
			padded := input
			switch len(input) % 4 {
			case 2:
				padded += "=="
			case 3:
				padded += "="
			}
			b, err = base64.StdEncoding.DecodeString(padded)
			if err != nil {
				return "", fmt.Errorf("invalid base64: %w", err)
			}
		}
	}
	return string(b), nil
}

// URLEncode percent-encodes a string.
func URLEncode(input string) string {
	return url.QueryEscape(input)
}

// URLDecode decodes a percent-encoded string.
func URLDecode(input string) (string, error) {
	decoded, err := url.QueryUnescape(input)
	if err != nil {
		return "", fmt.Errorf("invalid URL encoding: %w", err)
	}
	return decoded, nil
}

// HTMLEncode encodes HTML special characters.
func HTMLEncode(input string) string {
	return html.EscapeString(input)
}

// HTMLDecode decodes HTML entities.
func HTMLDecode(input string) string {
	return html.UnescapeString(input)
}

// HexEncode encodes a string to hex.
func HexEncode(input string) string {
	return hex.EncodeToString([]byte(input))
}

// HexDecode decodes a hex string.
func HexDecode(input string) (string, error) {
	// Remove spaces and 0x prefixes
	cleaned := strings.ReplaceAll(input, " ", "")
	cleaned = strings.ReplaceAll(cleaned, "0x", "")
	cleaned = strings.ReplaceAll(cleaned, "0X", "")

	b, err := hex.DecodeString(cleaned)
	if err != nil {
		return "", fmt.Errorf("invalid hex: %w", err)
	}
	return string(b), nil
}

// BinaryEncode encodes a string to binary (space-separated bytes).
func BinaryEncode(input string) string {
	var parts []string
	for _, b := range []byte(input) {
		parts = append(parts, fmt.Sprintf("%08b", b))
	}
	return strings.Join(parts, " ")
}

// BinaryDecode decodes space-separated binary bytes to a string.
func BinaryDecode(input string) (string, error) {
	// Remove extra spaces and split
	input = strings.TrimSpace(input)
	parts := strings.Fields(input)

	var result []byte
	for _, part := range parts {
		if len(part) != 8 {
			return "", fmt.Errorf("invalid binary byte: %s (expected 8 bits)", part)
		}
		var b byte
		for _, c := range part {
			b <<= 1
			if c == '1' {
				b |= 1
			} else if c != '0' {
				return "", fmt.Errorf("invalid binary character: %c", c)
			}
		}
		result = append(result, b)
	}
	return string(result), nil
}

// ROT13 applies the ROT13 substitution cipher.
func ROT13(input string) string {
	var sb strings.Builder
	for _, c := range input {
		switch {
		case c >= 'a' && c <= 'z':
			sb.WriteRune('a' + (c-'a'+13)%26)
		case c >= 'A' && c <= 'Z':
			sb.WriteRune('A' + (c-'A'+13)%26)
		default:
			sb.WriteRune(c)
		}
	}
	return sb.String()
}

// CaesarCipher applies a Caesar cipher with the given shift.
func CaesarCipher(input string, shift int) string {
	// Normalize shift to 0-25
	shift = ((shift % 26) + 26) % 26
	if shift == 0 {
		return input
	}

	var sb strings.Builder
	for _, c := range input {
		switch {
		case c >= 'a' && c <= 'z':
			sb.WriteRune('a' + (c-'a'+rune(shift))%26)
		case c >= 'A' && c <= 'Z':
			sb.WriteRune('A' + (c-'A'+rune(shift))%26)
		default:
			sb.WriteRune(c)
		}
	}
	return sb.String()
}

var morseCode = map[rune]string{
	'A': ".-", 'B': "-...", 'C': "-.-.", 'D': "-..", 'E': ".",
	'F': "..-.", 'G': "--.", 'H': "....", 'I': "..", 'J': ".---",
	'K': "-.-", 'L': ".-..", 'M': "--", 'N': "-.", 'O': "---",
	'P': ".--.", 'Q': "--.-", 'R': ".-.", 'S': "...", 'T': "-",
	'U': "..-", 'V': "...-", 'W': ".--", 'X': "-..-", 'Y': "-.--",
	'Z': "--..", '0': "-----", '1': ".----", '2': "..---", '3': "...--",
	'4': "....-", '5': ".....", '6': "-....", '7': "--...", '8': "---..",
	'9': "----.", '.': ".-.-.-", ',': "--..--", '?': "..--..",
	'!': "-.-.--", '/': "-..-.", '-': "-....-", '(': "-.--.",
	')': "-.--.-", '&': ".-...", ':': "---...", ';': "-.-.-.",
	'=': "-...-", '+': ".-.-.", '_': "..--.-", '"': ".-..-.",
	'$': "...-..-", '@': ".--.-.",
}

var morseToChar map[string]rune

func init() {
	morseToChar = make(map[string]rune, len(morseCode))
	for c, m := range morseCode {
		morseToChar[m] = c
	}
}

// MorseEncode encodes a string to Morse code.
func MorseEncode(input string) string {
	var parts []string
	for _, c := range strings.ToUpper(input) {
		if c == ' ' {
			parts = append(parts, "/")
		} else if code, ok := morseCode[c]; ok {
			parts = append(parts, code)
		} else {
			parts = append(parts, "?")
		}
	}
	return strings.Join(parts, " ")
}

// MorseDecode decodes Morse code to a string.
func MorseDecode(input string) (string, error) {
	input = strings.TrimSpace(input)
	words := strings.Split(input, " / ")

	var sb strings.Builder
	for i, word := range words {
		if i > 0 {
			sb.WriteRune(' ')
		}
		chars := strings.Fields(word)
		for _, ch := range chars {
			if ch == "/" {
				sb.WriteRune(' ')
				continue
			}
			if r, ok := morseToChar[ch]; ok {
				sb.WriteRune(r)
			} else {
				sb.WriteRune('?')
			}
		}
	}
	return sb.String(), nil
}
