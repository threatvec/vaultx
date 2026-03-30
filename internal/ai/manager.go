// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package ai

import (
	"fmt"
	"vaultx/internal/db"
)

// Provider represents an AI provider type.
type Provider string

const (
	ProviderOllama    Provider = "ollama"
	ProviderOpenAI    Provider = "openai"
	ProviderAnthropic Provider = "anthropic"
	ProviderGemini    Provider = "gemini"
)

// Manager manages AI providers and routes queries.
type Manager struct {
	db       *db.Database
	ollama   *OllamaClient
	openai   *OpenAIClient
	anthropic *AnthropicClient
	gemini   *GeminiClient
}

// NewManager creates a new AI manager.
func NewManager(database *db.Database) *Manager {
	return &Manager{
		db:        database,
		ollama:    NewOllamaClient(),
		openai:    NewOpenAIClient(),
		anthropic: NewAnthropicClient(),
		gemini:    NewGeminiClient(),
	}
}

// DetectOllama checks if Ollama is running locally.
func (m *Manager) DetectOllama() bool {
	return m.ollama.IsAvailable()
}

// Query sends a prompt to the best available AI provider.
func (m *Manager) Query(prompt string) (string, error) {
	settings, err := m.db.GetAllSettings()
	if err != nil {
		settings = make(map[string]string)
	}

	preferredProvider := settings["ai_provider"]

	switch Provider(preferredProvider) {
	case ProviderOpenAI:
		if key, ok := settings["openai_api_key"]; ok && key != "" {
			return m.openai.Query(key, prompt)
		}
	case ProviderAnthropic:
		if key, ok := settings["anthropic_api_key"]; ok && key != "" {
			return m.anthropic.Query(key, prompt)
		}
	case ProviderGemini:
		if key, ok := settings["gemini_api_key"]; ok && key != "" {
			return m.gemini.Query(key, prompt)
		}
	}

	if m.ollama.IsAvailable() {
		model := settings["ollama_model"]
		if model == "" {
			model = "llama3.2"
		}
		return m.ollama.Query(model, prompt)
	}

	if key, ok := settings["openai_api_key"]; ok && key != "" {
		return m.openai.Query(key, prompt)
	}
	if key, ok := settings["anthropic_api_key"]; ok && key != "" {
		return m.anthropic.Query(key, prompt)
	}
	if key, ok := settings["gemini_api_key"]; ok && key != "" {
		return m.gemini.Query(key, prompt)
	}

	return "", fmt.Errorf("no AI provider available — configure an API key in Settings or install Ollama")
}
