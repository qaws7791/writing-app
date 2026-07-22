import type { InfrastructureError } from "#errors/infrastructure-error"
import type { TransportError } from "#errors/transport-error"

declare const infrastructureError: InfrastructureError
declare const transportError: TransportError

// @ts-expect-error 공통 오류는 immutable value다.
infrastructureError.kind = "operation-failed"
// @ts-expect-error transport 오류는 raw cause를 공개하지 않는다.
void transportError.cause
// @ts-expect-error module domain 오류는 공통 vocabulary가 아니다.
const domainError: InfrastructureError = { kind: "lesson-not-found" }
void domainError
