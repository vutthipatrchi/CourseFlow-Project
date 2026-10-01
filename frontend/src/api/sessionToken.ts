import { getToken } from '@clerk/vue'
import { AxiosError, CanceledError } from 'axios'
import { AUTH_TOKEN_TIMEOUT_MS } from './requestPolicy'

export async function getSessionToken(signal: AbortSignal): Promise<string | null> {
  let timer: ReturnType<typeof setTimeout> | undefined
  let onAbort: () => void = () => {}
  try {
    const deadline = new Promise<never>((_, reject) => {
      onAbort = () => reject(new CanceledError('Request canceled'))
      if (signal.aborted) {
        onAbort()
        return
      }
      signal.addEventListener('abort', onAbort, { once: true })
      timer = setTimeout(
        () =>
          reject(
            new AxiosError('Your session took too long to load. Please try again.', 'AUTH_TIMEOUT'),
          ),
        AUTH_TOKEN_TIMEOUT_MS,
      )
    })
    return await Promise.race([
      deadline,
      Promise.resolve().then(() => {
        if (signal.aborted) throw new CanceledError('Request canceled')
        return getToken()
      }),
    ])
  } finally {
    clearTimeout(timer)
    signal.removeEventListener('abort', onAbort)
  }
}
