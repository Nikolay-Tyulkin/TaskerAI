type ApiErrorPayload = {
  code?: string
  detail?: string
}

export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, detail: string) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    let payload: ApiErrorPayload = {}
    try {
      payload = await response.json()
    } catch {
      payload = {}
    }
    throw new ApiError(response.status, payload.code ?? 'api_error', payload.detail ?? 'Ошибка API')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
