let loading: Promise<OmiseClient> | null = null

// Load the card SDK only for tokenization, sharing concurrent requests and allowing retries.
export function loadOmise(): Promise<OmiseClient> {
  if (window.Omise) return Promise.resolve(window.Omise)
  if (loading) return loading

  loading = new Promise<OmiseClient>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.omise.co/omise.js'
    script.async = true

    function cleanup() {
      clearTimeout(timeout)
      script.onload = null
      script.onerror = null
    }
    function fail(message: string) {
      cleanup()
      script.remove()
      reject(new Error(message))
    }
    const timeout = setTimeout(
      () => fail('Secure card form took too long to load. Please try again.'),
      30_000,
    )
    script.onload = () => {
      if (!window.Omise) {
        fail('Secure card form could not be loaded. Please try again.')
        return
      }
      cleanup()
      resolve(window.Omise)
    }
    script.onerror = () => fail('Secure card form could not be loaded. Please try again.')
    document.head.appendChild(script)
  }).catch((error: unknown) => {
    loading = null
    throw error
  })

  return loading
}
