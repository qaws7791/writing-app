export const privateNoStoreCacheControl = "private, no-store"

export function withPrivateNoStore(response: Response): Response {
  const headers = new Headers(response.headers)
  headers.set("Cache-Control", privateNoStoreCacheControl)
  appendVaryCookie(headers)

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  })
}

function appendVaryCookie(headers: Headers): void {
  const vary = headers.get("Vary")
  const values = new Set(
    vary
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? []
  )
  values.add("Cookie")
  headers.set("Vary", [...values].join(", "))
}
