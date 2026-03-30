// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
package proxy

import (
	"fmt"
	"net/http"
	"net/url"
	"time"
)

// Config holds proxy configuration.
type Config struct {
	Enabled  bool   `json:"enabled"`
	Type     string `json:"type"` // "socks5" or "http"
	Host     string `json:"host"`
	Port     string `json:"port"`
	Username string `json:"username,omitempty"`
	Password string `json:"password,omitempty"`
}

// NewHTTPClient creates an http.Client that routes traffic through the proxy.
func NewHTTPClient(cfg *Config, timeout time.Duration) *http.Client {
	if cfg == nil || !cfg.Enabled || cfg.Host == "" {
		return &http.Client{Timeout: timeout}
	}

	transport := &http.Transport{}

	switch cfg.Type {
	case "socks5", "http":
		scheme := cfg.Type
		if scheme == "socks5" {
			scheme = "socks5"
		}
		proxyURL := &url.URL{
			Scheme: scheme,
			Host:   fmt.Sprintf("%s:%s", cfg.Host, cfg.Port),
		}
		if cfg.Username != "" {
			proxyURL.User = url.UserPassword(cfg.Username, cfg.Password)
		}
		transport.Proxy = http.ProxyURL(proxyURL)
	}

	return &http.Client{Transport: transport, Timeout: timeout}
}

// Test checks if the proxy is reachable.
func Test(cfg Config) error {
	client := NewHTTPClient(&cfg, 10*time.Second)
	resp, err := client.Get("https://api.ipify.org?format=json")
	if err != nil {
		return fmt.Errorf("proxy test failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return fmt.Errorf("proxy test: unexpected status %d", resp.StatusCode)
	}
	return nil
}
