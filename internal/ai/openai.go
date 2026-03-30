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

const openaiEndpoint = "https://api.openai.com/v1/chat/completions"

// OpenAIClient communicates with the OpenAI API.
type OpenAIClient struct {
	client *http.Client
}

type openaiRequest struct {
	Model    string           `json:"model"`
	Messages []openaiMessage  `json:"messages"`
}

type openaiMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openaiResponse struct {
	Choices []struct {
		Message openaiMessage `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// NewOpenAIClient creates a new OpenAI client.
func NewOpenAIClient() *OpenAIClient {
	return &OpenAIClient{
		client: &http.Client{Timeout: 30 * time.Second},
	}
}

// Query sends a prompt to OpenAI GPT-4o and returns the response.
func (o *OpenAIClient) Query(apiKey, prompt string) (string, error) {
	reqBody := openaiRequest{
		Model: "gpt-4o",
		Messages: []openaiMessage{
			{Role: "system", Content: "You are VAULTX AI assistant, a cybersecurity expert. Answer questions about security, threats, and vulnerabilities. Be concise and actionable."},
			{Role: "user", Content: prompt},
		},
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", openaiEndpoint, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := o.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("openai request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	var chatResp openaiResponse
	if err := json.Unmarshal(respBody, &chatResp); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	if chatResp.Error != nil {
		return "", fmt.Errorf("openai error: %s", chatResp.Error.Message)
	}

	if len(chatResp.Choices) == 0 {
		return "", fmt.Errorf("no response from OpenAI")
	}

	return chatResp.Choices[0].Message.Content, nil
}
