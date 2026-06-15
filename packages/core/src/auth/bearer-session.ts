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

export function readBearerToken(
  authorizationHeader: string | null
): string | null {
  if (authorizationHeader === null) {
    return null
  }

  const [scheme, token] = authorizationHeader.split(" ")

  if (scheme !== "Bearer" || token === undefined || token.length === 0) {
    return null
  }

  return token
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
