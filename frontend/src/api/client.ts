import { getToken } from '@clerk/vue'
import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

client.interceptors.request.use(async (config) => {
  const token = await getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

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
