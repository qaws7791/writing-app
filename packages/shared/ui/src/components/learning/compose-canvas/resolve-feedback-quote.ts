import type { ComposeFeedbackMark } from "./plugins/feedback-marks-plugin"

export function resolveComposeFeedbackQuote(input: {
  readonly body: string
  readonly location: string
  readonly quote?: string
}): string | null {
  if (
    input.quote !== undefined &&
    isUsableQuote(input.quote) &&
    input.body.includes(input.quote)
  ) {
    return input.quote
  }
  if (isUsableQuote(input.location) && input.body.includes(input.location)) {
    return input.location
  }
  return null
}

export function toComposeFeedbackMarks(input: {
  readonly body: string
  readonly dismissedIds?: ReadonlySet<string>
  readonly revisions: readonly Readonly<{
    example: string
    location: string
    quote?: string
    reason: string
  }>[]
}): ComposeFeedbackMark[] {
  const dismissedIds = input.dismissedIds ?? new Set<string>()
  const marks: ComposeFeedbackMark[] = []
  for (const [index, revision] of input.revisions.entries()) {
    const id = `revision-${index}`
    if (dismissedIds.has(id)) {
      continue
    }
    const quote = resolveComposeFeedbackQuote({
      body: input.body,
      location: revision.location,
      ...(revision.quote === undefined ? {} : { quote: revision.quote }),
    })
    if (quote === null) {
      continue
    }
    marks.push({
      example: revision.example,
      id,
      quote,
      reason: revision.reason,
      title: revision.location,
    })
  }
  return marks
}

function isUsableQuote(value: string): boolean {
  return value.length > 0 && !value.includes("\n")
}
