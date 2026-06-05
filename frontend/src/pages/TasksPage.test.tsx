import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TasksPage } from './TasksPage'
import { createTask, fetchTasks, updateTask } from '../api/tasks'

vi.mock('../api/tasks', () => ({
  applyAiImprovement: vi.fn(),
  applyAiSubtasks: vi.fn(),
  createSubtask: vi.fn(),
  createTask: vi.fn(),
  deleteTask: vi.fn(),
  fetchStatusCounts: vi.fn().mockResolvedValue({}),
  fetchTasks: vi.fn(),
  updateTask: vi.fn(),
}))

vi.mock('../api/statuses', () => ({
  createStatus: vi.fn(),
  deleteStatus: vi.fn(),
  fetchStatuses: vi.fn().mockResolvedValue([
    { id: 1, name: 'К выполнению', is_system: true, created_at: '' },
    { id: 2, name: 'В работе', is_system: true, created_at: '' },
    { id: 3, name: 'Выполнено', is_system: true, created_at: '' },
  ]),
  updateStatus: vi.fn(),
}))

vi.mock('../api/tags', () => ({
  createTag: vi.fn(),
  deleteTag: vi.fn(),
  fetchTags: vi.fn().mockResolvedValue([{ id: 1, name: 'mvp' }]),
  updateTag: vi.fn(),
}))

vi.mock('../api/ai', () => ({
  fetchAiHistory: vi.fn().mockResolvedValue([]),
  fetchAiModels: vi.fn().mockResolvedValue({ models: ['mock/tasker-local'] }),
  fetchAiSettings: vi.fn().mockResolvedValue({ provider: 'openrouter', selected_model: 'mock/tasker-local', is_configured: true, mock: true, masked_api_key: null }),
  improveTask: vi.fn(),
  splitTask: vi.fn(),
  cancelAiSuggestion: vi.fn(),
  updateAiSettings: vi.fn(),
}))

const mockedFetchTasks = vi.mocked(fetchTasks)
const mockedCreateTask = vi.mocked(createTask)
const mockedUpdateTask = vi.mocked(updateTask)

