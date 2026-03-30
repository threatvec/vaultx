// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
package main

import (
	"vaultx/internal/notify"
	"vaultx/internal/proxy"
)

// TestTelegramNotification tests Telegram notification.
func (a *App) TestTelegramNotification(token, chatID string) error {
	return notify.TestTelegram(token, chatID)
}

// TestEmailNotification tests email/SMTP notification.
func (a *App) TestEmailNotification(host, port, user, pass, to string) error {
	return notify.TestEmail(host, port, user, pass, to)
}

// TestProxyConnection tests proxy connectivity.
func (a *App) TestProxyConnection(proxyType, host, port, username, password string) error {
	cfg := proxy.Config{
		Enabled:  true,
		Type:     proxyType,
		Host:     host,
		Port:     port,
		Username: username,
		Password: password,
	}
	return proxy.Test(cfg)
}
