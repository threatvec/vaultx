// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package auth

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"strings"
)

// GeneratorOptions configures password generation.
type GeneratorOptions struct {
	Length     int  `json:"length"`
	UseLower   bool `json:"use_lower"`
	UseUpper   bool `json:"use_upper"`
	UseDigits  bool `json:"use_digits"`
	UseSymbols bool `json:"use_symbols"`
	UseSpace   bool `json:"use_space"`
	Memorable  bool `json:"memorable"`
	Count      int  `json:"count"`
}

// GeneratedPassword is a single generated password with its strength.
type GeneratedPassword struct {
	Password string           `json:"password"`
	Strength PasswordStrength `json:"strength"`
	Score    int              `json:"score"`
	Entropy  float64          `json:"entropy"`
}

// GeneratePasswords creates N passwords with the given options.
func GeneratePasswords(opts GeneratorOptions) ([]GeneratedPassword, error) {
	if opts.Length < 4 {
		opts.Length = 4
	}
	if opts.Length > 128 {
		opts.Length = 128
	}
	if opts.Count < 1 {
		opts.Count = 1
	}
	if opts.Count > 50 {
		opts.Count = 50
	}

	// Default: all enabled
	if !opts.UseLower && !opts.UseUpper && !opts.UseDigits && !opts.UseSymbols {
		opts.UseLower = true
		opts.UseUpper = true
		opts.UseDigits = true
		opts.UseSymbols = true
	}

	results := make([]GeneratedPassword, 0, opts.Count)
	for i := 0; i < opts.Count; i++ {
		var pw string
		var err error
		if opts.Memorable {
			pw, err = generateMemorable(opts.Length)
		} else {
			pw, err = generateRandom(opts)
		}
		if err != nil {
			return nil, err
		}

		cs := 0
		hasL, hasU, hasD, hasSym := false, false, false, false
		for _, c := range pw {
			if c >= 'a' && c <= 'z' {
				hasL = true
			} else if c >= 'A' && c <= 'Z' {
				hasU = true
			} else if c >= '0' && c <= '9' {
				hasD = true
			} else {
				hasSym = true
			}
		}
		if hasL {
			cs += 26
		}
		if hasU {
			cs += 26
		}
		if hasD {
			cs += 10
		}
		if hasSym {
			cs += 32
		}
		if cs == 0 {
			cs = 1
		}
		entropy := calculateEntropy(len(pw), cs)
		score := scoreFromEntropy(entropy, len(pw))
		results = append(results, GeneratedPassword{
			Password: pw,
			Strength: classifyStrength(score),
			Score:    score,
			Entropy:  entropy,
		})
	}
	return results, nil
}

func generateRandom(opts GeneratorOptions) (string, error) {
	charset := ""
	if opts.UseLower {
		charset += "abcdefghijklmnopqrstuvwxyz"
	}
	if opts.UseUpper {
		charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	}
	if opts.UseDigits {
		charset += "0123456789"
	}
	if opts.UseSymbols {
		charset += "!@#$%^&*()-_=+[]{}|;:,.<>?"
	}
	if opts.UseSpace {
		charset += " "
	}
	if len(charset) == 0 {
		charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	}

	// Ensure at least one character from each required class
	var required []byte
	if opts.UseLower {
		c, err := randChar("abcdefghijklmnopqrstuvwxyz")
		if err != nil {
			return "", err
		}
		required = append(required, c)
	}
	if opts.UseUpper {
		c, err := randChar("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
		if err != nil {
			return "", err
		}
		required = append(required, c)
	}
	if opts.UseDigits {
		c, err := randChar("0123456789")
		if err != nil {
			return "", err
		}
		required = append(required, c)
	}
	if opts.UseSymbols {
		c, err := randChar("!@#$%^&*()-_=+[]{}|;:,.<>?")
		if err != nil {
			return "", err
		}
		required = append(required, c)
	}

	remaining := opts.Length - len(required)
	if remaining < 0 {
		remaining = 0
	}

	var buf []byte
	for i := 0; i < remaining; i++ {
		c, err := randChar(charset)
		if err != nil {
			return "", err
		}
		buf = append(buf, c)
	}

	buf = append(buf, required...)
	// Shuffle using Fisher-Yates with crypto/rand
	for i := len(buf) - 1; i > 0; i-- {
		j, err := randInt(i + 1)
		if err != nil {
			return "", err
		}
		buf[i], buf[j] = buf[j], buf[i]
	}

	return string(buf), nil
}

var memorableWords = []string{
	"apple", "brave", "cloud", "delta", "eagle", "flame", "grace", "honey",
	"ivory", "jazzy", "karma", "lemon", "maple", "night", "ocean", "piano",
	"quart", "river", "storm", "tiger", "ultra", "vivid", "whirl", "xenon",
	"yacht", "zebra", "amber", "blaze", "coral", "dusty", "ember", "frost",
	"globe", "haven", "index", "jewel", "knack", "lunar", "misty", "noble",
	"orbit", "petal", "quest", "rainy", "swift", "torch", "unity", "vapor",
	"waltz", "xeric", "yield", "zonal", "alpha", "brisk", "crisp", "dwell",
	"elite", "flint", "grasp", "haste", "inner", "joust", "kneel", "light",
	"match", "nerve", "offer", "prose", "quiet", "ridge", "smoke", "taste",
	"under", "verse", "waste", "exact", "youth", "zones",
}

func generateMemorable(targetLen int) (string, error) {
	var parts []string
	total := 0

	for total < targetLen-3 {
		idx, err := randInt(len(memorableWords))
		if err != nil {
			return "", err
		}
		word := memorableWords[idx]
		// Randomly capitalize first letter
		n, err := randInt(2)
		if err == nil && n == 1 {
			word = strings.ToUpper(word[:1]) + word[1:]
		}
		parts = append(parts, word)
		total += len(word)
		if len(parts) >= 3 {
			break
		}
	}

	// Add a number and symbol
	num, err := randInt(100)
	if err != nil {
		return "", err
	}
	symbols := "!@#$%"
	sym, err := randChar(symbols)
	if err != nil {
		return "", err
	}

	result := strings.Join(parts, "-") + fmt.Sprintf("%d%c", num, sym)
	return result, nil
}

func randChar(charset string) (byte, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
	if err != nil {
		return 0, err
	}
	return charset[n.Int64()], nil
}

func randInt(max int) (int, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(int64(max)))
	if err != nil {
		return 0, err
	}
	return int(n.Int64()), nil
}

func scoreFromEntropy(entropy float64, length int) int {
	score := 0
	if entropy >= 80 {
		score = 95
	} else if entropy >= 60 {
		score = 80
	} else if entropy >= 40 {
		score = 60
	} else if entropy >= 28 {
		score = 40
	} else {
		score = 20
	}
	if length < 8 {
		score -= 20
	}
	if score < 0 {
		score = 0
	}
	return score
}
