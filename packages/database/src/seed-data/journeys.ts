import type { JourneyCategory } from "../schema/journeys"
import type { StepType } from "../schema/steps"

export type SeedJourney = {
  title: string
  description: string
  category: JourneyCategory
  thumbnailUrl: string | null
  sessions: SeedSession[]
}

type SeedSession = {
  order: number
  title: string
  description: string
  estimatedMinutes: number
  steps: SeedStep[]
}

type SeedStep = {
  order: number
  type: StepType
  contentJson: unknown
}

type JsonStep = {
  id: string
  type: string
  order: number
  content: Record<string, unknown>
  cta: { label: string; variant: string }
}

const CATEGORY_MAP: Record<string, JourneyCategory> = {
  글쓰기기초: "writing_skill",
  에세이구조와논리: "writing_skill",
  감각과묘사: "writing_skill",
  자기탐구와회고: "mindfulness",
  비판적사고와논증: "writing_skill",
  직무와실용글쓰기: "practical",
  입시와학술글쓰기: "practical",
  창작과스토리텔링: "writing_skill",
  마음챙김과감정글쓰기: "mindfulness",
  퍼블리싱과독자소통: "writing_skill",
}

const TYPE_MAP: Record<string, StepType> = {
  INTRO: "learn",
  COMPLETION: "learn",
  CONCEPT: "learn",
  EXAMPLE: "read",
  MULTIPLE_CHOICE: "guided_question",
  FILL_IN_THE_BLANK: "guided_question",
  ORDERING: "guided_question",
  HIGHLIGHT: "guided_question",
  SHORT_ANSWER: "write",
  WRITING: "write",
  REWRITING: "revise",
  AI_FEEDBACK: "feedback",
  AI_COMPARISON: "feedback",
}

function picsumUrl(seed: string): string {
  return `https://picsum.photos/seed/${seed}/600/400`
}

function normalizeKey(s: string): string {
  return s.replace(/\s+/g, "")
}

function resolveTargetId(oldId: string, steps: JsonStep[]): string | undefined {
  const found = steps.find((s) => s.id === oldId)
  return found ? found.order.toString() : undefined
}

function transformContent(
  content: Record<string, unknown>,
  steps: JsonStep[]
): Record<string, unknown> {
  const result = { ...content }

  if (typeof result.targetStepId === "string") {
    result.targetStepId =
      resolveTargetId(result.targetStepId, steps) ?? result.targetStepId
  }
  if (typeof result.originalWritingStepId === "string") {
    result.originalWritingStepId =
      resolveTargetId(result.originalWritingStepId, steps) ??
      result.originalWritingStepId
  }
  if (typeof result.feedbackStepId === "string") {
    result.feedbackStepId =
      resolveTargetId(result.feedbackStepId, steps) ?? result.feedbackStepId
  }
  if (typeof result.originalStepId === "string") {
    result.originalStepId =
      resolveTargetId(result.originalStepId, steps) ?? result.originalStepId
  }
  if (typeof result.rewritingStepId === "string") {
    result.rewritingStepId =
      resolveTargetId(result.rewritingStepId, steps) ?? result.rewritingStepId
  }
  return result
}

function getEstimatedMinutes(steps: JsonStep[]): number {
  for (const step of steps) {
    if (step.type === "INTRO") {
      const minutes = (step.content as { estimatedMinutes?: number })
        .estimatedMinutes
      if (typeof minutes === "number") return minutes
    }
  }
  return 15
}

type RawJsonJourney = {
  id: string
  category: string
  title: string
  description: string
  sessions: {
    id: string
    order: number
    title: string
    description: string
    steps: JsonStep[]
  }[]
}

export function seedJourneys(rawJourneys: RawJsonJourney[]): SeedJourney[] {
  return rawJourneys.map((journey, i) => {
    const categoryKey = normalizeKey(journey.category)
    const category: JourneyCategory =
      CATEGORY_MAP[categoryKey] ?? "writing_skill"

    return {
      title: journey.title,
      description: journey.description,
      category,
      thumbnailUrl: picsumUrl(`journey-${i + 1}`),
      sessions: journey.sessions.map((session): SeedSession => {
        const sessionSteps = session.steps ?? []
        const estimatedMinutes = getEstimatedMinutes(sessionSteps)

        return {
          order: session.order,
          title: session.title,
          description: session.description,
          estimatedMinutes,
          steps: sessionSteps.map((step): SeedStep => {
            const dbType: StepType = TYPE_MAP[step.type] ?? "learn"
            const transformedContent = transformContent(
              step.content,
              sessionSteps
            )

            return {
              order: step.order,
              type: dbType,
              contentJson: {
                type: step.type,
                content: transformedContent,
                cta: step.cta,
              },
            }
          }),
        }
      }),
    }
  })
}
