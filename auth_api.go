// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package main

import (
	"context"
	"encoding/json"
	"time"

	"vaultx/internal/auth"
)

// AnalyzePassword performs comprehensive password strength analysis.
func (a *App) AnalyzePassword(password string) (*auth.PasswordAnalysisResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 15*time.Second)
	defer cancel()

	result, err := auth.AnalyzePassword(ctx, password)
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("passwordanalyzer", "***", string(raw))
	}
	return result, nil
}

// GeneratePasswords creates N passwords with the given options.
func (a *App) GeneratePasswords(opts auth.GeneratorOptions) ([]auth.GeneratedPassword, error) {
	result, err := auth.GeneratePasswords(opts)
	if err != nil {
		return nil, err
	}
	return result, nil
}

// ParseEmailHeader parses raw email headers and returns analysis.
func (a *App) ParseEmailHeader(raw string) (*auth.EmailHeaderResult, error) {
	result, err := auth.ParseEmailHeader(raw)
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		j, _ := json.Marshal(result)
		a.db.SaveQueryHistory("emailheader", "raw-header", string(j))
	}
	return result, nil
}

// GenerateTOTPSecret generates a new TOTP secret and QR code.
func (a *App) GenerateTOTPSecret(accountName, issuer string) (*auth.TOTPSecret, error) {
	return auth.GenerateTOTPSecret(accountName, issuer)
}

// GetTOTPCode returns the current TOTP code for a given secret.
func (a *App) GetTOTPCode(secret string) (*auth.TOTPCode, error) {
	return auth.GetTOTPCode(secret)
}

// ValidateTOTPCode validates a TOTP code against a secret.
func (a *App) ValidateTOTPCode(secret, code string) (bool, error) {
	return auth.ValidateTOTPCode(secret, code)
}

// EncodeAll encodes input in all supported formats simultaneously.
func (a *App) EncodeAll(input string) map[string]string {
	return auth.EncodeAll(input)
}

// ProcessEncoder handles encode or decode for a specific format.
func (a *App) ProcessEncoder(input, format, mode string, caesarShift int) *auth.EncoderResult {
	return auth.ProcessEncoder(input, format, mode, caesarShift)
}

// MonitorPastes checks Pastebin for mentions of the target.
func (a *App) MonitorPastes(target string) (*auth.PasteMonitorResult, error) {
	ctx, cancel := context.WithTimeout(a.ctx, 20*time.Second)
	defer cancel()

	result, err := auth.MonitorPastes(ctx, target)
	if err != nil {
		return nil, err
	}
	if a.db != nil {
		raw, _ := json.Marshal(result)
		a.db.SaveQueryHistory("pastemonitor", target, string(raw))
	}
	return result, nil
}
