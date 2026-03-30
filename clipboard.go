// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package main

import (
	"context"
	"log"
	"net"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/atotto/clipboard"
	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// ClipboardWatcher monitors the clipboard for security-related content.
type ClipboardWatcher struct {
	ctx         context.Context
	enabled     bool
	lastContent string
	stopChan    chan struct{}
}

// ClipboardDetection represents a detected clipboard content type.
type ClipboardDetection struct {
	Type    string `json:"type"`
	Content string `json:"content"`
}

var (
	ipRegex    = regexp.MustCompile(`^(\d{1,3}\.){3}\d{1,3}$`)
	emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	hashRegex  = regexp.MustCompile(`^[a-fA-F0-9]{32,128}$`)
)

// NewClipboardWatcher creates a new clipboard watcher.
func NewClipboardWatcher(ctx context.Context) *ClipboardWatcher {
	return &ClipboardWatcher{
		ctx:      ctx,
		enabled:  true,
		stopChan: make(chan struct{}),
	}
}

// Start begins monitoring the clipboard in a loop.
func (cw *ClipboardWatcher) Start() {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-cw.stopChan:
			return
		case <-ticker.C:
			if !cw.enabled {
				continue
			}
			cw.check()
		}
	}
}

// Stop halts the clipboard watcher.
func (cw *ClipboardWatcher) Stop() {
	close(cw.stopChan)
}

// check reads the clipboard and detects content type.
func (cw *ClipboardWatcher) check() {
	content, err := clipboard.ReadAll()
	if err != nil {
		return
	}

	content = strings.TrimSpace(content)
	if content == "" || content == cw.lastContent {
		return
	}
	cw.lastContent = content

	detection := cw.detect(content)
	if detection != nil {
		wailsRuntime.EventsEmit(cw.ctx, "clipboard:detected", detection)
	}
}

// detect determines the type of clipboard content.
func (cw *ClipboardWatcher) detect(content string) *ClipboardDetection {
	if ipRegex.MatchString(content) {
		ip := net.ParseIP(content)
		if ip != nil {
			return &ClipboardDetection{Type: "ip", Content: content}
		}
	}

	if strings.HasPrefix(content, "http://") || strings.HasPrefix(content, "https://") {
		if _, err := url.ParseRequestURI(content); err == nil {
			return &ClipboardDetection{Type: "url", Content: content}
		}
	}

	if emailRegex.MatchString(content) {
		return &ClipboardDetection{Type: "email", Content: content}
	}

	if hashRegex.MatchString(content) && !strings.Contains(content, " ") {
		return &ClipboardDetection{Type: "hash", Content: content}
	}

	log.Printf("Clipboard content not recognized as security-relevant: %.20s...", content)
	return nil
}
