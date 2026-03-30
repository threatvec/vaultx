// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
package notify

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net/http"
	"net/smtp"
	"time"
)

// Config holds notification configuration.
type Config struct {
	TelegramToken  string
	TelegramChatID string
	SMTPHost       string
	SMTPPort       string
	SMTPUser       string
	SMTPPass       string
	SMTPTo         string
	DiscordWebhook string
}

// Notifier sends notifications via multiple channels.
type Notifier struct {
	config Config
	client *http.Client
}

// NewNotifier creates a new Notifier.
func NewNotifier(cfg Config) *Notifier {
	return &Notifier{
		config: cfg,
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

// Send sends a notification via all configured channels.
func (n *Notifier) Send(title, message string) []error {
	var errs []error
	if n.config.TelegramToken != "" && n.config.TelegramChatID != "" {
		if err := n.SendTelegram(title, message); err != nil {
			errs = append(errs, fmt.Errorf("telegram: %w", err))
		}
	}
	if n.config.SMTPHost != "" && n.config.SMTPUser != "" {
		if err := n.SendEmail(title, message); err != nil {
			errs = append(errs, fmt.Errorf("email: %w", err))
		}
	}
	if n.config.DiscordWebhook != "" {
		if err := n.SendDiscord(title, message); err != nil {
			errs = append(errs, fmt.Errorf("discord: %w", err))
		}
	}
	return errs
}

// SendTelegram sends a message via Telegram bot.
func (n *Notifier) SendTelegram(title, message string) error {
	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", n.config.TelegramToken)
	text := fmt.Sprintf("🔒 *VAULTX Alert*\n*%s*\n\n%s", title, message)
	payload := map[string]interface{}{
		"chat_id":    n.config.TelegramChatID,
		"text":       text,
		"parse_mode": "Markdown",
	}
	body, _ := json.Marshal(payload)
	resp, err := n.client.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return fmt.Errorf("telegram API error: status %d", resp.StatusCode)
	}
	return nil
}

// SendEmail sends an email notification via SMTP.
func (n *Notifier) SendEmail(subject, body string) error {
	port := n.config.SMTPPort
	if port == "" {
		port = "587"
	}
	addr := fmt.Sprintf("%s:%s", n.config.SMTPHost, port)
	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: [VAULTX] %s\r\nMIME-version: 1.0;\r\nContent-Type: text/plain; charset=\"UTF-8\";\r\n\r\n%s",
		n.config.SMTPUser, n.config.SMTPTo, subject, body)

	var auth smtp.Auth
	if n.config.SMTPPass != "" {
		auth = smtp.PlainAuth("", n.config.SMTPUser, n.config.SMTPPass, n.config.SMTPHost)
	}

	tlsConfig := &tls.Config{ServerName: n.config.SMTPHost}
	conn, err := tls.Dial("tcp", addr, tlsConfig)
	if err != nil {
		// Fallback to non-TLS
		return smtp.SendMail(addr, auth, n.config.SMTPUser, []string{n.config.SMTPTo}, []byte(msg))
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, n.config.SMTPHost)
	if err != nil {
		return err
	}
	defer client.Close()

	if auth != nil {
		if err = client.Auth(auth); err != nil {
			return err
		}
	}
	if err = client.Mail(n.config.SMTPUser); err != nil {
		return err
	}
	if err = client.Rcpt(n.config.SMTPTo); err != nil {
		return err
	}
	w, err := client.Data()
	if err != nil {
		return err
	}
	defer w.Close()
	_, err = fmt.Fprint(w, msg)
	return err
}

// SendDiscord sends a message to a Discord webhook.
func (n *Notifier) SendDiscord(title, message string) error {
	payload := map[string]interface{}{
		"content": "",
		"embeds": []map[string]interface{}{
			{
				"title":       "🔒 " + title,
				"description": message,
				"color":       39168,
			},
		},
	}
	body, _ := json.Marshal(payload)
	resp, err := n.client.Post(n.config.DiscordWebhook, "application/json", bytes.NewReader(body))
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}

// TestTelegram tests a Telegram connection.
func TestTelegram(token, chatID string) error {
	n := NewNotifier(Config{TelegramToken: token, TelegramChatID: chatID})
	return n.SendTelegram("Test", "✅ VaultX Telegram bildirim sistemi çalışıyor!")
}

// TestEmail tests an SMTP connection.
func TestEmail(host, port, user, pass, to string) error {
	n := NewNotifier(Config{SMTPHost: host, SMTPPort: port, SMTPUser: user, SMTPPass: pass, SMTPTo: to})
	return n.SendEmail("Test Bildirimi", "✅ VaultX e-posta bildirim sistemi çalışıyor!")
}
