import { saveLearnerStepDraft } from "@workspace/http-client/learner"

import type {
  LearnerSaveStepDraftBodyDto,
  LearnerSaveStepDraftResultDto,
} from "@/shared/http/learner-api-client"

// 브라우저는 언로드 뒤 유지하는 keepalive 요청 본문 총량을 64KiB로 제한한다.
// 서버가 허용하는 초안 answer JSON 상한(learnerStepDraftAnswerJsonMaxBytes)과
// 같은 값이므로 상한에 가까운 초안은 언로드 생존 보장 밖에 있다.
const keepaliveBodyLimitBytes = 65_536

export type DraftSaveTransport =
  | { readonly kind: "default"; readonly signal: AbortSignal }
  | { readonly kind: "unload" }

export function saveStepDraft({
  body,
  lessonId,
  stepId,
  transport,
}: {
  readonly body: LearnerSaveStepDraftBodyDto
  readonly lessonId: string
  readonly stepId: string
  readonly transport: DraftSaveTransport
}): Promise<LearnerSaveStepDraftResultDto> {
  return saveLearnerStepDraft(
    lessonId,
    stepId,
    body,
    transport.kind === "default"
      ? { signal: transport.signal }
      : createUnloadRequestOptions(body)
  )
}

function createUnloadRequestOptions(
  body: LearnerSaveStepDraftBodyDto
): RequestInit {
  return survivesUnload(body) ? { keepalive: true } : {}
}

function survivesUnload(body: LearnerSaveStepDraftBodyDto): boolean {
  return (
    new TextEncoder().encode(JSON.stringify(body)).length <=
    keepaliveBodyLimitBytes
  )
}
