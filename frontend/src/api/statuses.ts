import { apiRequest } from './client'

export type StatusItem = {
  id: number
  name: string
  is_system: boolean
  created_at: string
}

export function fetchStatuses(): Promise<StatusItem[]> {
  return apiRequest<StatusItem[]>('/api/statuses')
}

export function createStatus(name: string): Promise<StatusItem> {
  return apiRequest<StatusItem>('/api/statuses', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export function updateStatus(statusId: number, name: string): Promise<StatusItem> {
  return apiRequest<StatusItem>(`/api/statuses/${statusId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
}

export function deleteStatus(statusId: number): Promise<void> {
  return apiRequest<void>(`/api/statuses/${statusId}`, { method: 'DELETE' })
}
