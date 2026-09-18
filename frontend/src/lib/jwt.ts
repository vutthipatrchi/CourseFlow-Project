/**
 * Decodes a JWT's payload without verifying its signature. Safe for reading
 * claims client-side (the browser already trusts the token it just got back
 * from Clerk); the backend independently verifies the signature on every
 * request via the JWKS endpoint.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64)) as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * Reads the `role` claim from a Clerk session token. Requires the Clerk
 * Dashboard's session token customization to include the user's public
 * metadata, e.g. `{ "metadata": "{{user.public_metadata}}" }`.
 */
export function getRoleFromToken(token: string | null): string | null {
  if (!token) return null
  const payload = decodeJwtPayload(token)
  const metadata = payload?.metadata as { role?: string } | undefined
  return metadata?.role ?? null
}
