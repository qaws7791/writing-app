export function LessonAnswerErrorMessage({
  answerError,
}: {
  readonly answerError?: null | string
}) {
  if (answerError === undefined || answerError === null) {
    return null
  }

  return (
    <p className="rounded-lg border border-danger-fg/30 bg-danger/15 px-4 py-3 text-sm text-danger-foreground">
      {answerError}
    </p>
  )
}
