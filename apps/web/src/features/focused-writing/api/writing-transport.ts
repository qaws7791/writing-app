import { saveWriting } from "@workspace/http-client/learner"

import type {
  LearnerSaveWritingBodyDto,
  LearnerSaveWritingResultDto,
} from "@/shared/http/learner-api-client"

const keepaliveBodyLimitBytes = 65_536

export type WritingSaveTransport =
  | { readonly kind: "default"; readonly signal: AbortSignal }
  | { readonly kind: "unload" }

export function saveWritingDraft({
  body,
  transport,
  writingId,
}: {
  readonly body: LearnerSaveWritingBodyDto
  readonly transport: WritingSaveTransport
  readonly writingId: string
}): Promise<LearnerSaveWritingResultDto> {
  return saveWriting(
    writingId,
    body,
    transport.kind === "default"
      ? { signal: transport.signal }
      : createUnloadRequestOptions(body)
  )
}

function createUnloadRequestOptions(
  body: LearnerSaveWritingBodyDto
): RequestInit {
  return survivesUnload(body) ? { keepalive: true } : {}
}

function survivesUnload(body: LearnerSaveWritingBodyDto): boolean {
  return (
    new TextEncoder().encode(JSON.stringify(body)).length <=
    keepaliveBodyLimitBytes
  )
}
