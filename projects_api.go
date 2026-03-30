// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
package main

import "vaultx/internal/projects"

// GetProjects returns all projects.
func (a *App) GetProjects() []projects.Project {
	if a.projects == nil {
		return []projects.Project{}
	}
	return a.projects.GetAll()
}

// CreateProject creates a new project.
func (a *App) CreateProject(name, description, color string, targets []string) *projects.Project {
	if a.projects == nil {
		return nil
	}
	return a.projects.Create(name, description, color, targets)
}

// UpdateProject updates a project.
func (a *App) UpdateProject(id uint, name, description, color string, targets []string) error {
	if a.projects == nil {
		return nil
	}
	return a.projects.Update(id, name, description, color, targets)
}

// DeleteProject deletes a project.
func (a *App) DeleteProject(id uint) error {
	if a.projects == nil {
		return nil
	}
	return a.projects.Delete(id)
}
