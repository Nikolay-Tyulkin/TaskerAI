import { Button, Card, Checkbox, Dropdown, Empty, Popconfirm, Select, Space, Spin, Tag, Typography } from 'antd'
import type { StatusItem } from '../api/statuses'
import type { Task } from '../types/task'

type TaskListProps = {
  tasks: Task[]
  loading: boolean
  hasFilters: boolean
  statuses: StatusItem[]
  statusCounts: Record<string, number>
  onEdit: (task: Task) => void
  onDelete: (taskId: number, deleteStrategy?: 'cascade' | 'unlink') => void
  onStatusChange: (task: Task, status: string) => void
  onSplitWithAi: (task: Task) => void
  onImproveWithAi: (task: Task) => void
  onResetFilters: () => void
}

function formatDate(value: string | null): string {
  if (!value) return 'Без дедлайна'
  return new Intl.DateTimeFormat('ru-RU').format(new Date(value))
}

export function TaskList({
  tasks,
  loading,
  hasFilters,
  statuses,
  statusCounts,
  onEdit,
  onDelete,
  onImproveWithAi,
  onStatusChange,
  onSplitWithAi,
  onResetFilters,
}: TaskListProps) {
  const parentTasks = tasks.filter((task) => task.parent_task_id === null)
  const subtasksByParent = new Map<number, Task[]>()

  for (const task of tasks) {
    if (task.parent_task_id === null) continue
    const subtasks = subtasksByParent.get(task.parent_task_id) ?? []
    subtasks.push(task)
    subtasksByParent.set(task.parent_task_id, subtasks)
  }

  return (
    <Card title="Список задач" className="panel-card task-list-card">
      {Object.keys(statusCounts).length > 0 ? (
        <Space size={8} wrap className="status-counts">
          {Object.entries(statusCounts).map(([name, count]) => (
            <Tag key={name}>{name}: {count}</Tag>
          ))}
        </Space>
      ) : null}
      <Spin spinning={loading}>
        {parentTasks.length === 0 ? (
          <Empty
            description={hasFilters ? 'По выбранным условиям задач нет' : 'Задач пока нет'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {hasFilters ? <Button onClick={onResetFilters}>Сбросить фильтры</Button> : null}
          </Empty>
        ) : (
          <div className="task-list">
            {parentTasks.map((task) => {
              const subtasks = subtasksByParent.get(task.id) ?? []
              return (
              <article className="task-item" key={task.id}>
                <div className="task-main">
                  <Space size={8} wrap>
                    <Tag color="blue">{task.status}</Tag>
                    {task.priority ? <Tag>{task.priority}</Tag> : null}
                    {task.tags.map((tag) => <Tag key={tag.id}>{tag.name}</Tag>)}
                    <Typography.Text type="secondary">{formatDate(task.deadline)}</Typography.Text>
                  </Space>
                  <Typography.Title level={4}>{task.title}</Typography.Title>
                  {task.description ? <Typography.Paragraph>{task.description}</Typography.Paragraph> : null}
                  {subtasks.length > 0 ? (
                    <div className="subtask-checklist">
                      <Typography.Text strong>Подзадачи</Typography.Text>
                      {subtasks.map((subtask) => (
                        <div className="subtask-row" key={subtask.id}>
                          <div className="subtask-content">
                            <Checkbox
                              checked={subtask.status === 'Выполнено'}
                              onChange={(event) => onStatusChange(subtask, event.target.checked ? 'Выполнено' : 'К выполнению')}
                            >
                              <span className={subtask.status === 'Выполнено' ? 'subtask-done' : undefined}>{subtask.title}</span>
                            </Checkbox>
                            <Space size={6} wrap className="subtask-meta">
                              <Tag>{subtask.status}</Tag>
                              {subtask.priority ? <Tag>{subtask.priority}</Tag> : null}
                              {subtask.tags.map((tag) => <Tag key={tag.id}>{tag.name}</Tag>)}
                              <Typography.Text type="secondary">{formatDate(subtask.deadline)}</Typography.Text>
                            </Space>
                            {subtask.description ? <Typography.Paragraph>{subtask.description}</Typography.Paragraph> : null}
                          </div>
                          <Space size={4} wrap>
                            <Button size="small" type="link" onClick={() => onEdit(subtask)}>
                              Открыть
                            </Button>
                            <Popconfirm
                              title="Удалить подзадачу?"
                              description="Действие нельзя отменить."
                              okText="Удалить"
                              cancelText="Отмена"
                              onConfirm={() => onDelete(subtask.id)}
                            >
                              <Button danger size="small" type="link">
                                Удалить
                              </Button>
                            </Popconfirm>
                          </Space>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="task-actions">
                  <Select
                    aria-label={`Сменить статус задачи ${task.title}`}
                    value={task.status}
                    options={statuses.map((item) => ({ value: item.name, label: item.name }))}
                    onChange={(value) => onStatusChange(task, value)}
                  />
                  <Button onClick={() => onEdit(task)}>Редактировать</Button>
                  <Button icon={<span aria-hidden="true" className="wand-icon">✦</span>} onClick={() => onImproveWithAi(task)}>
                    Улучшить
                  </Button>
                  <Button icon={<span aria-hidden="true" className="wand-icon">↳</span>} onClick={() => onSplitWithAi(task)}>
                    Разбить AI
                  </Button>
                  {subtasks.length > 0 ? (
                    <Dropdown
                      menu={{
                        items: [
                          { key: 'cascade', label: 'Удалить вместе с подзадачами' },
                          { key: 'unlink', label: 'Удалить только задачу, подзадачи оставить' },
                        ],
                        onClick: ({ key }) => onDelete(task.id, key as 'cascade' | 'unlink'),
                      }}
                    >
                      <Button danger>Выбрать удаление</Button>
                    </Dropdown>
                  ) : (
                    <Popconfirm
                      title="Удалить задачу?"
                      description="Действие нельзя отменить."
                      okText="Удалить"
                      cancelText="Отмена"
                      onConfirm={() => onDelete(task.id)}
                    >
                      <Button danger>Удалить</Button>
                    </Popconfirm>
                  )}
                </div>
              </article>
              )
            })}
          </div>
        )}
      </Spin>
    </Card>
  )
}
