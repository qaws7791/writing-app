import type {
  ChoiceOption,
  LessonStep,
  LessonTone,
} from "@/features/lessons/lesson-types"

export type ChoiceStatus = "neutral" | "selected" | "correct" | "incorrect"
export type ClassifyStatus = "neutral" | "correct" | "incorrect"
export type BlankStatus = "neutral" | "filled" | "correct" | "incorrect"

export type BlankAssignments = Record<string, string>
export type ClassifyAssignments = Record<string, string>
export type MatchConnections = Record<string, string>

export interface MarkdownSegment {
  id: string
  text: string
  emphasized: boolean
}

export interface MarkedTextPlainPart {
  id: string
  type: "text"
  content: string
}

export interface MarkedTextSpanPart {
  type: "span"
  content: string
  id: string
  isCorrect: boolean
}

export type MarkedTextPart = MarkedTextPlainPart | MarkedTextSpanPart

export interface ConfettiPiece {
  id: number
  tone: LessonTone
  left: string
  delay: string
  duration: string
  size: string
}

export function getLessonProgress(
  currentStepIndex: number,
  totalSteps: number
) {
  if (totalSteps === 0) {
    return 0
  }

  return (currentStepIndex / totalSteps) * 100
}

export function findStepIndexByType(
  steps: readonly LessonStep[],
  type: LessonStep["type"]
) {
  return steps.findIndex((step) => step.type === type)
}

export function getChoiceStatus(
  option: ChoiceOption,
  selectedId: string | null,
  confirmed: boolean
): ChoiceStatus {
  if (!confirmed) {
    return selectedId === option.id ? "selected" : "neutral"
  }

  if (option.isCorrect) {
    return "correct"
  }

  if (option.id === selectedId) {
    return "incorrect"
  }

  return "neutral"
}

export function isSelectedChoiceCorrect(
  options: readonly ChoiceOption[],
  selectedId: string | null
) {
  return Boolean(
    selectedId && options.find((option) => option.id === selectedId)?.isCorrect
  )
}

export function splitMarkdownEmphasis(text: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = []
  const regex = /\*\*(.*?)\*\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        id: `text-${lastIndex}`,
        text: text.slice(lastIndex, match.index),
        emphasized: false,
      })
    }

    segments.push({
      id: `strong-${match.index}`,
      text: match[1] ?? "",
      emphasized: true,
    })

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    segments.push({
      id: `text-${lastIndex}`,
      text: text.slice(lastIndex),
      emphasized: false,
    })
  }

  return segments
}

export function splitParagraphs(text: string) {
  return text.split(/\n+/).filter((line) => line.trim().length > 0)
}

export function parseMarkedText(markedText: string): MarkedTextPart[] {
  const parts: MarkedTextPart[] = []
  const regex = /\{\{([^:]+):([^:]+):(correct|incorrect)\}\}/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(markedText)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        id: `text-${lastIndex}`,
        type: "text",
        content: markedText.slice(lastIndex, match.index),
      })
    }

    parts.push({
      type: "span",
      content: match[1] ?? "",
      id: match[2] ?? "",
      isCorrect: match[3] === "correct",
    })

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < markedText.length) {
    parts.push({
      id: `text-${lastIndex}`,
      type: "text",
      content: markedText.slice(lastIndex),
    })
  }

  return parts
}

export function parseFillBlankTemplate(template: string) {
  let offset = 0

  return template.split(/(\{\{[^}]+\}\})/g).map((part) => {
    const key = `part-${offset}`
    offset += part.length

    const match = part.match(/\{\{([^}]+)\}\}/)

    if (!match) {
      return {
        key,
        type: "text" as const,
        content: part,
      }
    }

    return {
      key,
      type: "blank" as const,
      id: match[1] ?? "",
    }
  })
}

