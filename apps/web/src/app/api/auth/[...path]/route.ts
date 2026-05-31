import { proxyAuthRequest } from "@workspace/auth-proxy"

import { getWebEnv } from "@/env"

type AuthRouteContext = {
  params: Promise<{
    path: string[]
  }>
}

export async function GET(request: Request, context: AuthRouteContext) {
  return handleAuthRequest(request, context)
}

export async function POST(request: Request, context: AuthRouteContext) {
  return handleAuthRequest(request, context)
}

async function handleAuthRequest(
  request: Request,
  { params }: AuthRouteContext
) {
  const { path } = await params
  const env = getWebEnv()

  return proxyAuthRequest({
    apiBaseUrl: env.serverApiBaseUrl,
    path,
    request,
  })
}
