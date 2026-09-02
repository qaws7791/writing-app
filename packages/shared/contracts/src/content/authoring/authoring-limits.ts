/**
 * 집필 품질 계약의 숫자 상한·하한 원천.
 * 제품 문서: docs/product/authoring-guidelines.md
 */
export const authoringLimits = {
  categorizeCategoryCount: { max: 4, min: 2 },
  categorizeItemCount: { max: 8, min: 4 },
  compareAnalysis: { max: 40, min: 4 },
  compareVersionLabel: { max: 8, min: 1 },
  compareVersionMark: { max: 20, min: 1 },
  compareVersionText: { max: 60, min: 4 },
  explanation: { max: 40, min: 4 },
  fillBlankBlankCount: { max: 2, min: 1 },
  fillBlankWordPoolSize: { max: 6, min: 3 },
  lessonEstimatedMinutes: { default: 5, max: 10, min: 5 },
  lessonStepCount: { default: 12, max: 15, min: 8 },
  matchPairCount: { max: 5, min: 3 },
  maxSameStepTypePerLesson: 3,
  multipleChoiceCorrectIndexSkewRatio: 0.8,
  multipleChoiceOptionCount: { max: 4, min: 2 },
  optionText: { max: 15, min: 1 },
  orderItemCount: { max: 5, min: 3 },
  pairText: { max: 15, min: 1 },
  questionPrompt: { max: 20, min: 4 },
  readingBody: { max: 150, min: 20 },
  readingPerLesson: 1,
  readingTitle: { max: 30, min: 4 },
  segmentText: { max: 20, min: 1 },
  sentenceBuildTileCount: { max: 8, min: 4 },
  statement: { max: 40, min: 4 },
  stepTitle: { max: 30, min: 4 },
  tileText: { max: 10, min: 1 },
  wordText: { max: 12, min: 1 },
} as const

export const forbiddenLessonClosingStepTypes = ["MULTIPLE_CHOICE"] as const

export const lessonDurationContract = {
  defaultMinutes: authoringLimits.lessonEstimatedMinutes.default,
  defaultSteps: authoringLimits.lessonStepCount.default,
  maxRecommendedMinutes: authoringLimits.lessonEstimatedMinutes.max,
  maxRecommendedSteps: authoringLimits.lessonStepCount.max,
  minRecommendedMinutes: authoringLimits.lessonEstimatedMinutes.min,
  minRecommendedSteps: authoringLimits.lessonStepCount.min,
} as const

export const DEFAULT_LESSON_ESTIMATED_MINUTES =
  authoringLimits.lessonEstimatedMinutes.default
export const MIN_RECOMMENDED_LESSON_ESTIMATED_MINUTES =
  authoringLimits.lessonEstimatedMinutes.min
export const MAX_RECOMMENDED_LESSON_ESTIMATED_MINUTES =
  authoringLimits.lessonEstimatedMinutes.max
export const DEFAULT_LESSON_STEP_COUNT = authoringLimits.lessonStepCount.default
export const MIN_RECOMMENDED_LESSON_STEP_COUNT =
  authoringLimits.lessonStepCount.min
export const MAX_RECOMMENDED_LESSON_STEP_COUNT =
  authoringLimits.lessonStepCount.max
