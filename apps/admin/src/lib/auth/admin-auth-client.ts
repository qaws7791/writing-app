export type AdminAuthFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>

export type AdminEmailAuthResult =
  | {
      status: "ok"
    }
  | {
      message: string
      status: "error"
    }

export interface RequestAdminEmailAuthInput {
  baseUrl?: string
  email: string
  fetch?: AdminAuthFetch
  password: string
}

const adminLoginErrorMessage = "관리자 로그인에 실패했습니다."

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
  } catch {
    return {
      status: "error",
      message: adminLoginErrorMessage,
    }
  }

  return {
    status: "error",
    message: adminLoginErrorMessage,
  }
}

function getAdminEmailAuthUrl(baseUrl: string | undefined) {
  return `${normalizeBaseUrl(baseUrl)}/api/auth/sign-in/email`
}

function normalizeBaseUrl(baseUrl = "") {
  return baseUrl.replace(/\/$/, "")
}
