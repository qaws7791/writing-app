export type AdminAuthFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>

export type AdminEmailAuthResult =
  | {
      status: "ok"
    }
  | {
      kind: AdminEmailAuthErrorKind
      message: string
      status: "error"
    }

export type AdminEmailAuthErrorKind =
  | "invalid-credentials"
  | "network-error"
  | "rate-limited"
  | "server-unavailable"
  | "unknown"

export interface RequestAdminEmailAuthInput {
  baseUrl?: string
  email: string
  fetch?: AdminAuthFetch
  password: string
}

const adminLoginErrorMessages = {
  "invalid-credentials": "이메일 또는 비밀번호가 올바르지 않습니다.",
  "network-error": "네트워크 연결을 확인한 뒤 다시 시도해 주세요.",
  "rate-limited": "로그인 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  "server-unavailable": "관리자 인증 서버를 사용할 수 없습니다.",
  unknown: "관리자 로그인에 실패했습니다.",
} satisfies Record<AdminEmailAuthErrorKind, string>

export async function requestAdminEmailAuth({
  baseUrl,
  email,
  fetch = globalThis.fetch,
  password,
}: RequestAdminEmailAuthInput): Promise<AdminEmailAuthResult> {
  try {
    const response = await fetch(getAdminEmailAuthUrl(baseUrl), {
      body: JSON.stringify({
        email,
        password,
      }),
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    if (response.ok) {
      return { status: "ok" }
    }

    const errorBody = await readErrorBody(response)

    return adminEmailAuthError(getErrorKind(response.status, errorBody))
  } catch {
    return adminEmailAuthError("network-error")
  }
}

function adminEmailAuthError(kind: AdminEmailAuthErrorKind) {
  return {
    kind,
    message: adminLoginErrorMessages[kind],
    status: "error" as const,
  }
}

async function readErrorBody(response: Response): Promise<unknown> {
  try {
    return await response.clone().json()
  } catch {
    return null
  }
}

function getErrorKind(status: number, body: unknown): AdminEmailAuthErrorKind {
  const bodyCode = getBodyCode(body)

  if (
    bodyCode === "INVALID_CREDENTIALS" ||
    bodyCode === "INVALID_EMAIL_OR_PASSWORD" ||
    bodyCode === "UNAUTHORIZED"
  ) {
    return "invalid-credentials"
  }

  if (bodyCode === "RATE_LIMITED" || bodyCode === "TOO_MANY_REQUESTS") {
    return "rate-limited"
  }

  if (status === 401 || status === 403) {
    return "invalid-credentials"
  }

  if (status === 429) {
    return "rate-limited"
  }

  if (status >= 500) {
    return "server-unavailable"
  }

  return "unknown"
}

function getBodyCode(body: unknown) {
  if (
    typeof body === "object" &&
    body !== null &&
    "code" in body &&
    typeof body.code === "string"
  ) {
    return body.code
  }

  return undefined
}

function getAdminEmailAuthUrl(baseUrl: string | undefined) {
  return `${normalizeBaseUrl(baseUrl)}/api/auth/sign-in/email`
}

function normalizeBaseUrl(baseUrl = "") {
  return baseUrl.replace(/\/$/, "")
}
