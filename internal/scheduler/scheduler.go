// Copyright (c) 2026 threatvec & talkdedsec. All Rights Reserved.
package scheduler

import (
	"context"
	"sync"
	"time"
)

// ScheduleType defines how often a scheduled scan runs.
type ScheduleType string

const (
	ScheduleHourly  ScheduleType = "hourly"
	ScheduleDaily   ScheduleType = "daily"
	ScheduleWeekly  ScheduleType = "weekly"
	ScheduleCustom  ScheduleType = "custom"
)

// ScheduledTask represents a scheduled scan task.
type ScheduledTask struct {
	ID         uint         `json:"id"`
	Name       string       `json:"name"`
	Tool       string       `json:"tool"`
	Target     string       `json:"target"`
	Schedule   ScheduleType `json:"schedule"`
	CustomCron string       `json:"custom_cron,omitempty"`
	Enabled    bool         `json:"enabled"`
	LastRun    *time.Time   `json:"last_run,omitempty"`
	NextRun    *time.Time   `json:"next_run,omitempty"`
	LastResult string       `json:"last_result,omitempty"`
	CreatedAt  time.Time    `json:"created_at"`
}

// TaskRunner is called to execute a scheduled task.
type TaskRunner func(tool, target string) (string, error)

// Scheduler manages scheduled tasks.
type Scheduler struct {
	mu     sync.RWMutex
	tasks  map[uint]*ScheduledTask
	nextID uint
	runner TaskRunner
	cancel context.CancelFunc
}

// NewScheduler creates a new Scheduler.
func NewScheduler(runner TaskRunner) *Scheduler {
	return &Scheduler{
		tasks:  make(map[uint]*ScheduledTask),
		nextID: 1,
		runner: runner,
	}
}

// AddTask adds a new scheduled task.
func (s *Scheduler) AddTask(task ScheduledTask) uint {
	s.mu.Lock()
	defer s.mu.Unlock()
	task.ID = s.nextID
	task.CreatedAt = time.Now()
	next := s.calcNextRun(task.Schedule)
	task.NextRun = &next
	s.tasks[s.nextID] = &task
	s.nextID++
	return task.ID
}

// RemoveTask removes a scheduled task.
func (s *Scheduler) RemoveTask(id uint) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.tasks, id)
}

// UpdateTask updates a scheduled task.
func (s *Scheduler) UpdateTask(id uint, enabled bool) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	if task, ok := s.tasks[id]; ok {
		task.Enabled = enabled
		return true
	}
	return false
}

// GetTasks returns all tasks.
func (s *Scheduler) GetTasks() []ScheduledTask {
	s.mu.RLock()
	defer s.mu.RUnlock()
	tasks := make([]ScheduledTask, 0, len(s.tasks))
	for _, t := range s.tasks {
		tasks = append(tasks, *t)
	}
	return tasks
}

// Start begins the scheduler loop.
func (s *Scheduler) Start(ctx context.Context) {
	ctx, cancel := context.WithCancel(ctx)
	s.cancel = cancel
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.runDue()
		}
	}
}

// Stop halts the scheduler.
func (s *Scheduler) Stop() {
	if s.cancel != nil {
		s.cancel()
	}
}

func (s *Scheduler) runDue() {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now()
	for _, task := range s.tasks {
		if !task.Enabled {
			continue
		}
		if task.NextRun != nil && now.After(*task.NextRun) {
			go func(t *ScheduledTask) {
				result, err := s.runner(t.Tool, t.Target)
				s.mu.Lock()
				defer s.mu.Unlock()
				runTime := time.Now()
				t.LastRun = &runTime
				next := s.calcNextRun(t.Schedule)
				t.NextRun = &next
				if err != nil {
					t.LastResult = "Error: " + err.Error()
				} else {
					t.LastResult = result
				}
			}(task)
		}
	}
}

func (s *Scheduler) calcNextRun(schedule ScheduleType) time.Time {
	switch schedule {
	case ScheduleHourly:
		return time.Now().Add(1 * time.Hour)
	case ScheduleDaily:
		return time.Now().Add(24 * time.Hour)
	case ScheduleWeekly:
		return time.Now().Add(7 * 24 * time.Hour)
	default:
		return time.Now().Add(24 * time.Hour)
	}
}
