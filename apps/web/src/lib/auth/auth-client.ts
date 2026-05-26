export type AuthMode = "login" | "signup"

export type AuthFetch = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>

export type EmailAuthResult =
  | {
      status: "ok"
    }
  | {
      message: string
      status: "error"
    }

export interface RequestEmailAuthInput {
  baseUrl: string
  email: string
  fetch?: AuthFetch
  mode: AuthMode
  name?: string
  password: string
}

export async function requestEmailAuth({
  baseUrl,
  email,
  fetch = globalThis.fetch,
  mode,
  name,
  password,
}: RequestEmailAuthInput): Promise<EmailAuthResult> {
  const response = await fetch(getEmailAuthUrl(baseUrl, mode), {
    body: JSON.stringify(getEmailAuthBody({ email, mode, name, password })),
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  })

  if (response.ok) {
    return { status: "ok" }
  }

  return {
    status: "error",
    message: await getAuthErrorMessage(response),
  }
}

function getEmailAuthUrl(baseUrl: string, mode: AuthMode) {
  const path =
    mode === "login" ? "/api/auth/sign-in/email" : "/api/auth/sign-up/email"

  return `${baseUrl.replace(/\/$/, "")}${path}`
}

function getEmailAuthBody({
  email,
  mode,
  name,
  password,
}: Pick<RequestEmailAuthInput, "email" | "mode" | "name" | "password">) {
  if (mode === "signup") {
    return {
      email,
      name: name ?? "",
      password,
    }
  }

  return {
    email,
    password,
  }
}

async function getAuthErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { message?: unknown }

    if (typeof body.message === "string" && body.message.length > 0) {
      return body.message
    }
  } catch {
    return "인증 요청에 실패했습니다."
  }

  return "인증 요청에 실패했습니다."
}
