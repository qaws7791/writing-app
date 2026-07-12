export type LessonStepType =
  | "AI_FEEDBACK"
  | "CATEGORIZE"
  | "COMPARE"
  | "FILL_BLANK"
  | "MATCH"
  | "MULTIPLE_CHOICE"
  | "ORDER"
  | "READING"
  | "SELECT"
  | "WRITE"

export type LessonStepBase = {
  readonly id: string
  readonly order: number
}

export type ReadingStep = LessonStepBase & {
  readonly body: string
  readonly guide: string
  readonly source?: string
  readonly title: string
  readonly type: "READING"
}

export type CompareStep = LessonStepBase & {
  readonly analysis: string
  readonly title: string
  readonly type: "COMPARE"
  readonly versions: readonly {
    readonly label: string
    readonly text: string
  }[]
}

export type MultipleChoiceStep = LessonStepBase & {
  readonly correct: string
  readonly explanation: string
  readonly options: readonly {
    readonly id: string
    readonly text: string
  }[]
  readonly question: string
  readonly type: "MULTIPLE_CHOICE"
  readonly wrong?: string
}

export type FillBlankStep = LessonStepBase & {
  readonly answer: readonly string[]
  readonly explanation: string
  readonly template: string
  readonly type: "FILL_BLANK"
  readonly words: readonly string[]
}

export type SelectStep = LessonStepBase & {
  readonly correct: readonly number[]
  readonly explanation: string
  readonly layout?: string
  readonly question: string
  readonly segments: readonly string[]
  readonly type: "SELECT"
}

export type OrderStep = LessonStepBase & {
  readonly correct: readonly string[]
  readonly explanation: string
  readonly items: readonly string[]
  readonly showNumbers?: boolean
  readonly title: string
  readonly type: "ORDER"
}

export type WriteStep = LessonStepBase & {
  readonly badge?: string
  readonly claim?: string
  readonly claimLabel?: string
  readonly context?: string
  readonly draft?: boolean
  readonly goal?: number
  readonly guide: string
  readonly max?: number
  readonly min: number
  readonly mode?: string
  readonly placeholder?: string
  readonly prompt?: string
  readonly reference?: string
  readonly sample?: string
  readonly structure?: string
  readonly title?: string
  readonly type: "WRITE"
}

export type AiFeedbackStep = LessonStepBase & {
  readonly allowRetry: boolean
  readonly feedback: string
  readonly focus: string
  readonly score: number
  readonly scoreMax: number
  readonly showScore: boolean
  readonly target: string
  readonly type: "AI_FEEDBACK"
}

export type MatchStep = LessonStepBase & {
  readonly explanation: string
  readonly guide: string
  readonly pairs: readonly {
    readonly left: string
    readonly right: string
  }[]
  readonly title: string
  readonly type: "MATCH"
}

export type CategorizeStep = LessonStepBase & {
  readonly categories: readonly {
    readonly id: string
    readonly label: string
  }[]
  readonly explanation: string
  readonly guide: string
  readonly items: readonly {
    readonly categoryId: string
    readonly id: string
    readonly text: string
  }[]
  readonly title: string
  readonly type: "CATEGORIZE"
}

export type LessonStep =
  | AiFeedbackStep
  | CategorizeStep
  | CompareStep
  | FillBlankStep
  | MatchStep
  | MultipleChoiceStep
  | OrderStep
  | ReadingStep
  | SelectStep
  | WriteStep

export type Lesson = {
  readonly category: string | null
  readonly courseId: string
  readonly description: string | null
  readonly estimatedMinutes: number
  readonly id: string
  readonly steps: readonly LessonStep[]
  readonly summary: readonly string[]
  readonly title: string
  readonly unitId: string
}
