/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface OmiseTokenResponse {
  id?: string
  message?: string
}

interface OmiseClient {
  setPublicKey(publicKey: string): void
  createToken(
    type: 'card',
    card: {
      name: string
      number: string
      expiration_month: number
      expiration_year: number
      security_code: string
    },
    callback: (statusCode: number, response: OmiseTokenResponse) => void,
  ): void
}

interface Window {
  Omise?: OmiseClient
}
