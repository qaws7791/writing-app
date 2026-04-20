import type { StepType } from "@workspace/core/modules/journeys"

export const stepTypeOptions: ReadonlyArray<{
  label: string
  value: StepType
}> = [
  { value: "INTRO", label: "인트로" },
  { value: "COMPLETION", label: "완료" },
  { value: "CONCEPT", label: "개념" },
  { value: "EXAMPLE", label: "예시" },
  { value: "MULTIPLE_CHOICE", label: "객관식" },
  { value: "FILL_IN_THE_BLANK", label: "빈칸 채우기" },
  { value: "ORDERING", label: "순서 배열" },
  { value: "HIGHLIGHT", label: "하이라이트" },
  { value: "SHORT_ANSWER", label: "단답형" },
  { value: "WRITING", label: "글쓰기" },
  { value: "REWRITING", label: "퇴고" },
  { value: "AI_FEEDBACK", label: "AI 피드백" },
  { value: "AI_COMPARISON", label: "AI 비교" },
]

export const stepTypeLabels = Object.fromEntries(
  stepTypeOptions.map(({ label, value }) => [value, label])
) as Readonly<Record<StepType, string>>

type StepContentJsonParseResult =
  | { ok: true; value: unknown }
  | { error: string; ok: false }

export function serializeStepContentJson(contentJson: unknown): string {
  return JSON.stringify(contentJson, null, 2)
}

export function parseStepContentJson(
  contentJson: string
): StepContentJsonParseResult {
  try {
    return {
      ok: true,
      value: JSON.parse(contentJson),
    }
  } catch {
    return {
      error: "contentJson이 올바른 JSON 형식이 아닙니다",
      ok: false,
    }
  }
}
