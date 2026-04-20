type AdminMutationRequest = {
  body?: unknown
  method: "DELETE" | "POST" | "PUT"
  url: string
}

type AdminMutationResult =
  | { ok: true }
  | {
      error: string
      ok: false
    }

type RouterLike = {
  push: (href: string) => void
  refresh: () => void
}

function formatAdminMutationError(payload: unknown, fallback: string): string {
  if (typeof payload === "string" && payload.length > 0) {
    return payload
  }

  if (payload && typeof payload === "object" && "error" in payload) {
    const error = payload.error
    if (typeof error === "string" && error.length > 0) {
      return error
    }
  }

  return fallback
}

export async function runAdminMutation({
  body,
  method,
  url,
}: AdminMutationRequest): Promise<AdminMutationResult> {
  const response = await fetch(url, {
    method,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (response.ok) {
    return { ok: true }
  }

  const payload = await response.json().catch(() => null)
  return {
    error: formatAdminMutationError(
      payload,
      `요청에 실패했습니다 (${response.status})`
    ),
    ok: false,
  }
}

export function finishAdminMutation(router: RouterLike, href: string) {
  router.push(href)
  router.refresh()
}
