// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package auth

import (
	"context"
	"crypto/sha1"
	"fmt"
	"io"
	"math"
	"net/http"
	"strings"
	"time"
	"unicode"
)

// PasswordStrength classification.
type PasswordStrength string

const (
	StrengthVeryWeak PasswordStrength = "very_weak"
	StrengthWeak     PasswordStrength = "weak"
	StrengthFair     PasswordStrength = "fair"
	StrengthStrong   PasswordStrength = "strong"
	StrengthVeryStrong PasswordStrength = "very_strong"
)

// PasswordAnalysisResult holds comprehensive password analysis.
type PasswordAnalysisResult struct {
	Password        string           `json:"password"`
	Strength        PasswordStrength `json:"strength"`
	Score           int              `json:"score"` // 0-100
	Entropy         float64          `json:"entropy"`
	CrackTime       string           `json:"crack_time"`
	CrackTimeOffline string          `json:"crack_time_offline"`
	Length          int              `json:"length"`
	HasUpper        bool             `json:"has_upper"`
	HasLower        bool             `json:"has_lower"`
	HasDigit        bool             `json:"has_digit"`
	HasSymbol       bool             `json:"has_symbol"`
	HasSpace        bool             `json:"has_space"`
	UniqueChars     int              `json:"unique_chars"`
	Charset         int              `json:"charset_size"`
	BreachCount     int              `json:"breach_count"`
	IsBreached      bool             `json:"is_breached"`
	Suggestions     []string         `json:"suggestions"`
	Patterns        []string         `json:"patterns"`
}

// AnalyzePassword performs comprehensive password strength analysis.
func AnalyzePassword(ctx context.Context, password string) (*PasswordAnalysisResult, error) {
	result := &PasswordAnalysisResult{
		Password: maskPassword(password),
		Length:   len(password),
	}

	charsetSize := analyzeCharset(password, result)
	result.Charset = charsetSize
	result.Entropy = calculateEntropy(len(password), charsetSize)
	result.UniqueChars = countUnique(password)
	result.Score = calculateScore(result)
	result.Strength = classifyStrength(result.Score)
	result.CrackTime = estimateCrackTime(result.Entropy, false)
	result.CrackTimeOffline = estimateCrackTime(result.Entropy, true)
	result.Patterns = detectPatterns(password)
	result.Suggestions = generateSuggestions(result)

	// k-anonymity HIBP check
	count, err := checkHIBP(ctx, password)
	if err == nil {
		result.BreachCount = count
		result.IsBreached = count > 0
	}

	return result, nil
}

func analyzeCharset(password string, result *PasswordAnalysisResult) int {
	size := 0
	for _, c := range password {
		if unicode.IsUpper(c) {
			result.HasUpper = true
		} else if unicode.IsLower(c) {
			result.HasLower = true
		} else if unicode.IsDigit(c) {
			result.HasDigit = true
		} else if c == ' ' {
			result.HasSpace = true
		} else {
			result.HasSymbol = true
		}
	}
	if result.HasLower {
		size += 26
	}
	if result.HasUpper {
		size += 26
	}
	if result.HasDigit {
		size += 10
	}
	if result.HasSymbol {
		size += 32
	}
	if result.HasSpace {
		size += 1
	}
	if size == 0 {
		size = 1
	}
	return size
}

func calculateEntropy(length, charsetSize int) float64 {
	if charsetSize <= 0 || length <= 0 {
		return 0
	}
	return float64(length) * math.Log2(float64(charsetSize))
}

func countUnique(s string) int {
	seen := map[rune]bool{}
	for _, c := range s {
		seen[c] = true
	}
	return len(seen)
}

func calculateScore(r *PasswordAnalysisResult) int {
	score := 0

	// Length
	switch {
	case r.Length >= 20:
		score += 30
	case r.Length >= 16:
		score += 25
	case r.Length >= 12:
		score += 20
	case r.Length >= 8:
		score += 10
	default:
		score += 0
	}

	// Charset
	if r.HasLower {
		score += 5
	}
	if r.HasUpper {
		score += 10
	}
	if r.HasDigit {
		score += 10
	}
	if r.HasSymbol {
		score += 15
	}

	// Entropy bonus
	if r.Entropy >= 80 {
		score += 20
	} else if r.Entropy >= 60 {
		score += 15
	} else if r.Entropy >= 40 {
		score += 10
	} else if r.Entropy >= 28 {
		score += 5
	}

	// Unique chars ratio
	if r.Length > 0 {
		ratio := float64(r.UniqueChars) / float64(r.Length)
		if ratio >= 0.8 {
			score += 10
		} else if ratio >= 0.6 {
			score += 5
		}
	}

	// Penalty for breach
	if r.IsBreached {
		score -= 30
	}

	// Penalty for common patterns
	score -= len(r.Patterns) * 5

	if score < 0 {
		score = 0
	}
	if score > 100 {
		score = 100
	}
	return score
}

func classifyStrength(score int) PasswordStrength {
	switch {
	case score >= 80:
		return StrengthVeryStrong
	case score >= 60:
		return StrengthStrong
	case score >= 40:
		return StrengthFair
	case score >= 20:
		return StrengthWeak
	default:
		return StrengthVeryWeak
	}
}

