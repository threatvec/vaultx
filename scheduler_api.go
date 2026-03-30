// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
package main

import "vaultx/internal/scheduler"

// GetScheduledTasks returns all scheduled tasks.
func (a *App) GetScheduledTasks() []scheduler.ScheduledTask {
	if a.scheduler == nil {
		return []scheduler.ScheduledTask{}
	}
	return a.scheduler.GetTasks()
}

// AddScheduledTask adds a new scheduled task.
func (a *App) AddScheduledTask(name, tool, target, schedule string) uint {
	if a.scheduler == nil {
		return 0
	}
	task := scheduler.ScheduledTask{
		Name:     name,
		Tool:     tool,
		Target:   target,
		Schedule: scheduler.ScheduleType(schedule),
		Enabled:  true,
	}
	return a.scheduler.AddTask(task)
}

// RemoveScheduledTask removes a scheduled task.
func (a *App) RemoveScheduledTask(id uint) {
	if a.scheduler != nil {
		a.scheduler.RemoveTask(id)
	}
}

// ToggleScheduledTask enables or disables a task.
func (a *App) ToggleScheduledTask(id uint, enabled bool) bool {
	if a.scheduler == nil {
		return false
	}
	return a.scheduler.UpdateTask(id, enabled)
}
