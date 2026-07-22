const MAX_CSP_REPORT_BYTES = 64 * 1024
const MAX_REPORT_VALUE_LENGTH = 2048

export type CspReportApplication = "admin" | "web"

export async function recordCspViolation(
  request: Request,
  application: CspReportApplication,
  writeLog: (value: string) => void = (value) =>
    process.stderr.write(`${value}\n`)
): Promise<Response> {
  const contentLength = Number(request.headers.get("content-length") ?? "0")
  if (contentLength > MAX_CSP_REPORT_BYTES) {
    return new Response(null, { status: 413 })
  }

  let body: unknown
  try {
    const text = await request.text()
    if (new TextEncoder().encode(text).byteLength > MAX_CSP_REPORT_BYTES) {
      return new Response(null, { status: 413 })
    }
    body = JSON.parse(text)
  } catch {
    return new Response(null, { status: 400 })
  }

  writeLog(
    JSON.stringify({
      application,
      event: "csp_violation",
      report: normalizeReport(body),
    })
  )

  return new Response(null, {
    headers: { "Cache-Control": "private, no-store" },
    status: 204,
  })
}

function normalizeReport(body: unknown) {
  const envelope = isObject(body) ? body : {}
  const raw = isObject(envelope["csp-report"])
    ? envelope["csp-report"]
    : envelope

  return {
    blockedUri: readString(raw["blocked-uri"]),
    disposition: readString(raw["disposition"]),
    documentUri: readString(raw["document-uri"]),
    effectiveDirective: readString(raw["effective-directive"]),
    lineNumber: readNumber(raw["line-number"]),
    sourceFile: readString(raw["source-file"]),
  }
}

function isObject(
  value: unknown
): value is { readonly [key: string]: unknown } {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readString(value: unknown): string | null {
  return typeof value === "string"
    ? value.slice(0, MAX_REPORT_VALUE_LENGTH)
    : null
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}
