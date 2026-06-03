export type TaskPriority = 'Низкий' | 'Средний' | 'Высокий'
export type TaskStatus = 'К выполнению' | 'В работе' | 'Выполнено'

export type Task = {
  id: number
  title: string
  description: string | null
  status: string
  priority: TaskPriority | null
  deadline: string | null
  parent_task_id: number | null
  tags: { id: number; name: string }[]
  created_at: string
  updated_at: string
}

export type TaskFilters = {
  status?: string
  priority?: TaskPriority
  search?: string
  deadline_from?: string
  deadline_to?: string
  tag?: number
  sort_by?: 'created_at' | 'deadline' | 'priority' | 'status'
  sort_order?: 'asc' | 'desc'
}

export type TaskPayload = {
  title: string
  description?: string | null
  status?: string
  priority?: TaskPriority | null
  deadline?: string | null
  parent_task_id?: number | null
  tag_ids?: number[]
}
