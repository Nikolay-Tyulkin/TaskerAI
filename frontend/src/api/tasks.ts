import { apiRequest } from './client'
import type { Task, TaskFilters, TaskPayload } from '../types/task'

function buildQuery(filters: TaskFilters): string {
  const params = new URLSearchParams()

  if (filters.status) params.set('status', filters.status)
  if (filters.priority) params.set('priority', filters.priority)
  if (filters.search) params.set('search', filters.search)
  if (filters.deadline_from) params.set('deadline_from', filters.deadline_from)
  if (filters.deadline_to) params.set('deadline_to', filters.deadline_to)
  if (filters.tag) params.set('tag', String(filters.tag))
  if (filters.sort_by) params.set('sort_by', filters.sort_by)
  if (filters.sort_order) params.set('sort_order', filters.sort_order)

  const query = params.toString()
  return query ? `?${query}` : ''
}

export function fetchTasks(filters: TaskFilters): Promise<Task[]> {
  return apiRequest<Task[]>(`/api/tasks${buildQuery(filters)}`)
}

export function createTask(payload: TaskPayload): Promise<Task> {
  return apiRequest<Task>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function createSubtask(taskId: number, payload: TaskPayload): Promise<Task> {
  return apiRequest<Task>(`/api/tasks/${taskId}/subtasks`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateTask(taskId: number, payload: Partial<TaskPayload>): Promise<Task> {
  return apiRequest<Task>(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteTask(taskId: number, deleteStrategy?: 'cascade' | 'unlink'): Promise<void> {
  const query = deleteStrategy ? `?delete_strategy=${deleteStrategy}` : ''
  return apiRequest<void>(`/api/tasks/${taskId}${query}`, { method: 'DELETE' })
}

export function fetchStatusCounts(): Promise<Record<string, number>> {
  return apiRequest<Record<string, number>>('/api/tasks/status-counts')
}

export function applyAiSubtasks(taskId: number, suggestionId: number, selectedIndexes: number[]): Promise<Task[]> {
  return apiRequest<Task[]>(`/api/tasks/${taskId}/apply-ai-subtasks`, {
    method: 'POST',
    body: JSON.stringify({ suggestion_id: suggestionId, selected_indexes: selectedIndexes }),
  })
}

export function applyAiImprovement(taskId: number, suggestionId: number): Promise<Task> {
  return apiRequest<Task>(`/api/tasks/${taskId}/apply-ai-improvement`, {
    method: 'PATCH',
    body: JSON.stringify({ suggestion_id: suggestionId }),
  })
}