export function getBlankStatus({
  blankId,
  blankValue,
  correctAnswers,
  confirmed,
  caseSensitive,
}: {
  blankId: string
  blankValue: string | undefined
  correctAnswers: readonly string[]
  confirmed: boolean
  caseSensitive: boolean
}): BlankStatus {
  void blankId

  if (!blankValue) {
    return "neutral"
  }

  if (!confirmed) {
    return "filled"
  }

  const answer = caseSensitive ? blankValue : blankValue.toLowerCase()
  const correct = correctAnswers.some((correctAnswer) => {
    const normalizedCorrect = caseSensitive
      ? correctAnswer
      : correctAnswer.toLowerCase()

    return normalizedCorrect === answer
  })

  return correct ? "correct" : "incorrect"
}

export function getClassifyStatus({
  correctCategoryId,
  assignedCategoryId,
  confirmed,
}: {
  correctCategoryId: string
  assignedCategoryId: string | undefined
  confirmed: boolean
}): ClassifyStatus {
  if (!confirmed) {
    return "neutral"
  }

  return correctCategoryId === assignedCategoryId ? "correct" : "incorrect"
}

export function getChecklistComplete({
  checkedCount,
  totalCount,
  completionMode,
  minimumChecks,
}: {
  checkedCount: number
  totalCount: number
  completionMode: "minimum" | "all" | "any"
  minimumChecks: number
}) {
  if (completionMode === "all") {
    return checkedCount === totalCount
  }

  if (completionMode === "minimum") {
    return checkedCount >= minimumChecks
  }

  return checkedCount > 0
}

export function getMatchRate({
  sourceText,
  userText,
  caseSensitive,
  punctuationSensitive,
}: {
  sourceText: string
  userText: string
  caseSensitive: boolean
  punctuationSensitive: boolean
}) {
  const source = normalizeComparableText({
    text: sourceText,
    caseSensitive,
    punctuationSensitive,
  })
  const user = normalizeComparableText({
    text: userText,
    caseSensitive,
    punctuationSensitive,
  })

  if (!user) {
    return 0
  }

  let matches = 0
  const maxLength = Math.max(user.length, source.length)

  for (
    let index = 0;
    index < Math.min(user.length, source.length);
    index += 1
  ) {
    if (user[index] === source[index]) {
      matches += 1
    }
  }

  return Math.round((matches / maxLength) * 100)
}

export function getMockAiFeedback() {
  return {
    good: [
      "능동태로의 전환이 자연스럽습니다.",
      "주어와 서술어의 호응이 명확합니다.",
    ],
    improve: [
      '조금 더 간결하게 쓸 수 있어요. "이 제안을"이 이미 목적어이므로 "이"를 생략해도 됩니다.',
    ],
  }
}

export function getDeterministicOrder<TItem extends { id: string }>(
  items: readonly TItem[]
) {
  return [...items].sort((left, right) => {
    const leftHash = getStableHash(left.id)
    const rightHash = getStableHash(right.id)

    return leftHash - rightHash
  })
}

export function createConfettiPieces(count: number): readonly ConfettiPiece[] {
  const tones: readonly LessonTone[] = [
    "primary",
    "success",
    "info",
    "warning",
    "danger",
    "neutral",
  ]

  return Array.from({ length: count }, (_, index) => ({
    id: index,
    tone: tones[index % tones.length] ?? "primary",
    left: `${(index * 37) % 100}%`,
    delay: `${(index % 8) * 0.16}s`,
    duration: `${2 + (index % 5) * 0.28}s`,
    size: `${6 + (index % 4) * 2}px`,
  }))
}

function normalizeComparableText({
  text,
  caseSensitive,
  punctuationSensitive,
}: {
  text: string
  caseSensitive: boolean
  punctuationSensitive: boolean
}) {
  let normalized = caseSensitive ? text : text.toLowerCase()

  if (!punctuationSensitive) {
    normalized = normalized.replace(/[.,!?;:'"()[\]{}\-—]/g, "")
  }

  return normalized
}

function getStableHash(value: string) {
  return [...value].reduce(
    (current, character) => current + character.charCodeAt(0),
    0
  )
}
