import {
  learnerApiErrorSchema,
  type LearnerApiError,
} from "@workspace/contracts/learning/api-error"
import type { HttpNetworkError } from "@workspace/http-client/json-transport"

export type ApiError = ContractApiError | NetworkApiError | ServerApiError

type ServerApiError = LearnerApiError & {
  readonly status: number
}

export type ContractApiError = {
  readonly code: "CONTRACT_ERROR"
  readonly message: string
  readonly status?: number
}

export type NetworkApiError = {
  readonly code: "NETWORK_ERROR"
  readonly message: string
  readonly network: HttpNetworkError
}

const localErrorMessage = {
  CONTRACT_ERROR: "API 응답을 해석할 수 없습니다.",
  NETWORK_ERROR: "네트워크 연결을 확인해 주세요.",
} as const

export function toApiError(status: number, body: unknown): ApiError {
  const parsedError = learnerApiErrorSchema.safeParse(body)

  if (!parsedError.success) {
    return contractApiError(status)
  }

  return {
    ...parsedError.data,
    status,
  }
}

export function networkApiError(network: HttpNetworkError): NetworkApiError {
  return {
    code: "NETWORK_ERROR",
    message: localErrorMessage.NETWORK_ERROR,
    network,
  }
}

export function contractApiError(status?: number): ContractApiError {
  return {
    code: "CONTRACT_ERROR",
    message: localErrorMessage.CONTRACT_ERROR,
    ...(status === undefined ? {} : { status }),
  }
}
