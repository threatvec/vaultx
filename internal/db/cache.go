// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
// This software is proprietary and confidential.

package db

import (
	"crypto/sha256"
	"encoding/hex"
	"sync"
	"time"
)

// MemoryCache provides a fast in-memory TTL cache backed by SQLite persistence.
// Hot paths use the in-memory map; cold misses fall through to SQLite.
type MemoryCache struct {
	mu      sync.RWMutex
	entries map[string]*memoryCacheEntry
	db      *Database
}

// memoryCacheEntry is a single cached value with expiration.
type memoryCacheEntry struct {
	Value     string
	ExpiresAt time.Time
}

// NewMemoryCache creates a new MemoryCache instance backed by the given Database.
func NewMemoryCache(database *Database) *MemoryCache {
	mc := &MemoryCache{
		entries: make(map[string]*memoryCacheEntry),
		db:      database,
	}
	go mc.janitor()
	return mc
}

// CacheKey generates a deterministic SHA-256 hash key for a tool+query pair.
func CacheKey(tool, query string) string {
	h := sha256.Sum256([]byte(tool + ":" + query))
	return hex.EncodeToString(h[:])
}

// Get retrieves a cached value by tool and query. Returns (value, true) on hit.
func (mc *MemoryCache) Get(tool, query string) (string, bool) {
	key := CacheKey(tool, query)

	// Hot path: check in-memory first
	mc.mu.RLock()
	if entry, ok := mc.entries[key]; ok {
		if time.Now().Before(entry.ExpiresAt) {
			mc.mu.RUnlock()
			return entry.Value, true
		}
		mc.mu.RUnlock()
		mc.Expire(key)
		return "", false
	}
	mc.mu.RUnlock()

	// Cold path: check SQLite
	if mc.db != nil {
		if val, found := mc.db.GetCache(tool, key); found {
			// Promote to memory
			mc.mu.Lock()
			mc.entries[key] = &memoryCacheEntry{
				Value:     val,
				ExpiresAt: time.Now().Add(30 * time.Minute), // short in-memory TTL
			}
			mc.mu.Unlock()
			return val, true
		}
	}

	return "", false
}

// Set stores a value in both in-memory and SQLite caches with the given TTL.
func (mc *MemoryCache) Set(tool, query, value string, ttl time.Duration) {
	key := CacheKey(tool, query)
	expiresAt := time.Now().Add(ttl)

	mc.mu.Lock()
	mc.entries[key] = &memoryCacheEntry{
		Value:     value,
		ExpiresAt: expiresAt,
	}
	mc.mu.Unlock()

	// Persist to SQLite (non-blocking)
	if mc.db != nil {
		go func() {
			_ = mc.db.SetCache(tool, key, value, ttl)
		}()
	}
}

// Expire removes a specific key from the in-memory cache.
func (mc *MemoryCache) Expire(key string) {
	mc.mu.Lock()
	delete(mc.entries, key)
	mc.mu.Unlock()
}

// ExpireByTool removes all in-memory entries whose key was generated for the given tool.
// This is a blunt invalidation — O(n) walk but safe.
func (mc *MemoryCache) ExpireByTool(tool string) {
	mc.mu.Lock()
	for k := range mc.entries {
		// We can't reverse-map keys to tools cheaply, so clear all on tool invalidation
		delete(mc.entries, k)
	}
	mc.mu.Unlock()
}

// Clear removes all entries from both in-memory and SQLite caches.
func (mc *MemoryCache) Clear() {
	mc.mu.Lock()
	mc.entries = make(map[string]*memoryCacheEntry)
	mc.mu.Unlock()

	if mc.db != nil {
		go func() {
			_ = mc.db.ClearExpiredCache()
		}()
	}
}

// Stats returns the current number of in-memory entries.
func (mc *MemoryCache) Stats() int {
	mc.mu.RLock()
	defer mc.mu.RUnlock()
	return len(mc.entries)
}

// janitor runs every 5 minutes and evicts expired in-memory entries.
func (mc *MemoryCache) janitor() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		mc.evictExpired()
	}
}

// evictExpired removes all expired entries from the in-memory cache.
func (mc *MemoryCache) evictExpired() {
	now := time.Now()
	mc.mu.Lock()
	for k, v := range mc.entries {
		if now.After(v.ExpiresAt) {
			delete(mc.entries, k)
		}
	}
	mc.mu.Unlock()
}
