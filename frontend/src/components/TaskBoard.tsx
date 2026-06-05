import { Button, Card, Empty, Modal, Progress, Space, Spin, Tag, Typography } from 'antd'
import { useState } from 'react'
import type { StatusItem } from '../api/statuses'
import type { Task } from '../types/task'

type TaskBoardProps = {
  tasks: Task[]
  loading: boolean
  hasFilters: boolean
  statuses: StatusItem[]
  onStatusChange: (task: Task, status: string) => void
  onResetFilters: () => void
}

function formatDate(value: string | null): string {
  if (!value) return 'Без дедлайна'
  return new Intl.DateTimeFormat('ru-RU').format(new Date(value))
}

export function TaskBoard({ tasks, loading, hasFilters, statuses, onStatusChange, onResetFilters }: TaskBoardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const parentTasks = tasks.filter((task) => task.parent_task_id === null)
  const subtasksByParent = new Map<number, Task[]>()

  for (const task of tasks) {
    if (task.parent_task_id === null) continue
    const subtasks = subtasksByParent.get(task.parent_task_id) ?? []
    subtasks.push(task)
    subtasksByParent.set(task.parent_task_id, subtasks)
  }

  const columnNames = statuses.map((status) => status.name)
  const unknownStatuses = parentTasks
    .map((task) => task.status)
    .filter((status, index, allStatuses) => !columnNames.includes(status) && allStatuses.indexOf(status) === index)
  const columns = [...columnNames, ...unknownStatuses]
  const selectedSubtasks = selectedTask ? subtasksByParent.get(selectedTask.id) ?? [] : []

  return (
    <>
      <Card title="Канбан-доска" className="panel-card task-board-card">
        <Spin spinning={loading}>
          {parentTasks.length === 0 ? (
            <Empty
              description={hasFilters ? 'По выбранным условиям задач на доске нет' : 'Задач пока нет'}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              {hasFilters ? <Button onClick={onResetFilters}>Сбросить фильтры</Button> : null}
            </Empty>
          ) : (
            <div className="kanban-board" aria-label="Канбан-доска">
              {columns.map((status) => {
                const columnTasks = parentTasks.filter((task) => task.status === status)
                return (
                  <section className="kanban-column" key={status} aria-label={`Колонка ${status}`}>
                    <div className="kanban-column-header">
                      <Typography.Title level={4}>{status}</Typography.Title>
                      <Tag>{columnTasks.length}</Tag>
                    </div>
                    {columnTasks.length === 0 ? (
                      <Typography.Text type="secondary">Задач в этом статусе нет</Typography.Text>
                    ) : (
                      <div className="kanban-cards">
                        {columnTasks.map((task) => {
                          const subtasks = subtasksByParent.get(task.id) ?? []
                          const doneSubtasks = subtasks.filter((subtask) => subtask.status === 'Выполнено').length
                          const progressPercent = subtasks.length > 0 ? Math.round((doneSubtasks / subtasks.length) * 100) : 0

                          return (
                            <article
                              className="kanban-card"
                              key={task.id}
                              onClick={() => setSelectedTask(task)}
                              tabIndex={0}
                              role="button"
                              aria-label={`Открыть задачу ${task.title}`}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') setSelectedTask(task)
                              }}
                            >
                              <Space size={6} wrap>
                                {task.priority ? <Tag>{task.priority}</Tag> : null}
                                {task.tags.map((tag) => <Tag key={tag.id}>{tag.name}</Tag>)}
                              </Space>
                              <Typography.Title level={5}>{task.title}</Typography.Title>
                              {task.description ? <Typography.Paragraph>{task.description}</Typography.Paragraph> : null}
                              <Typography.Text type="secondary">{formatDate(task.deadline)}</Typography.Text>
                              {subtasks.length > 0 ? (
                                <div className="kanban-subtask-progress" aria-label={`Подзадачи выполнены ${doneSubtasks} из ${subtasks.length}`}>
                                  <Typography.Text type="secondary">Подзадачи: {doneSubtasks}/{subtasks.length}</Typography.Text>
                                  <Progress percent={progressPercent} size="small" showInfo={false} />
                                </div>
                              ) : null}
                              <div className="kanban-card-actions">
                                <Button
                                  size="small"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setSelectedTask(task)
                                  }}
                                >
                                  Открыть
                                </Button>
                                {columns.filter((nextStatus) => nextStatus !== task.status).map((nextStatus) => (
                                  <Button
                                    key={nextStatus}
                                    size="small"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      onStatusChange(task, nextStatus)
                                    }}
                                    aria-label={`Перевести задачу ${task.title} в ${nextStatus}`}
                                  >
                                    Перевести: {nextStatus}
                                  </Button>
                                ))}
                              </div>
                            </article>
                          )
                        })}
                      </div>
                    )}
                  </section>
                )
              })}
            </div>
          )}
        </Spin>
      </Card>
      <Modal destroyOnHidden footer={null} onCancel={() => setSelectedTask(null)} open={Boolean(selectedTask)} title={selectedTask?.title}>
        {selectedTask?.description ? <Typography.Paragraph>{selectedTask.description}</Typography.Paragraph> : null}
        <Space size={8} wrap>
          {selectedTask ? <Tag color="blue">{selectedTask.status}</Tag> : null}
          {selectedTask?.priority ? <Tag>{selectedTask.priority}</Tag> : null}
          {selectedTask?.tags.map((tag) => <Tag key={tag.id}>{tag.name}</Tag>)}
        </Space>
        <div className="kanban-modal-subtasks">
          <Typography.Text strong>Подзадачи</Typography.Text>
          {selectedSubtasks.length === 0 ? (
            <Empty description="Подзадач нет" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            selectedSubtasks.map((subtask) => (
              <div className="kanban-modal-subtask" key={subtask.id}>
                <Typography.Text>{subtask.title}</Typography.Text>
                <Tag>{subtask.status}</Tag>
              </div>
            ))
          )}
        </div>
      </Modal>
    </>
  )
}
