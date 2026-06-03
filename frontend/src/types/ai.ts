import type { TaskPriority } from './task'

export type AiSuggestedTask = {
  title: string
  description: string | null
  priority: TaskPriority | null
  tags: string[]
}

export type GenerateTasksResponse = {
  id: number | null
  type: 'generate_tasks'
  status: 'pending'
  provider: 'openrouter'
  model: string
  mock: boolean
  result: {
    tasks: AiSuggestedTask[]
  }
}

export type SplitTaskResponse = {
  id: number | null
  type: 'split_task'
  status: 'pending'
  provider: 'openrouter'
  model: string
  mock: boolean
  result: {
    subtasks: AiSuggestedTask[]
  }
}

export type ImproveTaskResponse = {
  id: number | null
  type: 'improve_task'
  status: 'pending'
  provider: 'openrouter'
  model: string
  mock: boolean
  result: {
    title: string
    description: string | null
  }
}

export type AiSettings = {
  provider: 'openrouter'
  selected_model: string | null
  is_configured: boolean
  mock: boolean
  masked_api_key: string | null
}

export type AiSuggestionHistoryItem = {
  id: number
  type: 'generate_tasks' | 'split_task' | 'improve_task'
  request_text: string
  response_payload: Record<string, unknown>
  model: string
  status: 'pending' | 'applied' | 'cancelled'
  created_at: string
}
