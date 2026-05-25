export type RequestLogFieldsInput = {
  durationMs: number
  method: string
  path: string
  requestId: string
  status: number
}

export const createRequestLogFields = ({
  durationMs,
  method,
  path,
  requestId,
  status,
}: RequestLogFieldsInput): RequestLogFieldsInput => ({
  durationMs,
  method,
  path,
  requestId,
  status,
})
