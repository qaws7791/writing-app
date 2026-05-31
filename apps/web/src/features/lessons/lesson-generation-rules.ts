import type { LessonStep } from "@/features/lessons/lesson-types"

export const LESSON_BOUNDARY_STEP_COUNT = 3
export const FIRST_MIDDLE_STEP_ORDER = 2
export const SUMMARY_STEP_OFFSET_FROM_END = 1

export const LESSON_STEP_DEFAULT_POINTS = {
  INTRO: 10,
  CONCEPT: 10,
  READING_PASSAGE: 10,
  EXAMPLE_REVEAL: 10,
  COMPARE: 10,
  MULTIPLE_CHOICE: 10,
  FILL_BLANK: 10,
  WORD_SELECT: 10,
  REORDER: 10,
  MATCH: 10,
  CLASSIFY: 10,
  SHORT_WRITE: 15,
  LONG_WRITE: 25,
  AI_FEEDBACK: 5,
  REVISION: 15,
  CHECKLIST: 10,
  REFLECTION: 10,
  SUMMARY: 10,
  TRANSCRIBE: 10,
  COMPLETE: 0,
} satisfies Record<LessonStep["type"], number>

export const OPTIONAL_REFLECTION_POINTS = 5

export const SHORT_WRITE_LENGTH_LIMIT = {
  minChars: 20,
  maxChars: 220,
} as const

export const LONG_WRITE_LENGTH_LIMIT = {
  minChars: 80,
  targetChars: 150,
  maxChars: 360,
} as const

export const REFLECTION_LENGTH_LIMIT = {
  minChars: 20,
} as const

export const CHECKLIST_MINIMUM_REQUIRED_CHECKS = 2

export const AI_FEEDBACK_SCORE_RANGE = [0, 100] as const
export const AI_FEEDBACK_MAX_REVISIONS = 2

export const EXTENDED_LESSON_ESTIMATE = {
  patterns: ["essay", "creative", "business"],
  minimumMinutes: 12,
  extraMinutes: 4,
} as const

export const MEDIUM_LESSON_ESTIMATE = {
  patterns: ["expression", "emotion"],
  minimumMinutes: 10,
  extraMinutes: 2,
} as const

export const DEFAULT_LESSON_ESTIMATE = {
  minimumMinutes: 8,
  extraMinutes: 0,
} as const
