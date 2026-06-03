import { Alert, Button, Card, Checkbox, Empty, Form, Input, Layout, Modal, Select, Space, Typography, message } from 'antd'
import { useEffect, useState } from 'react'
import { applyGeneratedTasks, cancelAiSuggestion, fetchAiHistory, fetchAiModels, fetchAiSettings, generateTasks, improveTask, splitTask, updateAiSettings } from '../api/ai'
import { applyAiImprovement, applyAiSubtasks, createTask, deleteTask, fetchStatusCounts, fetchTasks, updateTask } from '../api/tasks'
import { createStatus, deleteStatus, fetchStatuses, updateStatus, type StatusItem } from '../api/statuses'
import { createTag, deleteTag, fetchTags, updateTag, type TagItem } from '../api/tags'
import { TaskFiltersView } from '../components/TaskFilters'
import { TaskForm } from '../components/TaskForm'
import { TaskList } from '../components/TaskList'
import type { AiSettings, AiSuggestionHistoryItem, AiSuggestedTask, ImproveTaskResponse } from '../types/ai'
import type { Task, TaskFilters, TaskPayload } from '../types/task'

function hasActiveFilters(filters: TaskFilters): boolean {
  return Boolean(filters.status || filters.priority || filters.search || filters.deadline_from || filters.deadline_to || filters.tag)
}

function normalizePayload(payload: TaskPayload): TaskPayload {
  return {
    ...payload,
    description: payload.description?.trim() || null,
    priority: payload.priority ?? null,
    deadline: payload.deadline || null,
  }
}

