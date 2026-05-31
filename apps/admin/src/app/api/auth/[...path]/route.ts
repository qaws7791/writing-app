import { proxyAuthRequest } from "@workspace/auth-proxy"

import { getAdminWebEnv } from "@/env"

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
  const env = getAdminWebEnv()

  return proxyAuthRequest({
    apiBaseUrl: env.adminApiBaseUrl,
    path,
    request,
  })
}
