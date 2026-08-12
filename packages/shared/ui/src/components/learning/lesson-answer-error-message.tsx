export function LessonAnswerErrorMessage({
  answerError,
}: {
  readonly answerError?: null | string
}) {
  if (answerError === undefined || answerError === null) {
    return null
  }

  return (
    <Insight role="alert" tone="incorrect">
      <InsightEyebrow>답안 오류</InsightEyebrow>
      <InsightDescription>{answerError}</InsightDescription>
    </Insight>
  )
}
import {
  Insight,
  InsightDescription,
  InsightEyebrow,
} from "#ui/components/learning/insight"
