import { z } from "zod"

import { authoringLimits } from "#contracts/content/authoring/authoring-limits"
import { koreanCharCount } from "#contracts/content/authoring/korean-text"

export function createBoundedKoreanTextSchema(input: {
  readonly fieldLabel: string
  readonly max: number
  readonly min: number
}): z.ZodString {
  return z.string().superRefine((value, context) => {
    const count = koreanCharCount(value)
    if (count < input.min) {
      context.addIssue({
        code: "custom",
        message: `${input.fieldLabel}은(는) ${input.min}자 이상이어야 합니다.`,
      })
    }
    if (count > input.max) {
      context.addIssue({
        code: "custom",
        message: `${input.fieldLabel}은(는) ${input.max}자 이하여야 합니다.`,
      })
    }
  })
}

export const readingBodySchema = createBoundedKoreanTextSchema({
  fieldLabel: "READING 본문",
  max: authoringLimits.readingBody.max,
  min: authoringLimits.readingBody.min,
})

export const readingTitleSchema = createBoundedKoreanTextSchema({
  fieldLabel: "READING 제목",
  max: authoringLimits.readingTitle.max,
  min: authoringLimits.readingTitle.min,
})

export const stepTitleSchema = createBoundedKoreanTextSchema({
  fieldLabel: "스텝 제목",
  max: authoringLimits.stepTitle.max,
  min: authoringLimits.stepTitle.min,
})

export const questionPromptSchema = createBoundedKoreanTextSchema({
  fieldLabel: "문항 지시문",
  max: authoringLimits.questionPrompt.max,
  min: authoringLimits.questionPrompt.min,
})

export const explanationSchema = createBoundedKoreanTextSchema({
  fieldLabel: "해설",
  max: authoringLimits.explanation.max,
  min: authoringLimits.explanation.min,
})

export const optionTextSchema = createBoundedKoreanTextSchema({
  fieldLabel: "선택지",
  max: authoringLimits.optionText.max,
  min: authoringLimits.optionText.min,
})

export const statementSchema = createBoundedKoreanTextSchema({
  fieldLabel: "판정 문장",
  max: authoringLimits.statement.max,
  min: authoringLimits.statement.min,
})

export const wordTextSchema = createBoundedKoreanTextSchema({
  fieldLabel: "단어",
  max: authoringLimits.wordText.max,
  min: authoringLimits.wordText.min,
})

export const segmentTextSchema = createBoundedKoreanTextSchema({
  fieldLabel: "구간",
  max: authoringLimits.segmentText.max,
  min: authoringLimits.segmentText.min,
})

export const tileTextSchema = createBoundedKoreanTextSchema({
  fieldLabel: "타일",
  max: authoringLimits.tileText.max,
  min: authoringLimits.tileText.min,
})

export const pairTextSchema = createBoundedKoreanTextSchema({
  fieldLabel: "짝짓기 항목",
  max: authoringLimits.pairText.max,
  min: authoringLimits.pairText.min,
})

export const compareAnalysisSchema = createBoundedKoreanTextSchema({
  fieldLabel: "분석",
  max: authoringLimits.compareAnalysis.max,
  min: authoringLimits.compareAnalysis.min,
})

export const compareVersionLabelSchema = createBoundedKoreanTextSchema({
  fieldLabel: "판본 라벨",
  max: authoringLimits.compareVersionLabel.max,
  min: authoringLimits.compareVersionLabel.min,
})

export const compareVersionMarkSchema = createBoundedKoreanTextSchema({
  fieldLabel: "강조 구간",
  max: authoringLimits.compareVersionMark.max,
  min: authoringLimits.compareVersionMark.min,
})

export const compareVersionTextSchema = createBoundedKoreanTextSchema({
  fieldLabel: "판본 본문",
  max: authoringLimits.compareVersionText.max,
  min: authoringLimits.compareVersionText.min,
})

export const categoryLabelSchema = createBoundedKoreanTextSchema({
  fieldLabel: "카테고리",
  max: authoringLimits.optionText.max,
  min: authoringLimits.optionText.min,
})

export const categorizeItemTextSchema = createBoundedKoreanTextSchema({
  fieldLabel: "분류 항목",
  max: authoringLimits.pairText.max,
  min: authoringLimits.pairText.min,
})
