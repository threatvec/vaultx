// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

// GeminiClient communicates with the Google Gemini API.
type GeminiClient struct {
	client *http.Client
}

type geminiRequest struct {
	Contents       []geminiContent       `json:"contents"`
	SystemInstruct *geminiSystemInstruct `json:"system_instruction,omitempty"`
}

type geminiContent struct {
	Parts []geminiPart `json:"parts"`
	Role  string       `json:"role,omitempty"`
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiSystemInstruct struct {
	Parts []geminiPart `json:"parts"`
}

type geminiResponse struct {
	Candidates []struct {
		Content geminiContent `json:"content"`
	} `json:"candidates"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// NewGeminiClient creates a new Gemini client.
func NewGeminiClient() *GeminiClient {
	return &GeminiClient{
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

// Query sends a prompt to Gemini and returns the response.
func (g *GeminiClient) Query(apiKey, prompt string) (string, error) {
	reqBody := geminiRequest{
		SystemInstruct: &geminiSystemInstruct{
			Parts: []geminiPart{
				{Text: "You are VAULTX AI assistant, a cybersecurity expert. Answer questions about security, threats, and vulnerabilities. Be concise and actionable."},
			},
		},
		Contents: []geminiContent{
			{
				Role:  "user",
				Parts: []geminiPart{{Text: prompt}},
			},
		},
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	url := fmt.Sprintf("%s?key=%s", geminiEndpoint, apiKey)
	resp, err := g.client.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("gemini request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	var chatResp geminiResponse
	if err := json.Unmarshal(respBody, &chatResp); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	if chatResp.Error != nil {
		return "", fmt.Errorf("gemini error: %s", chatResp.Error.Message)
	}

	if len(chatResp.Candidates) == 0 || len(chatResp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no response from Gemini")
	}

	return chatResp.Candidates[0].Content.Parts[0].Text, nil
}
