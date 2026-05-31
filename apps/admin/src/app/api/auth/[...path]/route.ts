import { proxyAuthRequest } from "@workspace/auth-proxy"

const defaultAdminApiBaseUrl = "http://localhost:4001"

type AdminAuthRouteContext = {
  params: Promise<{
    path: string[]
  }>
}

export async function GET(request: Request, context: AdminAuthRouteContext) {
  return proxyRequest(request, context)
}

export async function POST(request: Request, context: AdminAuthRouteContext) {
  return proxyRequest(request, context)
}

async function proxyRequest(request: Request, context: AdminAuthRouteContext) {
  const { path } = await context.params

  return proxyAuthRequest({
    apiBaseUrl: process.env["ADMIN_API_BASE_URL"] ?? defaultAdminApiBaseUrl,
    path,
    request,
  })
}
