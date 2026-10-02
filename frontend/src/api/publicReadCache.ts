// Only public catalog/config readers use this cache. Never store user access or payments.
export const PUBLIC_READ_TTL_MS = 60_000
const entries = new Map<string, { promise: Promise<unknown>; expiresAt: number }>()

export function invalidatePublicReadCache() {
  entries.clear()
}

export function cachedPublicRead<T>(key: string, read: () => Promise<T>): Promise<T> {
  let entry = entries.get(key)
  if (!entry || entry.expiresAt <= Date.now()) {
    const next = { promise: Promise.resolve() as Promise<unknown>, expiresAt: Infinity }
    next.promise = Promise.resolve()
      .then(read)
      .then(
        (data) => {
          next.expiresAt = Date.now() + PUBLIC_READ_TTL_MS
          return data
        },
        (error: unknown) => {
          if (entries.get(key) === next) entries.delete(key)
          throw error
        },
      )
    entries.set(key, next)
    entry = next
  }
  // Callers must not mutate another component's cached response.
  return entry.promise.then((data) => structuredClone(data as T))
}
