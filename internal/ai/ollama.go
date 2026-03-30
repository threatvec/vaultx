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

const ollamaEndpoint = "http://localhost:11434"

// OllamaClient communicates with a local Ollama instance.
type OllamaClient struct {
	client *http.Client
}

type ollamaChatRequest struct {
	Model    string          `json:"model"`
	Messages []ollamaMessage `json:"messages"`
	Stream   bool            `json:"stream"`
}

type ollamaMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ollamaChatResponse struct {
	Message ollamaMessage `json:"message"`
}

// NewOllamaClient creates a new Ollama client.
func NewOllamaClient() *OllamaClient {
	return &OllamaClient{
		client: &http.Client{Timeout: 60 * time.Second},
	}
}

// IsAvailable checks if Ollama is running at default URL (fast 3s timeout).
func (o *OllamaClient) IsAvailable() bool {
	return o.TestConnectionURL(ollamaEndpoint)
}

// TestConnectionURL checks if Ollama is reachable at the given URL (fast 3s timeout).
func (o *OllamaClient) TestConnectionURL(url string) bool {
	if url == "" {
		url = ollamaEndpoint
	}
	quickClient := &http.Client{Timeout: 3 * time.Second}
	resp, err := quickClient.Get(url + "/api/tags")
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == http.StatusOK
}

// Query sends a prompt to Ollama and returns the response.
func (o *OllamaClient) Query(model, prompt string) (string, error) {
	reqBody := ollamaChatRequest{
		Model: model,
		Messages: []ollamaMessage{
			{Role: "system", Content: "You are VAULTX AI assistant, a cybersecurity expert. Answer questions about security, threats, and vulnerabilities. Be concise and actionable."},
			{Role: "user", Content: prompt},
		},
		Stream: false,
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	resp, err := o.client.Post(ollamaEndpoint+"/api/chat", "application/json", bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("ollama request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	var chatResp ollamaChatResponse
	if err := json.Unmarshal(respBody, &chatResp); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	return chatResp.Message.Content, nil
}
