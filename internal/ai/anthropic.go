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

const anthropicEndpoint = "https://api.anthropic.com/v1/messages"

// AnthropicClient communicates with the Anthropic Claude API.
type AnthropicClient struct {
	client *http.Client
}

type anthropicRequest struct {
	Model     string              `json:"model"`
	MaxTokens int                 `json:"max_tokens"`
	System    string              `json:"system"`
	Messages  []anthropicMessage  `json:"messages"`
}

type anthropicMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type anthropicResponse struct {
	Content []struct {
		Text string `json:"text"`
	} `json:"content"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// NewAnthropicClient creates a new Anthropic client.
func NewAnthropicClient() *AnthropicClient {
	return &AnthropicClient{
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

// Query sends a prompt to Claude and returns the response.
func (a *AnthropicClient) Query(apiKey, prompt string) (string, error) {
	reqBody := anthropicRequest{
		Model:     "claude-sonnet-4-20250514",
		MaxTokens: 4096,
		System:    "You are VAULTX AI assistant, a cybersecurity expert. Answer questions about security, threats, and vulnerabilities. Be concise and actionable.",
		Messages: []anthropicMessage{
			{Role: "user", Content: prompt},
		},
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", anthropicEndpoint, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := a.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("anthropic request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	var chatResp anthropicResponse
	if err := json.Unmarshal(respBody, &chatResp); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	if chatResp.Error != nil {
		return "", fmt.Errorf("anthropic error: %s", chatResp.Error.Message)
	}

	if len(chatResp.Content) == 0 {
		return "", fmt.Errorf("no response from Anthropic")
	}

	return chatResp.Content[0].Text, nil
}
