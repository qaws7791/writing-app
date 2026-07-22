import type { HttpNetworkError } from "@workspace/http-client/json-transport"
import { adminApiErrorSchema } from "@workspace/contracts/operations/admin-api-error"

type AdminApiErrorCode =
  | "contract-error"
  | "forbidden"
  | "invalid-request"
  | "move-cycle"
  | "name-conflict"
  | "network-error"
  | "not-found"
  | "position-conflict"
  | "stale-revision"
  | "unauthorized"

export type AdminApiError =
  | AdminNetworkApiError
  | {
      readonly code: Exclude<AdminApiErrorCode, "network-error">
      readonly message: string
      readonly status?: number
    }

type AdminNetworkApiError = {
  readonly code: "network-error"
  readonly message: string
  readonly network: HttpNetworkError
}

type ServerAdminApiErrorCode = Exclude<AdminApiErrorCode, "network-error">

const serverCodeMap = {
  FORBIDDEN: "forbidden",
  HTTP_EXCEPTION: "invalid-request",
  INVALID_REQUEST: "invalid-request",
  NOT_FOUND: "not-found",
  RESOURCE_MOVE_CYCLE: "move-cycle",
  RESOURCE_NAME_CONFLICT: "name-conflict",
  RESOURCE_POSITION_CONFLICT: "position-conflict",
  STALE_REVISION: "stale-revision",
  UNAUTHORIZED: "unauthorized",
  VALIDATION_FAILED: "invalid-request",
} as const satisfies Record<string, ServerAdminApiErrorCode>

const messageByCode = {
  "contract-error": "API 응답을 해석할 수 없습니다.",
  forbidden: "관리자 권한이 필요합니다.",
  "invalid-request": "요청 내용을 확인해 주세요.",
  "move-cycle": "폴더를 자신의 하위 경로로 이동할 수 없습니다.",
  "name-conflict": "같은 위치에 동일한 이름이 있습니다.",
  "network-error": "네트워크 연결을 확인해 주세요.",
  "not-found": "요청한 항목을 찾을 수 없습니다.",
  "position-conflict": "이동할 위치를 다시 확인해 주세요.",
  "stale-revision": "다른 사용자의 변경 사항을 다시 불러옵니다.",
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

export function networkAdminApiError(network: HttpNetworkError): AdminApiError {
  return {
    code: "network-error",
    message: messageByCode["network-error"],
    network,
  }
}

export function contractAdminApiError(status?: number): AdminApiError {
  return {
    code: "contract-error",
    message: messageByCode["contract-error"],
    ...(status === undefined ? {} : { status }),
  }
}

export function isAdminAuthenticationError(error: AdminApiError): boolean {
  return error.code === "forbidden" || error.code === "unauthorized"
}

function readServerErrorCode(body: unknown): ServerAdminApiErrorCode | null {
  const parsed = adminApiErrorSchema.safeParse(body)

  if (!parsed.success || !isServerErrorCode(parsed.data.code)) {
    return null
  }

  return serverCodeMap[parsed.data.code]
}

function isServerErrorCode(code: string): code is keyof typeof serverCodeMap {
  return code in serverCodeMap
}
