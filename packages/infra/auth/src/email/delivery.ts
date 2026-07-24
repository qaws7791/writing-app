export type AuthEmailRecipient = Readonly<{
  email: string
  name: string
}>

export type AuthEmailDeliveryInput = Readonly<{
  callbackUrl: string
  recipient: AuthEmailRecipient
}>

export type AuthEmailDeliveryPort = Readonly<{
  deliverPasswordReset: (input: AuthEmailDeliveryInput) => Promise<void>
  deliverVerification: (input: AuthEmailDeliveryInput) => Promise<void>
}>

export type AuthEmailDeliveryFailureCode =
  | "configuration-invalid"
  | "invalid-callback-url"
  | "provider-rejected"
  | "timeout"
  | "unavailable"

export class AuthEmailDeliveryError extends Error {
  readonly code: AuthEmailDeliveryFailureCode

  constructor(code: AuthEmailDeliveryFailureCode) {
    super(`Auth email delivery failed: ${code}`)
    this.name = "AuthEmailDeliveryError"
    this.code = code
  }
}

export function isAuthEmailDeliveryError(
  error: unknown
): error is AuthEmailDeliveryError {
  return error instanceof AuthEmailDeliveryError
}

export function readAbsoluteHttpCallbackUrl(callbackUrl: string): URL {
  let parsedUrl: URL

  try {
    parsedUrl = new URL(callbackUrl)
  } catch {
    throw new AuthEmailDeliveryError("invalid-callback-url")
  }

  if (
    (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") ||
    parsedUrl.username !== "" ||
    parsedUrl.password !== ""
  ) {
    throw new AuthEmailDeliveryError("invalid-callback-url")
  }

  return parsedUrl
}