// estimateCrackTime estimates the time to crack a password based on entropy.
// Assumes 10 billion guesses/second for online, 100 trillion/second for offline GPU.
func estimateCrackTime(entropy float64, offline bool) string {
	guessesPerSecond := 1e10 // online: 10B/s
	if offline {
		guessesPerSecond = 1e13 // offline GPU: 10T/s
	}

	combinations := math.Pow(2, entropy)
	seconds := combinations / guessesPerSecond

	switch {
	case seconds < 1:
		return "Instant"
	case seconds < 60:
		return fmt.Sprintf("%.0f seconds", seconds)
	case seconds < 3600:
		return fmt.Sprintf("%.0f minutes", seconds/60)
	case seconds < 86400:
		return fmt.Sprintf("%.0f hours", seconds/3600)
	case seconds < 86400*30:
		return fmt.Sprintf("%.0f days", seconds/86400)
	case seconds < 86400*365:
		return fmt.Sprintf("%.0f months", seconds/(86400*30))
	case seconds < 86400*365*1000:
		return fmt.Sprintf("%.0f years", seconds/(86400*365))
	case seconds < 86400*365*1e6:
		return fmt.Sprintf("%.0f thousand years", seconds/(86400*365*1000))
	case seconds < 86400*365*1e9:
		return fmt.Sprintf("%.0f million years", seconds/(86400*365*1e6))
	default:
		return "Billions of years"
	}
}

func detectPatterns(password string) []string {
	var patterns []string
	lower := strings.ToLower(password)

	// Common sequences
	sequences := []string{"123", "abc", "qwerty", "password", "letmein", "admin", "welcome", "iloveyou", "sunshine", "monkey", "dragon"}
	for _, seq := range sequences {
		if strings.Contains(lower, seq) {
			patterns = append(patterns, fmt.Sprintf("Common pattern: '%s'", seq))
		}
	}

	// Repeated chars
	if len(password) >= 3 {
		for i := 0; i < len(password)-2; i++ {
			if password[i] == password[i+1] && password[i+1] == password[i+2] {
				patterns = append(patterns, fmt.Sprintf("Repeated character: '%c%c%c'", password[i], password[i+1], password[i+2]))
				break
			}
		}
	}

	// All same character class
	if !hasMultipleClasses(password) {
		patterns = append(patterns, "Only one character class used")
	}

	// Keyboard patterns
	kbPatterns := []string{"qwerty", "asdf", "zxcv", "1234", "4321"}
	for _, kp := range kbPatterns {
		if strings.Contains(lower, kp) {
			patterns = append(patterns, fmt.Sprintf("Keyboard pattern: '%s'", kp))
		}
	}

	return patterns
}

func hasMultipleClasses(s string) bool {
	hasU, hasL, hasD, hasSym := false, false, false, false
	for _, c := range s {
		if unicode.IsUpper(c) {
			hasU = true
		}
		if unicode.IsLower(c) {
			hasL = true
		}
		if unicode.IsDigit(c) {
			hasD = true
		}
		if !unicode.IsLetter(c) && !unicode.IsDigit(c) {
			hasSym = true
		}
	}
	count := 0
	for _, v := range []bool{hasU, hasL, hasD, hasSym} {
		if v {
			count++
		}
	}
	return count >= 2
}

func generateSuggestions(r *PasswordAnalysisResult) []string {
	var suggestions []string
	if r.Length < 12 {
		suggestions = append(suggestions, "Use at least 12 characters (16+ recommended)")
	}
	if !r.HasUpper {
		suggestions = append(suggestions, "Add uppercase letters (A-Z)")
	}
	if !r.HasLower {
		suggestions = append(suggestions, "Add lowercase letters (a-z)")
	}
	if !r.HasDigit {
		suggestions = append(suggestions, "Add numbers (0-9)")
	}
	if !r.HasSymbol {
		suggestions = append(suggestions, "Add symbols (!@#$%^&*)")
	}
	if r.IsBreached {
		suggestions = append(suggestions, "⚠️ This password has appeared in data breaches — never use it!")
	}
	if len(r.Patterns) > 0 {
		suggestions = append(suggestions, "Avoid common words, sequences, and keyboard patterns")
	}
	if r.UniqueChars < r.Length/2 {
		suggestions = append(suggestions, "Use more unique characters — avoid repetition")
	}
	if len(suggestions) == 0 {
		suggestions = append(suggestions, "Strong password! Consider using a password manager to store it.")
	}
	return suggestions
}

// checkHIBP uses k-anonymity to check if a password has been breached.
func checkHIBP(ctx context.Context, password string) (int, error) {
	h := sha1.Sum([]byte(password))
	hash := fmt.Sprintf("%X", h)
	prefix := hash[:5]
	suffix := hash[5:]

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequestWithContext(ctx, "GET",
		fmt.Sprintf("https://api.pwnedpasswords.com/range/%s", prefix), nil)
	if err != nil {
		return 0, err
	}
	req.Header.Set("Add-Padding", "true")

	resp, err := client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, err
	}

	for _, line := range strings.Split(string(body), "\n") {
		line = strings.TrimSpace(line)
		parts := strings.SplitN(line, ":", 2)
		if len(parts) == 2 && strings.EqualFold(parts[0], suffix) {
			count := 0
			fmt.Sscanf(parts[1], "%d", &count)
			return count, nil
		}
	}
	return 0, nil
}

// maskPassword replaces all characters of a password with * for storage.
func maskPassword(password string) string {
	return strings.Repeat("*", len(password))
}
