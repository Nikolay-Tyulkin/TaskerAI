import { apiRequest } from './client'
import type { Task } from '../types/task'
import type { AiSettings, AiSuggestionHistoryItem, GenerateTasksResponse, ImproveTaskResponse, SplitTaskResponse } from '../types/ai'

export function fetchAiSettings(): Promise<AiSettings> {
  return apiRequest<AiSettings>('/api/ai/settings')
}

export function updateAiSettings(apiKey: string, selectedModel: string): Promise<AiSettings> {
  return apiRequest<AiSettings>('/api/ai/settings', {
    method: 'PUT',
    body: JSON.stringify({ api_key: apiKey, selected_model: selectedModel }),
  })
}

export function fetchAiModels(): Promise<{ models: string[] }> {
  return apiRequest<{ models: string[] }>('/api/ai/models')
}

export function fetchAiHistory(): Promise<AiSuggestionHistoryItem[]> {
  return apiRequest<AiSuggestionHistoryItem[]>('/api/ai/suggestions')
}

export function generateTasks(goal: string): Promise<GenerateTasksResponse> {
  return apiRequest<GenerateTasksResponse>('/api/ai/generate-tasks', {
    method: 'POST',
    body: JSON.stringify({ goal }),
  })
}

export function applyGeneratedTasks(suggestionId: number, selectedIndexes: number[]): Promise<Task[]> {
  return apiRequest<Task[]>('/api/ai/apply-generated-tasks', {
    method: 'POST',
    body: JSON.stringify({ suggestion_id: suggestionId, selected_indexes: selectedIndexes }),
  })
}

export function splitTask(text: string): Promise<SplitTaskResponse> {
  return apiRequest<SplitTaskResponse>('/api/ai/split-task', {
    method: 'POST',
    body: JSON.stringify({ text }),
  })
}

export function improveTask(title: string, description: string | null): Promise<ImproveTaskResponse> {
  return apiRequest<ImproveTaskResponse>('/api/ai/improve-task', {
    method: 'POST',
    body: JSON.stringify({ title, description }),
  })
}

export function cancelAiSuggestion(suggestionId: number): Promise<AiSuggestionHistoryItem> {
  return apiRequest<AiSuggestionHistoryItem>(`/api/ai/suggestions/${suggestionId}/cancel`, { method: 'POST' })
}
