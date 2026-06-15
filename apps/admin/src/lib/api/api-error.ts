export type AdminApiErrorCode =
  | "contract-error"
  | "invalid-request"
  | "network-error"
  | "not-found"
  | "unauthorized"

export type AdminApiError = {
  readonly code: AdminApiErrorCode
  readonly message: string
  readonly status?: number
}

const serverCodeMap = {
  invalid_request: "invalid-request",
  not_found: "not-found",
  unauthorized: "unauthorized",
} as const satisfies Record<string, AdminApiErrorCode>

const messageByCode = {
  "contract-error": "API 응답을 해석할 수 없습니다.",
  "invalid-request": "요청 내용을 확인해 주세요.",
  "network-error": "네트워크 연결을 확인해 주세요.",
  "not-found": "요청한 항목을 찾을 수 없습니다.",
  unauthorized: "관리자 로그인이 필요합니다.",
} as const satisfies Record<AdminApiErrorCode, string>

export function toAdminApiError(status: number, body: unknown): AdminApiError {
  const serverCode = readServerErrorCode(body)

  if (serverCode === null) {
    return {
      code: "contract-error",
      message: messageByCode["contract-error"],
      status,
    }
  }

  return {
    code: serverCode,
    message: messageByCode[serverCode],
    status,
  }
}

export function networkAdminApiError(): AdminApiError {
  return {
    code: "network-error",
    message: messageByCode["network-error"],
  }
}

export function contractAdminApiError(status?: number): AdminApiError {
  return {
    code: "contract-error",
    message: messageByCode["contract-error"],
    status,
  }
}

function readServerErrorCode(body: unknown): AdminApiErrorCode | null {
  if (
    typeof body !== "object" ||
    body === null ||
    !("error" in body) ||
    typeof body.error !== "object" ||
    body.error === null ||
    !("code" in body.error) ||
    typeof body.error.code !== "string"
  ) {
    return null
  }

  if (!isServerErrorCode(body.error.code)) {
    return null
  }

  return serverCodeMap[body.error.code]
}

function isServerErrorCode(code: string): code is keyof typeof serverCodeMap {
  return code in serverCodeMap
}
