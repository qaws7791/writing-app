import { proxyAuthRequest } from "@workspace/auth-proxy"

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

  return proxyAuthRequest({
    apiBaseUrl: process.env["WEB_API_BASE_URL"] ?? "http://localhost:4000",
    path,
    request,
  })
}
