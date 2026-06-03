import { apiRequest } from './client'

export type TagItem = {
  id: number
  name: string
}

export function fetchTags(): Promise<TagItem[]> {
  return apiRequest<TagItem[]>('/api/tags')
}

export function createTag(name: string): Promise<TagItem> {
  return apiRequest<TagItem>('/api/tags', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export function updateTag(tagId: number, name: string): Promise<TagItem> {
  return apiRequest<TagItem>(`/api/tags/${tagId}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
}

export function deleteTag(tagId: number): Promise<void> {
  return apiRequest<void>(`/api/tags/${tagId}`, { method: 'DELETE' })
}