export function TasksPage() {
  const [activePage, setActivePage] = useState<'tasks' | 'settings' | 'ai-history'>('tasks')
  const [tasks, setTasks] = useState<Task[]>([])
  const [statuses, setStatuses] = useState<StatusItem[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [filters, setFilters] = useState<TaskFilters>({})
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiApplying, setAiApplying] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [generateGoal, setGenerateGoal] = useState('')
  const [generateSuggestionId, setGenerateSuggestionId] = useState<number | null>(null)
  const [generatedSuggestions, setGeneratedSuggestions] = useState<AiSuggestedTask[]>([])
  const [selectedGeneratedTasks, setSelectedGeneratedTasks] = useState<number[]>([])
  const [splitSourceTask, setSplitSourceTask] = useState<Task | null>(null)
  const [splitSuggestionId, setSplitSuggestionId] = useState<number | null>(null)
  const [splitSuggestions, setSplitSuggestions] = useState<AiSuggestedTask[]>([])
  const [selectedSubtasks, setSelectedSubtasks] = useState<number[]>([])
  const [improveSourceTask, setImproveSourceTask] = useState<Task | null>(null)
  const [improveSuggestionId, setImproveSuggestionId] = useState<number | null>(null)
  const [improvement, setImprovement] = useState<ImproveTaskResponse['result'] | null>(null)
  const [aiSettings, setAiSettings] = useState<AiSettings | null>(null)
  const [aiModels, setAiModels] = useState<string[]>([])
  const [aiHistory, setAiHistory] = useState<AiSuggestionHistoryItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [messageApi, contextHolder] = message.useMessage()

  async function loadTasks(nextFilters = filters) {
    setLoading(true)
    setError(null)
    try {
      setTasks(await fetchTasks(nextFilters))
      setStatusCounts(await fetchStatusCounts())
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Не удалось загрузить задачи')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTasks()
    void loadDictionaries()
    void loadAiSettings()
  }, [])

  async function loadDictionaries() {
    try {
      const [nextStatuses, nextTags] = await Promise.all([fetchStatuses(), fetchTags()])
      setStatuses(nextStatuses)
      setTags(nextTags)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Не удалось загрузить справочники')
    }
  }

  async function loadAiSettings() {
    try {
      const settings = await fetchAiSettings()
      const models = await fetchAiModels()
      setAiSettings(settings)
      setAiModels(models.models)
    } catch {
      setAiSettings(null)
    }
  }

  async function loadAiHistory() {
    try {
      setAiHistory(await fetchAiHistory())
    } catch {
      setAiHistory([])
    }
  }

  async function handleSubmit(payload: TaskPayload): Promise<boolean> {
    setSubmitting(true)
    setError(null)
    try {
      if (editingTask) {
        await updateTask(editingTask.id, normalizePayload(payload))
        messageApi.success('Задача обновлена')
        setEditingTask(null)
      } else {
        await createTask(normalizePayload(payload))
        messageApi.success('Задача создана')
      }
      setTaskModalOpen(false)
      await loadTasks()
      return true
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Не удалось сохранить задачу')
      return false
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(taskId: number, deleteStrategy?: 'cascade' | 'unlink') {
    setError(null)
    try {
      await deleteTask(taskId, deleteStrategy)
      messageApi.success('Задача удалена')
      if (editingTask?.id === taskId) setEditingTask(null)
      await loadTasks()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Не удалось удалить задачу')
    }
  }

  async function handleStatusChange(task: Task, status: string) {
    setError(null)
    try {
      await updateTask(task.id, { status })
      messageApi.success('Статус обновлен')
      await loadTasks()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Не удалось изменить статус')
    }
  }

  async function openSplitModal(task: Task) {
    if (!aiSettings?.is_configured) {
      messageApi.error('Сначала настройте AI')
      return
    }
    setSplitSourceTask(task)
    setSplitSuggestions([])
    setSelectedSubtasks([])
    setAiError(null)
    setAiLoading(true)
    try {
      const response = await splitTask(`${task.title}\n${task.description ?? ''}`)
      setSplitSuggestionId(response.id)
      setSplitSuggestions(response.result.subtasks)
      setSelectedSubtasks(response.result.subtasks.map((_, index) => index))
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Не удалось разбить задачу')
    } finally {
      setAiLoading(false)
    }
  }

  async function requestGeneratedTasks() {
    if (!aiSettings?.is_configured) {
      messageApi.error('Сначала настройте AI')
      return
    }
    if (!generateGoal.trim()) {
      setAiError('Введите цель для генерации задач')
      return
    }
    setAiLoading(true)
    setAiError(null)
    try {
      const response = await generateTasks(generateGoal)
      setGenerateSuggestionId(response.id)
      setGeneratedSuggestions(response.result.tasks)
      setSelectedGeneratedTasks(response.result.tasks.map((_, index) => index))
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Не удалось сгенерировать задачи')
    } finally {
      setAiLoading(false)
    }
  }

  async function applySelectedGeneratedTasks() {
    if (generateSuggestionId === null) return
    setAiApplying(true)
    setAiError(null)
    try {
      await applyGeneratedTasks(generateSuggestionId, selectedGeneratedTasks)
      messageApi.success('AI-задачи созданы')
      await loadDictionaries()
      await loadTasks()
      closeGenerateModal(false)
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Не удалось применить AI-задачи')
    } finally {
      setAiApplying(false)
    }
  }

  async function closeGenerateModal(cancel = true) {
    if (cancel && generateSuggestionId !== null) await cancelAiSuggestion(generateSuggestionId)
    setGenerateModalOpen(false)
    setGenerateGoal('')
    setGenerateSuggestionId(null)
    setGeneratedSuggestions([])
    setSelectedGeneratedTasks([])
    void loadAiHistory()
  }

  async function applySelectedSubtasks() {
    if (!splitSourceTask || splitSuggestionId === null) return
    setAiApplying(true)
    setAiError(null)
    try {
      await applyAiSubtasks(splitSourceTask.id, splitSuggestionId, selectedSubtasks)
      messageApi.success('AI-предложения добавлены как подзадачи')
      await loadDictionaries()
      await loadTasks()
      setSplitSourceTask(null)
      setSplitSuggestionId(null)
      setSplitSuggestions([])
      setSelectedSubtasks([])
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Не удалось добавить подзадачи')
    } finally {
      setAiApplying(false)
    }
  }

  async function openImproveModal(task: Task) {
    if (!aiSettings?.is_configured) {
      messageApi.error('Сначала настройте AI')
      return
    }
    setImproveSourceTask(task)
    setImproveSuggestionId(null)
    setImprovement(null)
    setAiError(null)
    setAiLoading(true)
    try {
      const response = await improveTask(task.title, task.description)
      setImproveSuggestionId(response.id)
      setImprovement(response.result)
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Не удалось улучшить формулировку')
    } finally {
      setAiLoading(false)
    }
  }

  async function applyImprovement() {
    if (!improveSourceTask || !improvement || improveSuggestionId === null) return
    setAiApplying(true)
    setAiError(null)
    try {
      await applyAiImprovement(improveSourceTask.id, improveSuggestionId)
      messageApi.success('AI-улучшение применено')
      await loadTasks()
      setImproveSourceTask(null)
      setImproveSuggestionId(null)
      setImprovement(null)
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Не удалось применить улучшение')
    } finally {
      setAiApplying(false)
    }
  }

  function applyFilters(nextFilters: TaskFilters) {
    setFilters(nextFilters)
    void loadTasks(nextFilters)
  }

  function resetFilters() {
    const emptyFilters: TaskFilters = {}
    setFilters(emptyFilters)
    void loadTasks(emptyFilters)
  }

  async function cancelSplit() {
    if (splitSuggestionId !== null) await cancelAiSuggestion(splitSuggestionId)
    setSplitSourceTask(null)
    setSplitSuggestionId(null)
    setSplitSuggestions([])
    setSelectedSubtasks([])
    void loadAiHistory()
  }

  async function cancelImprove() {
    if (improveSuggestionId !== null) await cancelAiSuggestion(improveSuggestionId)
    setImproveSourceTask(null)
    setImproveSuggestionId(null)
    setImprovement(null)
    void loadAiHistory()
  }

  function openCreateModal() {
    setEditingTask(null)
    setTaskModalOpen(true)
  }

  function openEditModal(task: Task) {
    setEditingTask(task)
    setTaskModalOpen(true)
  }

  function closeTaskModal() {
    setTaskModalOpen(false)
    setEditingTask(null)
  }

  async function saveAiSettings(values: { apiKey: string; selectedModel: string | string[] }) {
    const selectedModel = Array.isArray(values.selectedModel) ? values.selectedModel[0] : values.selectedModel
    const settings = await updateAiSettings(values.apiKey, selectedModel)
    const models = await fetchAiModels()
    setAiSettings(settings)
    setAiModels(models.models)
    messageApi.success('AI-настройки сохранены')
  }

  async function createStatusFromForm(values: { name: string }) {
    await createStatus(values.name)
    messageApi.success('Статус создан')
    await loadDictionaries()
  }

  async function renameStatus(item: StatusItem) {
    const name = window.prompt('Новое название статуса', item.name)?.trim()
    if (!name || name === item.name) return
    await updateStatus(item.id, name)
    messageApi.success('Статус обновлен')
    await loadDictionaries()
    await loadTasks()
  }

  async function removeStatus(item: StatusItem) {
    await deleteStatus(item.id)
    messageApi.success('Статус удален')
    await loadDictionaries()
    await loadTasks()
  }

  async function createTagFromForm(values: { name: string }) {
    await createTag(values.name)
    messageApi.success('Тег создан')
    await loadDictionaries()
  }

  async function renameTag(item: TagItem) {
    const name = window.prompt('Новое название тега', item.name)?.trim()
    if (!name || name === item.name) return
    await updateTag(item.id, name)
    messageApi.success('Тег обновлен')
    await loadDictionaries()
    await loadTasks()
  }

  async function removeTag(item: TagItem) {
    await deleteTag(item.id)
    messageApi.success('Тег удален')
    await loadDictionaries()
    await loadTasks()
  }

  return (
    <Layout className="app-layout">
      {contextHolder}
      <Layout.Sider className="app-sidebar" breakpoint="lg" collapsedWidth="0" width={232}>
        <div className="brand">Tasker</div>
        <nav className="sidebar-nav">
          <button aria-current={activePage === 'tasks' ? 'page' : undefined} onClick={() => setActivePage('tasks')} type="button">
            Задачи
          </button>
          <button aria-current={activePage === 'settings' ? 'page' : undefined} onClick={() => setActivePage('settings')} type="button">
            Настройки
          </button>
          <button
            aria-current={activePage === 'ai-history' ? 'page' : undefined}
            onClick={() => {
              setActivePage('ai-history')
              void loadAiHistory()
            }}
            type="button"
          >
            AI история
          </button>
        </nav>
      </Layout.Sider>
      <Layout.Content className="app-content" id="tasks">
        {activePage === 'tasks' ? (
          <>
            <header className="page-header">
              <div>
                <Typography.Title>Задачи</Typography.Title>
                <Typography.Paragraph>
                  Создавайте задачи, меняйте статус и находите нужное через фильтры.
                </Typography.Paragraph>
              </div>
              <Button type="primary" onClick={openCreateModal}>
                Создать задачу
              </Button>
              <Button onClick={() => setGenerateModalOpen(true)}>
                AI сгенерировать
              </Button>
            </header>
            {error ? (
              <Alert
                type="error"
                message="Ошибка"
                description={error}
                showIcon
                action={
                  <button className="link-button" onClick={() => void loadTasks()} type="button">
                    Повторить
                  </button>
                }
              />
            ) : null}
            <div className="tasks-stack">
              <TaskFiltersView filters={filters} loading={loading} statuses={statuses} tags={tags} onApply={applyFilters} onReset={resetFilters} />
              <TaskList
                tasks={tasks}
                loading={loading}
                hasFilters={hasActiveFilters(filters)}
                statuses={statuses}
                statusCounts={statusCounts}
                onEdit={openEditModal}
                onDelete={(taskId, deleteStrategy) => void handleDelete(taskId, deleteStrategy)}
                onImproveWithAi={(task) => void openImproveModal(task)}
                onSplitWithAi={(task) => void openSplitModal(task)}
                onStatusChange={(task, status) => void handleStatusChange(task, status)}
                onResetFilters={resetFilters}
              />
            </div>
          </>
        ) : activePage === 'settings' ? (
          <div className="history-page">
            <Typography.Title>Настройки</Typography.Title>
            <Card title="Статусы и теги" className="panel-card">
              <div className="dictionaries-grid">
                <div>
                  <Typography.Title level={4}>Статусы</Typography.Title>
                  <Form layout="inline" onFinish={createStatusFromForm}>
                    <Form.Item name="name" rules={[{ required: true, whitespace: true, message: 'Введите статус' }]}>
                      <Input placeholder="Новый статус" />
                    </Form.Item>
                    <Button htmlType="submit">Добавить</Button>
                  </Form>
                  <Space direction="vertical" className="dictionary-list">
                    {statuses.map((item) => (
                      <Space key={item.id} wrap>
                        <Typography.Text>{item.name}</Typography.Text>
                        {item.is_system ? <Typography.Text type="secondary">системный</Typography.Text> : <Button size="small" onClick={() => void renameStatus(item)}>Переименовать</Button>}
                        {!item.is_system ? <Button danger size="small" onClick={() => void removeStatus(item)}>Удалить</Button> : null}
                      </Space>
                    ))}
                  </Space>
                </div>
                <div>
                  <Typography.Title level={4}>Теги</Typography.Title>
                  <Form layout="inline" onFinish={createTagFromForm}>
                    <Form.Item name="name" rules={[{ required: true, whitespace: true, message: 'Введите тег' }]}>
                      <Input placeholder="Новый тег" />
                    </Form.Item>
                    <Button htmlType="submit">Добавить</Button>
                  </Form>
                  <Space direction="vertical" className="dictionary-list">
                    {tags.map((item) => (
                      <Space key={item.id} wrap>
                        <Typography.Text>{item.name}</Typography.Text>
                        <Button size="small" onClick={() => void renameTag(item)}>Переименовать</Button>
                        <Button danger size="small" onClick={() => void removeTag(item)}>Удалить</Button>
                      </Space>
                    ))}
                  </Space>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="history-page">
            <Typography.Title>AI история</Typography.Title>
            <Card title="AI-настройки">
              <Typography.Paragraph>
                {aiSettings?.mock ? 'Включен mock-режим, реальный ключ не требуется.' : `Ключ: ${aiSettings?.masked_api_key ?? 'не задан'}`}
              </Typography.Paragraph>
              <Form layout="vertical" onFinish={saveAiSettings}>
                <Form.Item label="OpenRouter API key" name="apiKey" rules={[{ required: !aiSettings?.mock, message: 'Введите ключ' }]}>
                  <Input.Password placeholder="Введите ключ локально" />
                </Form.Item>
                <Form.Item label="Модель" name="selectedModel" initialValue={[aiSettings?.selected_model ?? 'openrouter/auto']} rules={[{ required: true }]}>
                  <Select
                    mode="tags"
                    maxCount={1}
                    options={[...new Set(['openrouter/auto', ...aiModels])].map((model) => ({ value: model, label: model }))}
                    placeholder="Например, openai/gpt-4o-mini"
                    showSearch
                  />
                </Form.Item>
                <Button type="primary" htmlType="submit">Сохранить AI-настройки</Button>
              </Form>
            </Card>
            <Card title="История запросов">
              {aiHistory.length === 0 ? (
                <Empty description="AI-запросов пока нет" />
              ) : (
                <Space direction="vertical" className="history-list">
                  {aiHistory.map((item) => (
                    <Card size="small" key={item.id} title={`${item.type} #${item.id}`}>
                      <Typography.Paragraph>{item.request_text}</Typography.Paragraph>
                      <Typography.Text type="secondary">{item.status} · {item.model}</Typography.Text>
                    </Card>
                  ))}
                </Space>
              )}
            </Card>
          </div>
        )}
        <Modal
          destroyOnClose
          footer={null}
          onCancel={closeTaskModal}
          open={taskModalOpen}
          title={editingTask ? 'Редактирование задачи' : 'Новая задача'}
        >
          <TaskForm
            task={editingTask}
            submitting={submitting}
            statuses={statuses}
            tags={tags}
            onSubmit={handleSubmit}
            onCancelEdit={closeTaskModal}
          />
        </Modal>
        <Modal
          confirmLoading={aiApplying}
          okButtonProps={{ disabled: selectedGeneratedTasks.length === 0 || generatedSuggestions.length === 0 }}
          okText="Создать выбранные"
          onCancel={() => void closeGenerateModal()}
          onOk={() => void applySelectedGeneratedTasks()}
          open={generateModalOpen}
          title="AI-генерация задач"
        >
          {aiError ? <Alert type="error" message={aiError} showIcon /> : null}
          <Space direction="vertical" className="history-list">
            <Input.TextArea rows={4} value={generateGoal} onChange={(event) => setGenerateGoal(event.target.value)} placeholder="Опишите цель или результат" />
            <Button loading={aiLoading} onClick={() => void requestGeneratedTasks()}>Получить предложения</Button>
            {generatedSuggestions.length > 0 ? (
              <Checkbox.Group value={selectedGeneratedTasks} onChange={(values) => setSelectedGeneratedTasks(values.map(Number))}>
                <Space direction="vertical">
                  {generatedSuggestions.map((suggestion, index) => (
                    <Checkbox key={`${suggestion.title}-${index}`} value={index}>{suggestion.title}</Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            ) : null}
          </Space>
        </Modal>
        <Modal
          confirmLoading={aiApplying}
          okButtonProps={{ disabled: selectedSubtasks.length === 0 || splitSuggestions.length === 0 }}
          okText="Добавить выбранные"
          onCancel={() => void cancelSplit()}
          onOk={() => void applySelectedSubtasks()}
          open={Boolean(splitSourceTask)}
          title="AI-разбиение задачи"
        >
          {aiError ? <Alert type="error" message={aiError} showIcon /> : null}
          {aiLoading ? <Typography.Paragraph>AI готовит предложения...</Typography.Paragraph> : null}
          {splitSuggestions.length > 0 ? (
            <Checkbox.Group value={selectedSubtasks} onChange={(values) => setSelectedSubtasks(values.map(Number))}>
              <Space direction="vertical">
                {splitSuggestions.map((suggestion, index) => (
                  <Checkbox key={`${suggestion.title}-${index}`} value={index}>
                    {suggestion.title}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          ) : null}
        </Modal>
        <Modal
          confirmLoading={aiApplying}
          okButtonProps={{ disabled: !improvement }}
          okText="Применить"
          onCancel={() => void cancelImprove()}
          onOk={() => void applyImprovement()}
          open={Boolean(improveSourceTask)}
          title="AI-улучшение формулировки"
        >
          {aiError ? <Alert type="error" message={aiError} showIcon /> : null}
          {aiLoading ? <Typography.Paragraph>AI готовит улучшение...</Typography.Paragraph> : null}
          {improvement ? (
            <div className="ai-suggestions compact">
              <Typography.Text strong>{improvement.title}</Typography.Text>
              {improvement.description ? <Typography.Paragraph>{improvement.description}</Typography.Paragraph> : null}
            </div>
          ) : null}
        </Modal>
      </Layout.Content>
    </Layout>
  )
}
