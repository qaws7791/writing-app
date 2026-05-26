export type AuthProxyFetch = (request: Request) => Promise<Response>

export interface ProxyAuthRequestInput {
  apiBaseUrl: string
  fetch?: AuthProxyFetch
  path: readonly string[]
  request: Request
}

export async function proxyAuthRequest({
  apiBaseUrl,
  fetch = globalThis.fetch,
  path,
  request,
}: ProxyAuthRequestInput): Promise<Response> {
  const proxyRequest = new Request(
    getBackendAuthUrl(apiBaseUrl, path, request),
    {
      ...getRequestBodyInit(request),
      headers: getForwardedHeaders(request),
      method: request.method,
      redirect: "manual",
    }
  )

  return fetch(proxyRequest)
}

function getBackendAuthUrl(
  apiBaseUrl: string,
  path: readonly string[],
  request: Request
) {
  const incomingUrl = new URL(request.url)
  const encodedPath = path.map(encodeURIComponent).join("/")
  const backendUrl = new URL(
    `/api/auth/${encodedPath}`,
    `${normalizeBaseUrl(apiBaseUrl)}/`
  )
  backendUrl.search = incomingUrl.search

  return backendUrl
}

function getForwardedHeaders(request: Request) {
  const incomingUrl = new URL(request.url)
  const headers = new Headers(request.headers)

  headers.delete("host")
  headers.set("x-forwarded-host", incomingUrl.host)
  headers.set("x-forwarded-proto", incomingUrl.protocol.replace(/:$/, ""))

  return headers
}

function getRequestBodyInit(request: Request): RequestInit & {
  duplex?: "half"
} {
  if (request.method === "GET" || request.method === "HEAD") {
    return {}
  }

  return {
    body: request.body,
    duplex: "half",
  }
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "")
}
