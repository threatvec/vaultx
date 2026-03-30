// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package auth

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/pquerna/otp"
	"github.com/pquerna/otp/totp"
	"github.com/skip2/go-qrcode"
)

// TOTPSecret holds generated TOTP secret information.
type TOTPSecret struct {
	Secret    string `json:"secret"`
	AccountName string `json:"account_name"`
	Issuer    string `json:"issuer"`
	URL       string `json:"url"`
	QRCodeB64 string `json:"qr_code_b64"`
}

// TOTPCode holds a current TOTP code with timing info.
type TOTPCode struct {
	Code      string `json:"code"`
	Remaining int    `json:"remaining"` // seconds remaining
	Timestamp int64  `json:"timestamp"`
	Valid     bool   `json:"valid"`
}

// GenerateTOTPSecret generates a new TOTP secret and QR code.
func GenerateTOTPSecret(accountName, issuer string) (*TOTPSecret, error) {
	if accountName == "" {
		accountName = "user@vaultx"
	}
	if issuer == "" {
		issuer = "VaultX"
	}

	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      issuer,
		AccountName: accountName,
		SecretSize:  20,
		Algorithm:   otp.AlgorithmSHA1,
		Digits:      otp.DigitsSix,
		Period:      30,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to generate TOTP secret: %w", err)
	}

	qrPNG, err := qrcode.Encode(key.URL(), qrcode.Medium, 256)
	if err != nil {
		return nil, fmt.Errorf("failed to generate QR code: %w", err)
	}

	qrB64 := base64.StdEncoding.EncodeToString(qrPNG)

	return &TOTPSecret{
		Secret:      key.Secret(),
		AccountName: accountName,
		Issuer:      issuer,
		URL:         key.URL(),
		QRCodeB64:   qrB64,
	}, nil
}

// GetTOTPCode returns the current TOTP code for a given secret.
func GetTOTPCode(secret string) (*TOTPCode, error) {
	if secret == "" {
		return nil, fmt.Errorf("secret cannot be empty")
	}

	now := time.Now()
	code, err := totp.GenerateCodeCustom(secret, now, totp.ValidateOpts{
		Period:    30,
		Skew:      1,
		Digits:    otp.DigitsSix,
		Algorithm: otp.AlgorithmSHA1,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to generate TOTP code: %w", err)
	}

	period := uint64(30)
	counter := uint64(now.Unix()) / period
	nextTick := (counter + 1) * period
	remaining := int(nextTick - uint64(now.Unix()))

	return &TOTPCode{
		Code:      code,
		Remaining: remaining,
		Timestamp: now.Unix(),
		Valid:      true,
	}, nil
}

// ValidateTOTPCode validates a TOTP code against a secret.
func ValidateTOTPCode(secret, code string) (bool, error) {
	if secret == "" || code == "" {
		return false, nil
	}

	valid, err := totp.ValidateCustom(code, secret, time.Now(), totp.ValidateOpts{
		Period:    30,
		Skew:      1,
		Digits:    otp.DigitsSix,
		Algorithm: otp.AlgorithmSHA1,
	})
	if err != nil {
		return false, nil
	}
	return valid, nil
}

// GetTOTPQRCode generates a QR code PNG (base64) for an existing secret URL.
func GetTOTPQRCode(otpauthURL string) (string, error) {
	var buf bytes.Buffer
	qr, err := qrcode.New(otpauthURL, qrcode.Medium)
	if err != nil {
		return "", fmt.Errorf("failed to create QR code: %w", err)
	}
	qr.DisableBorder = false

	png, err := qr.PNG(256)
	if err != nil {
		return "", fmt.Errorf("failed to encode QR PNG: %w", err)
	}
	buf.Write(png)
	return base64.StdEncoding.EncodeToString(buf.Bytes()), nil
}