describe('TasksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows empty state', async () => {
    mockedFetchTasks.mockResolvedValue([])

    render(<TasksPage />)

    expect(await screen.findByText('Задач пока нет')).toBeInTheDocument()
  })

  it('creates task through UI with mocked API', async () => {
    mockedFetchTasks.mockResolvedValueOnce([]).mockResolvedValueOnce([
      { id: 1, title: 'Новая задача', description: null, status: 'К выполнению', priority: null, deadline: null, parent_task_id: null, tags: [], created_at: '', updated_at: '' },
    ])
    mockedCreateTask.mockResolvedValue({ id: 1, title: 'Новая задача', description: null, status: 'К выполнению', priority: null, deadline: null, parent_task_id: null, tags: [], created_at: '', updated_at: '' })

    render(<TasksPage />)

    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Создать задачу' }).length).toBeGreaterThan(0))
    await userEvent.click(screen.getAllByRole('button', { name: 'Создать задачу' })[0])
    await userEvent.type(screen.getByLabelText('Название'), 'Новая задача')
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }))

    await waitFor(() => expect(mockedCreateTask).toHaveBeenCalled())
  })

  it('shows backend loading error', async () => {
    mockedFetchTasks.mockRejectedValue(new Error('Backend недоступен'))

    render(<TasksPage />)

    await waitFor(() => expect(mockedFetchTasks).toHaveBeenCalled())
    expect(await screen.findByText(/Backend недоступен/)).toBeInTheDocument()
  })

  it('shows subtask details, open action and delete strategy selector', async () => {
    mockedFetchTasks.mockResolvedValue([
      { id: 1, title: 'Родительская задача', description: null, status: 'К выполнению', priority: null, deadline: null, parent_task_id: null, tags: [], created_at: '', updated_at: '' },
      { id: 2, title: 'Подзадача', description: 'Описание подзадачи', status: 'В работе', priority: 'Высокий', deadline: '2026-06-10', parent_task_id: 1, tags: [{ id: 1, name: 'mvp' }], created_at: '', updated_at: '' },
    ])

    render(<TasksPage />)

    expect(await screen.findByText('Подзадача')).toBeInTheDocument()
    expect(screen.getByText('Описание подзадачи')).toBeInTheDocument()
    expect(screen.getByText('Высокий')).toBeInTheDocument()
    expect(screen.getByText('10.06.2026')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Открыть' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Удалить' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Выбрать удаление' })).toBeInTheDocument()
  })

  it('opens dictionaries on settings page', async () => {
    mockedFetchTasks.mockResolvedValue([])

    render(<TasksPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Настройки' }))

    expect(screen.getByRole('heading', { name: 'Настройки' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Статусы' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Теги' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Новый статус')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Новый тег')).toBeInTheDocument()
  })

  it('switches to board view and groups tasks by status columns', async () => {
    mockedFetchTasks.mockResolvedValue([
      { id: 1, title: 'Запланировать релиз', description: null, status: 'К выполнению', priority: null, deadline: null, parent_task_id: null, tags: [], created_at: '', updated_at: '' },
      { id: 2, title: 'Собрать UI', description: null, status: 'В работе', priority: null, deadline: null, parent_task_id: null, tags: [], created_at: '', updated_at: '' },
      { id: 3, title: 'Подзадача релиза', description: null, status: 'Выполнено', priority: null, deadline: null, parent_task_id: 1, tags: [], created_at: '', updated_at: '' },
    ])

    render(<TasksPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Доска' }))

    expect(screen.getByText('Канбан-доска')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Колонка К выполнению' })).toHaveTextContent('Запланировать релиз')
    expect(screen.getByRole('region', { name: 'Колонка В работе' })).toHaveTextContent('Собрать UI')
    expect(screen.getByRole('region', { name: 'Колонка Выполнено' })).toHaveTextContent('Задач в этом статусе нет')
    expect(screen.queryByRole('heading', { name: 'Подзадача релиза' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Подзадачи выполнены 1 из 1')).toBeInTheDocument()
  })

  it('opens parent task modal with subtasks from board card', async () => {
    mockedFetchTasks.mockResolvedValue([
      { id: 1, title: 'Родитель на доске', description: 'Описание родителя', status: 'К выполнению', priority: null, deadline: null, parent_task_id: null, tags: [], created_at: '', updated_at: '' },
      { id: 2, title: 'Подзадача в модалке', description: null, status: 'Выполнено', priority: null, deadline: null, parent_task_id: 1, tags: [], created_at: '', updated_at: '' },
    ])

    render(<TasksPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Доска' }))
    await userEvent.click(screen.getByRole('button', { name: 'Открыть' }))

    expect(screen.getByRole('dialog')).toHaveTextContent('Родитель на доске')
    expect(screen.getByRole('dialog')).toHaveTextContent('Подзадача в модалке')
    expect(screen.getByRole('dialog')).toHaveTextContent('Выполнено')
  })

  it('updates the same task status from board view', async () => {
    mockedFetchTasks
      .mockResolvedValueOnce([
        { id: 1, title: 'Переместить карточку', description: null, status: 'К выполнению', priority: null, deadline: null, parent_task_id: null, tags: [], created_at: '', updated_at: '' },
      ])
      .mockResolvedValueOnce([
        { id: 1, title: 'Переместить карточку', description: null, status: 'В работе', priority: null, deadline: null, parent_task_id: null, tags: [], created_at: '', updated_at: '' },
      ])
    mockedUpdateTask.mockResolvedValue({ id: 1, title: 'Переместить карточку', description: null, status: 'В работе', priority: null, deadline: null, parent_task_id: null, tags: [], created_at: '', updated_at: '' })

    render(<TasksPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Доска' }))
    await userEvent.click(screen.getByRole('button', { name: 'Перевести задачу Переместить карточку в В работе' }))

    await waitFor(() => expect(mockedUpdateTask).toHaveBeenCalledWith(1, { status: 'В работе' }))
  })

  it('keeps updated task visible when switching back to list view', async () => {
    mockedFetchTasks.mockResolvedValue([
      { id: 1, title: 'Проверить список', description: null, status: 'Выполнено', priority: null, deadline: null, parent_task_id: null, tags: [], created_at: '', updated_at: '' },
    ])

    render(<TasksPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Доска' }))
    expect(screen.getByRole('region', { name: 'Колонка Выполнено' })).toHaveTextContent('Проверить список')

    await userEvent.click(screen.getByRole('button', { name: 'Список' }))

    expect(screen.getByText('Список задач')).toBeInTheDocument()
    expect(screen.getByText('Проверить список')).toBeInTheDocument()
  })
})
