export type LessonId = string & {
  readonly __brand: "lesson-id"
}

export type LessonStepId = string & {
  readonly __brand: "lesson-step-id"
}

export type LessonTone =
  | "primary"
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "neutral"

export interface Lesson {
  id: LessonId
  title: string
  categoryId: string
  courseId: string
  unitNumber: number
  nextLessonId?: LessonId
  steps: readonly LessonStep[]
}

interface BaseLessonStep<TType extends string, TContent> {
  id: LessonStepId
  type: TType
  order: number
  points: number
  required: boolean
  content: TContent
}

export interface IntroContent {
  title: string
  category: string
  tagTone: LessonTone
  bullets: readonly string[]
  estimatedMinutes: number
  totalSteps: number
  xpAvailable: number
}

export interface ConceptContent {
  subtitle: string
  body: string
  highlight?: {
    icon: string
    text: string
    tone: LessonTone
  }
  keyTerms?: readonly {
    term: string
    definition: string
  }[]
}

export interface ReadingPassageContent {
  instruction: string
  title: string
  source?: string
  text: string
  estimatedReadMinutes: number
  highlightEnabled: boolean
  focusQuestion?: string
}

export interface ExampleRevealContent {
  instruction: string
  bad?: {
    label: string
    text: string
  }
  good: {
    label: string
    text: string
  }
  analysis: string
  revealTrigger: "button"
}

export interface CompareContent {
  instruction: string
  versions: readonly {
    label: string
    text: string
    tone: LessonTone
  }[]
  analysis: string
  discussionQuestion?: string
}

export interface MultipleChoiceContent {
  context?: string
  question: string
  options: readonly ChoiceOption[]
  explanation: string
  allowMultiple: false
  shuffleOptions: boolean
}

export interface ChoiceOption {
  id: string
  text: string
  isCorrect: boolean
}

export interface FillBlankContent {
  instruction: string
  template: string
  blanks: readonly {
    id: string
    correctAnswers: readonly string[]
    hint?: string
  }[]
  inputMode: "word-bank"
  wordBank: readonly string[]
  explanation: string
  caseSensitive: boolean
}

export interface WordSelectContent {
  instruction: string
  markedText: string
  globalExplanation: string
  spanExplanations: Record<string, string>
}

export interface ReorderContent {
  instruction: string
  items: readonly {
    id: string
    text: string
    correctOrder: number
  }[]
  itemType: "sentence"
  explanation: string
  showNumberHint: boolean
}

export interface MatchContent {
  instruction: string
  pairs: readonly {
    id: string
    left: string
    right: string
  }[]
  shuffleRight: boolean
  displayMode: "tap-connect"
  explanation: string
}

export interface ClassifyContent {
  instruction: string
  categories: readonly {
    id: string
    label: string
    tone: LessonTone
  }[]
  items: readonly {
    id: string
    text: string
    correctCategoryId: string
  }[]
  globalExplanation: string
}

export interface ShortWriteContent {
  instruction: string
  prompt: string
  sourceText?: string
  maxChars: number
  minChars: number
  referenceAnswer: string
  aiEvaluationEnabled: boolean
  showReferenceAfterSubmit: boolean
}

export interface LongWriteContent {
  instruction: string
  topic: string
  context?: string
  structureGuide?: readonly string[]
  minChars: number
  targetChars: number
  maxChars: number
  aiEvaluationEnabled: boolean
  evaluationCriteria: string
  draftSaveEnabled: boolean
}

export interface AiFeedbackContent {
  sourceStepId: LessonStepId
  feedbackPrompt: string
  focusAreas: readonly ("clarity" | "expression")[]
  showScore: boolean
  scoreRange: readonly [number, number]
  allowRevision: boolean
  maxRevisions: number
}

export interface RevisionContent {
  instruction: string
  revisionTask: string
  originalText: string
  hints: readonly string[]
  revisionType: "targeted"
  referenceRevision: string
  aiEvaluationEnabled: boolean
  evaluationCriteria: string
}

export interface ChecklistContent {
  instruction: string
  items: readonly {
    id: string
    text: string
    required: boolean
    tip?: string
  }[]
  completionMode: "minimum" | "all" | "any"
  minimumChecks: number
  saveResponses: boolean
}

export interface ReflectionContent {
  question: string
  context?: string
  promptStarters: readonly string[]
  minChars: number
  saveToJournal: boolean
  category: string
  isSkippable: boolean
}

export interface SummaryContent {
  points: readonly {
    number: number
    text: string
    icon?: string
  }[]
  nextLesson?: {
    title: string
    description?: string
  }
  shareableQuote?: string
}

export interface TranscribeContent {
  instruction: string
  sourceText: string
  source?: string
  showMatchRate: boolean
  caseSensitive: boolean
  punctuationSensitive: boolean
  focusNote?: string
}

export interface CompleteContent {
  celebrationStyle: "confetti"
  xpEarned: number
  showStreak: boolean
  lessonStats: {
    correctRate?: number
    writingCount?: number
    aiFeedbackCount?: number
  }
  nextAction: "next-lesson"
}

export type LessonStep =
  | BaseLessonStep<"INTRO", IntroContent>
  | BaseLessonStep<"CONCEPT", ConceptContent>
  | BaseLessonStep<"READING_PASSAGE", ReadingPassageContent>
  | BaseLessonStep<"EXAMPLE_REVEAL", ExampleRevealContent>
  | BaseLessonStep<"COMPARE", CompareContent>
  | BaseLessonStep<"MULTIPLE_CHOICE", MultipleChoiceContent>
  | BaseLessonStep<"FILL_BLANK", FillBlankContent>
  | BaseLessonStep<"WORD_SELECT", WordSelectContent>
  | BaseLessonStep<"REORDER", ReorderContent>
  | BaseLessonStep<"MATCH", MatchContent>
  | BaseLessonStep<"CLASSIFY", ClassifyContent>
  | BaseLessonStep<"SHORT_WRITE", ShortWriteContent>
  | BaseLessonStep<"LONG_WRITE", LongWriteContent>
  | BaseLessonStep<"AI_FEEDBACK", AiFeedbackContent>
  | BaseLessonStep<"REVISION", RevisionContent>
  | BaseLessonStep<"CHECKLIST", ChecklistContent>
  | BaseLessonStep<"REFLECTION", ReflectionContent>
  | BaseLessonStep<"SUMMARY", SummaryContent>
  | BaseLessonStep<"TRANSCRIBE", TranscribeContent>
  | BaseLessonStep<"COMPLETE", CompleteContent>
