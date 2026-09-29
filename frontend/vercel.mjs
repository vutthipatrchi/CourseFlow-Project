const backendOrigin = process.env.COURSEFLOW_BACKEND_ORIGIN?.trim()

const rewrites = []

if (backendOrigin) {
  const url = new URL(backendOrigin)
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  ) {
    throw new Error('COURSEFLOW_BACKEND_ORIGIN must be an HTTPS origin without a path')
  }

  rewrites.push({ source: '/api/:path*', destination: `${url.origin}/api/:path*` })
}

rewrites.push({ source: '/(.*)', destination: '/index.html' })

export const config = { rewrites }
