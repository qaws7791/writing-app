export type NextSecurityHeader = {
  readonly key: string
  readonly value: string
}

export function createNextSecurityHeaders({
  connectSources = [],
  development = false,
  imageSources = [],
}: {
  readonly connectSources?: readonly string[]
  readonly development?: boolean
  readonly imageSources?: readonly string[]
} = {}): readonly NextSecurityHeader[] {
  const scriptSources = ["'self'", "'unsafe-inline'"]

  if (development) {
    scriptSources.push("'unsafe-eval'")
  }

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    `connect-src 'self' ${normalizeSources(connectSources).join(" ")} ${
      development ? "ws: wss:" : ""
    }`.trim(),
    "font-src 'self' data:",
    "form-action 'self'",
    "frame-ancestors 'none'",
    `img-src 'self' data: blob: ${normalizeSources(imageSources).join(" ")}`.trim(),
    "manifest-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "worker-src 'self' blob:",
  ]

  const headers: NextSecurityHeader[] = [
    {
      key: "Content-Security-Policy",
      value: directives.join("; "),
    },
    {
      key: "Permissions-Policy",
      value: "camera=(), geolocation=(), microphone=()",
    },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
  ]

  if (!development) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    })
  }

  return headers
}

function normalizeSources(sources: readonly string[]): readonly string[] {
  return [...new Set(sources.map((source) => new URL(source).origin))]
}
