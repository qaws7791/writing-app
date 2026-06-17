export type BearerSessionResolver<TSession> = {
  readonly resolveSession: (token: string) => Promise<TSession | null>
}

export type BearerSessionResult<TSession> =
  | {
      readonly kind: "ok"
      readonly session: TSession
    }
  | {
      readonly code: "unauthorized"
      readonly kind: "err"
      readonly status: 401
    }

export type BearerTokenParseResult =
  | {
      readonly kind: "ok"
      readonly token: string
    }
  | {
      readonly kind: "err"
      readonly reason: "invalid-format" | "invalid-scheme" | "missing"
    }

const bearerTokenPattern = /^Bearer\s+([^\s]+)$/i

export function parseBearerToken(
  authorizationHeader: string | null
): BearerTokenParseResult {
  if (authorizationHeader === null) {
    return {
      kind: "err",
      reason: "missing",
    }
  }

  const scheme = authorizationHeader.match(/^([^\s]+)/)?.[1]

  if (scheme?.toLowerCase() !== "bearer") {
    return {
      kind: "err",
      reason: "invalid-scheme",
    }
  }

  const token = authorizationHeader.match(bearerTokenPattern)?.[1]

  if (token === undefined) {
    return {
      kind: "err",
      reason: "invalid-format",
    }
  }

  return {
    kind: "ok",
    token,
  }
}

export function readBearerToken(
  authorizationHeader: string | null
): string | null {
  const result = parseBearerToken(authorizationHeader)

  return result.kind === "ok" ? result.token : null
}

export async function resolveBearerSession<TSession>({
  authorizationHeader,
  sessionResolver,
}: {
  readonly authorizationHeader: string | null
  readonly sessionResolver: BearerSessionResolver<TSession>
}): Promise<BearerSessionResult<TSession>> {
  const token = readBearerToken(authorizationHeader)

  if (token === null) {
    return {
      code: "unauthorized",
      kind: "err",
      status: 401,
    }
  }

  const session = await sessionResolver.resolveSession(token)

  if (session === null) {
    return {
      code: "unauthorized",
      kind: "err",
      status: 401,
    }
  }

  return {
    kind: "ok",
    session,
  }
}
