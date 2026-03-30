// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package db

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Database wraps the GORM DB connection and encryption key.
type Database struct {
	db  *gorm.DB
	key []byte
}

// CacheEntry stores API response caches to avoid redundant calls.
type CacheEntry struct {
	ID        uint      `gorm:"primaryKey"`
	Tool      string    `gorm:"index"`
	QueryHash string    `gorm:"index"`
	Response  string    `gorm:"type:text"`
	ExpiresAt time.Time `gorm:"index"`
	CreatedAt time.Time
}

// QueryHistory stores the history of user queries per tool.
type QueryHistory struct {
	ID        uint      `gorm:"primaryKey"`
	Tool      string    `gorm:"index"`
	Query     string    `gorm:"type:text"`
	Result    string    `gorm:"type:text"`
	CreatedAt time.Time `gorm:"index"`
}

// WatchTarget represents a target being monitored by NightWatch.
type WatchTarget struct {
	ID        uint   `gorm:"primaryKey"`
	Type      string `gorm:"index"`
	Value     string
	Enabled   bool `gorm:"default:true"`
	LastCheck time.Time
	CreatedAt time.Time
	UpdatedAt time.Time
}

// Alert stores security alerts and notifications.
type Alert struct {
	ID        uint   `gorm:"primaryKey"`
	Type      string `gorm:"index"`
	Severity  string
	Title     string
	Message   string `gorm:"type:text"`
	Read      bool   `gorm:"default:false"`
	CreatedAt time.Time
}

// Settings stores application settings as key-value pairs.
type Settings struct {
	ID    uint   `gorm:"primaryKey"`
	Key   string `gorm:"uniqueIndex"`
	Value string `gorm:"type:text"`
}

// Badge represents a gamification badge earned by the user.
type Badge struct {
	ID          uint   `gorm:"primaryKey"`
	Name        string `gorm:"uniqueIndex"`
	Description string
	Icon        string
	EarnedAt    time.Time
}

// QueryLog stores detailed query logs with risk scores, durations, and bookmark support.
type QueryLog struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	ToolName     string    `gorm:"index" json:"tool_name"`
	Input        string    `gorm:"type:text" json:"input"`
	Result       string    `gorm:"type:text" json:"result"`
	RiskScore    int       `json:"risk_score"`
	Duration     int64     `json:"duration"` // milliseconds
	IsBookmarked bool      `gorm:"default:false" json:"is_bookmarked"`
	CreatedAt    time.Time `gorm:"index" json:"created_at"`
}

