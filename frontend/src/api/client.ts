import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_REQUEST_TIMEOUT_MS } from './requestPolicy'
import { getSessionToken } from './sessionToken'
import { invalidatePublicReadCache } from './publicReadCache'

const client = axios.create({
  baseURL: '/api',
  timeout: API_REQUEST_TIMEOUT_MS,
})

// Axios' transport timeout is complemented by an abort deadline covering session
// lookup and connection setup as well. Always release timers/listeners on completion.
const deadlines = new WeakMap<
  InternalAxiosRequestConfig,
  { expired: boolean; cleanup: () => void }
>()

client.interceptors.request.use(async (config) => {
  const controller = new AbortController()
  const callerSignal = config.signal
  const onAbort = () => controller.abort()
  const deadline = {
    expired: false,
    cleanup: () => {
      clearTimeout(timer)
      callerSignal?.removeEventListener?.('abort', onAbort)
    },
  }
  const timer = setTimeout(() => {
    deadline.expired = true
    controller.abort()
  }, config.timeout || API_REQUEST_TIMEOUT_MS)
  if (callerSignal?.aborted) controller.abort()
  else callerSignal?.addEventListener?.('abort', onAbort, { once: true })
  config.signal = controller.signal
  deadlines.set(config, deadline)
  try {
    const token = await getSessionToken(controller.signal)
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  } catch (error) {
    throw AxiosError.from(error, axios.isAxiosError(error) ? error.code : undefined, config)
  }
})

client.interceptors.response.use(
  (response) => {
    deadlines.get(response.config)?.cleanup()
    deadlines.delete(response.config)
    const method = response.config.method?.toLowerCase() ?? 'get'
    if (
      !['get', 'head', 'options'].includes(method) &&
      /^\/admin\/(courses|lessons)(\/|$)/.test(response.config.url ?? '')
    ) {
      invalidatePublicReadCache()
    }
    return response
  },
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const deadline = error.config && deadlines.get(error.config)
      const failure = deadline?.expired
        ? new AxiosError(
            'Request timed out',
            'ECONNABORTED',
            error.config,
            error.request,
            error.response,
          )
        : error
      deadline?.cleanup()
      if (error.config) deadlines.delete(error.config)
      failure.message = toApiError(failure).message
      return Promise.reject(failure)
    }
    return Promise.reject(error)
  },
)

export interface ApiError {
  message: string
  fieldErrors?: Record<string, string>
}

export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      const reading = ['get', 'head'].includes(error.config?.method?.toLowerCase() ?? 'get')
      return {
        message: reading
          ? 'Loading took too long. Please try again.'
          : 'The request timed out. It may still be processing. Check the latest status before trying again.',
      }
    }
    if (error.code === 'ERR_CANCELED') return { message: 'Request canceled.' }
    if (error.code === 'ERR_NETWORK')
      return { message: 'Unable to connect to the server. Check your connection and try again.' }
    const data = error.response?.data as (Partial<ApiError> & { detail?: string }) | undefined
    if (data && typeof data === 'object' && (data.message || data.detail || data.fieldErrors)) {
      return {
        message: data.detail || data.message || error.message,
        fieldErrors: data.fieldErrors,
      }
    }
    if (error.response?.status === 401) return { message: 'Please sign in to continue.' }
    if (error.response?.status === 403) return { message: 'You do not have permission to do this.' }
    if ([502, 503, 504].includes(error.response?.status ?? 0))
      return { message: 'The server is temporarily unavailable. Please try again shortly.' }
  }
  return { message: error instanceof Error ? error.message : 'Unknown error' }
}

export default client
