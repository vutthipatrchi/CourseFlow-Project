import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// Clerk auth will attach a bearer token here via a request interceptor once
// authentication is added; no interceptor exists yet.

export interface ApiError {
  message: string
  fieldErrors?: Record<string, string>
}

export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as Partial<ApiError>
    return { message: data.message ?? error.message, fieldErrors: data.fieldErrors }
  }
  return { message: error instanceof Error ? error.message : 'Unknown error' }
}

export default client
