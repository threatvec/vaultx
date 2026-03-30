// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
package projects

import (
	"fmt"
	"sync"
	"time"
)

// Project represents a workspace project.
type Project struct {
	ID          uint      `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Color       string    `json:"color"`
	Targets     []string  `json:"targets"`
	ScanCount   int       `json:"scan_count"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Manager manages projects in-memory (persisted via DB settings).
type Manager struct {
	mu       sync.RWMutex
	projects map[uint]*Project
	nextID   uint
}

// NewManager creates a new project manager.
func NewManager() *Manager {
	return &Manager{
		projects: make(map[uint]*Project),
		nextID:   1,
	}
}

// Create adds a new project.
func (m *Manager) Create(name, description, color string, targets []string) *Project {
	m.mu.Lock()
	defer m.mu.Unlock()
	p := &Project{
		ID:          m.nextID,
		Name:        name,
		Description: description,
		Color:       color,
		Targets:     targets,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	m.projects[m.nextID] = p
	m.nextID++
	return p
}

// Update modifies an existing project.
func (m *Manager) Update(id uint, name, description, color string, targets []string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	p, ok := m.projects[id]
	if !ok {
		return fmt.Errorf("project %d not found", id)
	}
	p.Name = name
	p.Description = description
	p.Color = color
	p.Targets = targets
	p.UpdatedAt = time.Now()
	return nil
}

// Delete removes a project.
func (m *Manager) Delete(id uint) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.projects[id]; !ok {
		return fmt.Errorf("project %d not found", id)
	}
	delete(m.projects, id)
	return nil
}

// GetAll returns all projects.
func (m *Manager) GetAll() []Project {
	m.mu.RLock()
	defer m.mu.RUnlock()
	result := make([]Project, 0, len(m.projects))
	for _, p := range m.projects {
		result = append(result, *p)
	}
	return result
}

// Get returns a single project.
func (m *Manager) Get(id uint) (*Project, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	p, ok := m.projects[id]
	if !ok {
		return nil, fmt.Errorf("project %d not found", id)
	}
	proj := *p
	return &proj, nil
}

// IncrementScanCount increments the scan count for a project.
func (m *Manager) IncrementScanCount(id uint) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if p, ok := m.projects[id]; ok {
		p.ScanCount++
	}
}
