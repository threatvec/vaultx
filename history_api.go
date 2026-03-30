// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
package main

import (
	"fmt"
	"time"

	"vaultx/internal/db"
)

// SaveQueryLog saves a detailed query log entry.
func (a *App) SaveQueryLog(toolName, input, result string, riskScore int, duration int64) error {
	if a.db == nil {
		return fmt.Errorf("database not available")
	}
	return a.db.SaveQueryLog(toolName, input, result, riskScore, duration)
}

// GetQueryLogs returns query logs with filtering.
// fromStr/toStr are RFC3339 strings or empty for no filter.
// Returns: {"logs": []QueryLog, "total": int64}
func (a *App) GetQueryLogs(toolName string, fromStr, toStr, search string, limit, offset int) (map[string]interface{}, error) {
	if a.db == nil {
		return map[string]interface{}{"logs": []db.QueryLog{}, "total": int64(0)}, nil
	}

	var from, to time.Time
	var err error

	if fromStr != "" {
		from, err = time.Parse(time.RFC3339, fromStr)
		if err != nil {
			return nil, fmt.Errorf("invalid from time: %w", err)
		}
	}
	if toStr != "" {
		to, err = time.Parse(time.RFC3339, toStr)
		if err != nil {
			return nil, fmt.Errorf("invalid to time: %w", err)
		}
	}

	if limit <= 0 {
		limit = 50
	}

	logs, total, err := a.db.GetQueryLogs(toolName, from, to, search, limit, offset)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"logs":  logs,
		"total": total,
	}, nil
}

// BookmarkLog bookmarks or unbookmarks a log entry.
func (a *App) BookmarkLog(id uint, bookmarked bool) error {
	if a.db == nil {
		return fmt.Errorf("database not available")
	}
	return a.db.BookmarkLog(id, bookmarked)
}

// DeleteQueryLogs deletes specific log entries by IDs.
func (a *App) DeleteQueryLogs(ids []uint) error {
	if a.db == nil {
		return fmt.Errorf("database not available")
	}
	return a.db.DeleteQueryLogs(ids)
}

// DeleteAllQueryLogs deletes all query logs.
func (a *App) DeleteAllQueryLogs() error {
	if a.db == nil {
		return fmt.Errorf("database not available")
	}
	return a.db.DeleteAllQueryLogs()
}

// VacuumDatabase runs SQLite VACUUM to reclaim disk space.
func (a *App) VacuumDatabase() error {
	if a.db == nil {
		return fmt.Errorf("database not available")
	}
	return a.db.VacuumDatabase()
}
