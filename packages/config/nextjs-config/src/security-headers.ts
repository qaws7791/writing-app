export type NextSecurityHeader = {
  readonly key: string
  readonly value: string
}

type ContentSecurityPolicyOptions = {
  readonly allowHttpsImages?: boolean
  readonly connectSources?: readonly string[]
  readonly development?: boolean
  readonly imageSources?: readonly string[]
  readonly nonce?: string
}

export function createNextSecurityHeaders({
  allowHttpsImages = false,
  connectSources = [],
  development = false,
  imageSources = [],
  includeContentSecurityPolicy = true,
  reportOnly = false,
}: {
  readonly allowHttpsImages?: boolean
  readonly connectSources?: readonly string[]
  readonly development?: boolean
  readonly imageSources?: readonly string[]
  readonly includeContentSecurityPolicy?: boolean
  readonly reportOnly?: boolean
} = {}): readonly NextSecurityHeader[] {
  const headers: NextSecurityHeader[] = []
  if (includeContentSecurityPolicy) {
    headers.push({
      key: reportOnly
        ? "Content-Security-Policy-Report-Only"
        : "Content-Security-Policy",
      value: createContentSecurityPolicy({
        allowHttpsImages,
        connectSources,
        development,
        imageSources,
      }),
    })
  }

  headers.push(
    {
      key: "Permissions-Policy",
      value: "camera=(), geolocation=(), microphone=()",
    },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" }
  )

  if (!development) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    })
  }

  return headers
}

export function createContentSecurityPolicy({
  allowHttpsImages = false,
  connectSources = [],
  development = false,
  imageSources = [],
  nonce,
}: ContentSecurityPolicyOptions = {}): string {
  const scriptSources = ["'self'"]
  if (nonce === undefined) {
    if (development) {
      scriptSources.push("'unsafe-inline'", "'unsafe-eval'")
    }
  } else {
    scriptSources.push(`'nonce-${nonce}'`, "'strict-dynamic'")
    if (development) {
      scriptSources.push("'unsafe-eval'")
    }
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
    `img-src 'self' data: blob: ${
      allowHttpsImages ? "https:" : ""
    } ${normalizeSources(imageSources).join(" ")}`.trim(),
    "manifest-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    `script-src ${scriptSources.join(" ")}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "worker-src 'self' blob:",
    "report-uri /api/csp-report",
  ]

  if (!development) {
    directives.push("upgrade-insecure-requests")
  }

  return directives.join("; ")
}

function normalizeSources(sources: readonly string[]): readonly string[] {
  return [...new Set(sources.map((source) => new URL(source).origin))]
}
