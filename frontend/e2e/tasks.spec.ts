import { expect, type APIRequestContext, type Page, test } from '@playwright/test'

const API_URL = 'http://127.0.0.1:8000'
const E2E_PREFIX = 'E2E task'

type TaskItem = {
  id: number
  title: string
  description: string | null
}

async function cleanupE2eTasks(request: APIRequestContext) {
  const response = await request.get(`${API_URL}/api/tasks?search=${encodeURIComponent(E2E_PREFIX)}`)
  if (!response.ok()) return

  const tasks = (await response.json()) as TaskItem[]
  for (const task of tasks) {
    if (!task.title.includes(E2E_PREFIX) && !task.description?.includes(E2E_PREFIX)) continue
    await request.delete(`${API_URL}/api/tasks/${task.id}?delete_strategy=cascade`)
  }
}

async function createTask(request: APIRequestContext, payload: Record<string, unknown>) {
  const response = await request.post(`${API_URL}/api/tasks`, { data: payload })
  expect(response.status()).toBe(201)
  return response.json() as Promise<TaskItem>
}

function taskArticle(page: Page, title: string) {
  return page.locator('article').filter({ has: page.getByRole('heading', { name: title }) })
}

async function selectOptionByKeyboard(page: Page, name: string | RegExp, key: 'ArrowDown' | 'ArrowUp', count = 1) {
  const combobox = typeof name === 'string'
    ? page.getByRole('combobox', { name, exact: true })
    : page.getByRole('combobox', { name })
  await combobox.click({ force: true })
  for (let index = 0; index < count; index += 1) {
    await combobox.press(key)
  }
  await combobox.press('Enter')
}

async function applyFilters(page: Page) {
  await page.getByRole('button', { name: 'Применить' }).click()
}

test.beforeEach(async ({ request }) => {
  await cleanupE2eTasks(request)
})

test.afterEach(async ({ request }) => {
  await cleanupE2eTasks(request)
})

test('opens the application', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/Tasker/)
  await expect(page.getByRole('heading', { name: 'Задачи' })).toBeVisible()
})

test('shows empty state', async ({ page }) => {
  await page.route('**/api/tasks/status-counts', async (route) => {
    await route.fulfill({ json: {} })
  })
  await page.route('**/api/tasks?**', async (route) => {
    await route.fulfill({ json: [] })
  })
  await page.route('**/api/tasks', async (route) => {
    await route.fulfill({ json: [] })
  })

  await page.goto('/')

  await expect(page.getByText('Задач пока нет')).toBeVisible()
})

test('creates, edits, changes status and deletes a task', async ({ page }) => {
  const title = `${E2E_PREFIX} CRUD ${Date.now()}`
  const updatedTitle = `${title} updated`

  await page.goto('/')
  await page.getByRole('button', { name: 'Создать задачу' }).click()
  await page.getByLabel('Название').fill(title)
  await page.getByLabel('Описание').fill(`${E2E_PREFIX} description`)
  await page.getByRole('button', { name: 'Создать', exact: true }).click()

  await expect(page.getByRole('heading', { name: title })).toBeVisible()

  await taskArticle(page, title).getByRole('button', { name: 'Редактировать' }).click()
  await page.getByLabel('Название').fill(updatedTitle)
  await page.getByRole('button', { name: 'Сохранить' }).click()

  await expect(page.getByRole('heading', { name: updatedTitle })).toBeVisible()

  await selectOptionByKeyboard(page, new RegExp(`Сменить статус задачи ${updatedTitle}`), 'ArrowDown')
  await expect(taskArticle(page, updatedTitle).getByText('В работе').first()).toBeVisible()

  await taskArticle(page, updatedTitle).getByRole('button', { name: 'Удалить' }).click()
  await page.getByRole('button', { name: 'Удалить' }).last().click()

  await expect(page.getByRole('heading', { name: updatedTitle })).toHaveCount(0)
})

test('filters tasks by status', async ({ page, request }) => {
  const suffix = Date.now()
  const target = `${E2E_PREFIX} status target ${suffix}`
  const other = `${E2E_PREFIX} status other ${suffix}`
  await createTask(request, { title: target, status: 'В работе', priority: 'Средний' })
  await createTask(request, { title: other, status: 'К выполнению', priority: 'Средний' })

  await page.goto('/')
  await selectOptionByKeyboard(page, 'Статус', 'ArrowDown')
  await applyFilters(page)

  await expect(page.getByRole('heading', { name: target })).toBeVisible()
  await expect(page.getByRole('heading', { name: other })).toHaveCount(0)
})

test('filters tasks by priority', async ({ page, request }) => {
  const suffix = Date.now()
  const target = `${E2E_PREFIX} priority target ${suffix}`
  const other = `${E2E_PREFIX} priority other ${suffix}`
  await createTask(request, { title: target, status: 'К выполнению', priority: 'Высокий' })
  await createTask(request, { title: other, status: 'К выполнению', priority: 'Низкий' })

  await page.goto('/')
  await selectOptionByKeyboard(page, 'Приоритет', 'ArrowUp')
  await applyFilters(page)

  await expect(page.getByRole('heading', { name: target })).toBeVisible()
  await expect(page.getByRole('heading', { name: other })).toHaveCount(0)
})

test('searches tasks by title', async ({ page, request }) => {
  const suffix = Date.now()
  const target = `${E2E_PREFIX} search target ${suffix}`
  const other = `${E2E_PREFIX} search other ${suffix}`
  await createTask(request, { title: target, description: `${E2E_PREFIX} searchable`, status: 'К выполнению' })
  await createTask(request, { title: other, status: 'К выполнению' })

  await page.goto('/')
  await page.getByLabel('Поиск').fill(`target ${suffix}`)
  await applyFilters(page)

  await expect(page.getByRole('heading', { name: target })).toBeVisible()
  await expect(page.getByRole('heading', { name: other })).toHaveCount(0)
})

test('shows backend error state', async ({ page }) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window)
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input)
      if (url.includes('/api/tasks')) {
        return new Response(JSON.stringify({ code: 'api_unavailable', detail: 'Backend недоступен' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return originalFetch(input, init)
    }
  })

  await page.goto('/')

  await expect(page.getByText('Ошибка')).toBeVisible()
  await expect(page.getByText('Backend недоступен')).toBeVisible()
})