// NewDatabase initializes the SQLite database with encryption.
func NewDatabase() (*Database, error) {
	dbPath, err := getDBPath()
	if err != nil {
		return nil, fmt.Errorf("failed to get db path: %w", err)
	}

	key, err := deriveKey()
	if err != nil {
		return nil, fmt.Errorf("failed to derive encryption key: %w", err)
	}

	db, err := gorm.Open(sqlite.Open(dbPath+"?_journal_mode=WAL&_busy_timeout=5000"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get sql.DB: %w", err)
	}
	sqlDB.SetMaxOpenConns(1)

	// SQLite performance pragmas
	db.Exec("PRAGMA synchronous = NORMAL")
	db.Exec("PRAGMA cache_size = 10000")
	db.Exec("PRAGMA temp_store = MEMORY")
	db.Exec("PRAGMA mmap_size = 268435456") // 256 MB

	err = db.AutoMigrate(
		&CacheEntry{},
		&QueryHistory{},
		&WatchTarget{},
		&Alert{},
		&Settings{},
		&Badge{},
		&QueryLog{},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to migrate database: %w", err)
	}

	return &Database{db: db, key: key}, nil
}

// Close closes the database connection.
func (d *Database) Close() {
	if d.db != nil {
		sqlDB, err := d.db.DB()
		if err == nil {
			sqlDB.Close()
		}
	}
}

// GetAllSettings returns all settings as a map.
func (d *Database) GetAllSettings() (map[string]string, error) {
	var settings []Settings
	if err := d.db.Find(&settings).Error; err != nil {
		return nil, err
	}
	result := make(map[string]string)
	for _, s := range settings {
		decrypted, err := d.Decrypt(s.Value)
		if err != nil {
			result[s.Key] = s.Value
		} else {
			result[s.Key] = decrypted
		}
	}
	return result, nil
}

// SaveSetting saves a setting with encryption.
func (d *Database) SaveSetting(key, value string) error {
	encrypted, err := d.Encrypt(value)
	if err != nil {
		return err
	}
	return d.db.Where(Settings{Key: key}).Assign(Settings{Value: encrypted}).FirstOrCreate(&Settings{}).Error
}

// GetQueryHistory returns recent queries for a tool.
func (d *Database) GetQueryHistory(toolName string, limit int) ([]QueryHistory, error) {
	var history []QueryHistory
	err := d.db.Where("tool = ?", toolName).Order("created_at DESC").Limit(limit).Find(&history).Error
	return history, err
}

// SaveQueryHistory saves a query to history.
func (d *Database) SaveQueryHistory(tool, query, result string) error {
	return d.db.Create(&QueryHistory{
		Tool:      tool,
		Query:     query,
		Result:    result,
		CreatedAt: time.Now(),
	}).Error
}

// GetCache returns a cached response if not expired.
func (d *Database) GetCache(tool, queryHash string) (string, bool) {
	var entry CacheEntry
	err := d.db.Where("tool = ? AND query_hash = ? AND expires_at > ?", tool, queryHash, time.Now()).First(&entry).Error
	if err != nil {
		return "", false
	}
	return entry.Response, true
}

// SetCache stores a response in cache with a TTL.
func (d *Database) SetCache(tool, queryHash, response string, ttl time.Duration) error {
	entry := CacheEntry{
		Tool:      tool,
		QueryHash: queryHash,
		Response:  response,
		ExpiresAt: time.Now().Add(ttl),
		CreatedAt: time.Now(),
	}
	return d.db.Create(&entry).Error
}

// ClearExpiredCache removes all expired cache entries from the database.
func (d *Database) ClearExpiredCache() error {
	return d.db.Where("expires_at < ?", time.Now()).Delete(&CacheEntry{}).Error
}

// Encrypt encrypts plaintext using AES-256-GCM.
func (d *Database) Encrypt(plaintext string) (string, error) {
	block, err := aes.NewCipher(d.key)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return hex.EncodeToString(ciphertext), nil
}

// Decrypt decrypts AES-256-GCM encrypted text.
func (d *Database) Decrypt(encrypted string) (string, error) {
	data, err := hex.DecodeString(encrypted)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(d.key)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

// GetBadges returns all earned badges.
func (d *Database) GetBadges() ([]Badge, error) {
	var badges []Badge
	err := d.db.Order("earned_at DESC").Find(&badges).Error
	return badges, err
}

// EarnBadge adds a badge if not already earned.
func (d *Database) EarnBadge(name, description, icon string) (bool, error) {
	var count int64
	d.db.Model(&Badge{}).Where("name = ?", name).Count(&count)
	if count > 0 {
		return false, nil
	}
	err := d.db.Create(&Badge{
		Name:        name,
		Description: description,
		Icon:        icon,
		EarnedAt:    time.Now(),
	}).Error
	return err == nil, err
}

// GetTotalQueryCount returns total number of queries across all tools.
func (d *Database) GetTotalQueryCount() int64 {
	var count int64
	d.db.Model(&QueryHistory{}).Count(&count)
	return count
}

// GetToolQueryCount returns query count for a specific tool.
func (d *Database) GetToolQueryCount(tool string) int64 {
	var count int64
	d.db.Model(&QueryHistory{}).Where("tool = ?", tool).Count(&count)
	return count
}

// GetRecentActivity returns the last N activities across all tools.
func (d *Database) GetRecentActivity(limit int) ([]QueryHistory, error) {
	var history []QueryHistory
	err := d.db.Order("created_at DESC").Limit(limit).Find(&history).Error
	return history, err
}

// getDBPath returns the path to the SQLite database file.
func getDBPath() (string, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	dbDir := filepath.Join(configDir, "vaultx")
	if err := os.MkdirAll(dbDir, 0700); err != nil {
		return "", err
	}
	return filepath.Join(dbDir, "vaultx.db"), nil
}

// deriveKey reads or creates a 32-byte random keyfile for encryption.
// On Windows: %APPDATA%/VAULTX/keyfile
// On Linux/Mac: $HOME/.config/vaultx/keyfile
func deriveKey() ([]byte, error) {
	keyfilePath, err := getKeyfilePath()
	if err != nil {
		return nil, fmt.Errorf("failed to get keyfile path: %w", err)
	}

	// Try to read existing keyfile
	data, err := os.ReadFile(keyfilePath)
	if err == nil && len(data) == 32 {
		return data, nil
	}

	// Generate new 32-byte random key
	key := make([]byte, 32)
	if _, err := rand.Read(key); err != nil {
		return nil, fmt.Errorf("failed to generate random key: %w", err)
	}

	// Ensure directory exists
	if err := os.MkdirAll(filepath.Dir(keyfilePath), 0700); err != nil {
		return nil, fmt.Errorf("failed to create keyfile directory: %w", err)
	}

	// Save keyfile with restricted permissions
	if err := os.WriteFile(keyfilePath, key, 0600); err != nil {
		return nil, fmt.Errorf("failed to write keyfile: %w", err)
	}

	return key, nil
}

// getKeyfilePath returns the platform-appropriate keyfile path.
func getKeyfilePath() (string, error) {
	if runtime.GOOS == "windows" {
		appData := os.Getenv("APPDATA")
		if appData == "" {
			return "", fmt.Errorf("APPDATA environment variable not set")
		}
		return filepath.Join(appData, "VAULTX", "keyfile"), nil
	}
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to get home directory: %w", err)
	}
	return filepath.Join(homeDir, ".config", "vaultx", "keyfile"), nil
}

// SaveQueryLog saves a detailed query log entry.
func (d *Database) SaveQueryLog(toolName, input, result string, riskScore int, duration int64) error {
	return d.db.Create(&QueryLog{
		ToolName:  toolName,
		Input:     input,
		Result:    result,
		RiskScore: riskScore,
		Duration:  duration,
		CreatedAt: time.Now(),
	}).Error
}

// GetQueryLogs returns query logs with optional filtering by tool, time range, and search text.
func (d *Database) GetQueryLogs(toolName string, from, to time.Time, search string, limit, offset int) ([]QueryLog, int64, error) {
	query := d.db.Model(&QueryLog{})

	if toolName != "" {
		query = query.Where("tool_name = ?", toolName)
	}
	if !from.IsZero() {
		query = query.Where("created_at >= ?", from)
	}
	if !to.IsZero() {
		query = query.Where("created_at <= ?", to)
	}
	if search != "" {
		like := "%" + search + "%"
		query = query.Where("input LIKE ? OR result LIKE ?", like, like)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var logs []QueryLog
	err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&logs).Error
	return logs, total, err
}

// BookmarkLog sets the bookmarked state for a query log entry.
func (d *Database) BookmarkLog(id uint, bookmarked bool) error {
	return d.db.Model(&QueryLog{}).Where("id = ?", id).Update("is_bookmarked", bookmarked).Error
}

// DeleteQueryLogs deletes specific log entries by IDs.
func (d *Database) DeleteQueryLogs(ids []uint) error {
	return d.db.Where("id IN ?", ids).Delete(&QueryLog{}).Error
}

// DeleteAllQueryLogs deletes all query log entries.
func (d *Database) DeleteAllQueryLogs() error {
	return d.db.Where("1 = 1").Delete(&QueryLog{}).Error
}

// VacuumDatabase runs SQLite VACUUM to reclaim disk space.
func (d *Database) VacuumDatabase() error {
	return d.db.Exec("VACUUM").Error
}
