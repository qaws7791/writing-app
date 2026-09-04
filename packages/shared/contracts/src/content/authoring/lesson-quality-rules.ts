import type { LessonStepDto } from "#contracts/content/course"
import type { LessonAuthoringIssue } from "#contracts/content/authoring/authoring-issue"
import { findForbiddenBrandTerms } from "#contracts/content/authoring/forbidden-terms"

/**
 * 스텝 의미 품질의 숫자 기준.
 * 제품 문서: docs/product/authoring-guidelines.md
 */
export const lessonQualityLimits = {
  errorCorrectFixCount: { min: 3 },
  explanationPrefixLength: 8,
  explanationPrefixRepeatMax: 2,
  heavyStepEarliestIndex: 3,
  multipleChoiceOptionCount: { min: 3 },
  positionSkewMinSteps: 3,
  positionSkewRatio: 0.6,
  selectSegmentCount: { min: 4 },
} as const

const anchorStepTypes: ReadonlySet<string> = new Set(["COMPARE", "READING"])
const heavyStepTypes: ReadonlySet<string> = new Set([
  "ERROR_CORRECT",
  "SENTENCE_BUILD",
])
const reasonConnectivePattern = /(때문|므로|어서|아서|라서|니까|거든|해야|면 )/u
const ruleStatementPattern =
  /(원칙|규칙|수록|항상|반드시|무조건|하면 .*(된다|됩니다|진다|집니다|보인다|보입니다))/u
const quotedSpanPattern = /'[^']*'|"[^"]*"|「[^」]*」|“[^”]*”|‘[^’]*’/gu
const formalEndingPattern = /다$/u

export function collectLessonQualityIssues(input: {
  readonly lessonId: string
  readonly steps: readonly LessonStepDto[]
}): readonly LessonAuthoringIssue[] {
  const { lessonId, steps } = input
  const issues: LessonAuthoringIssue[] = []
  const stepPath = (index: number) => `${lessonId}-s${index + 1}`

  const firstStep = steps[0]
  if (firstStep !== undefined && !anchorStepTypes.has(firstStep.type)) {
    issues.push({
      message: "첫 스텝은 COMPARE 또는 READING이어야 합니다.",
      path: stepPath(0),
      severity: "error",
    })
  }

  const positionIndexes: number[] = []
  const positionIsLast: boolean[] = []
  const explanationPrefixes = new Map<string, number[]>()

  steps.forEach((step, index) => {
    const path = stepPath(index)

    const brandTerms = findForbiddenBrandTerms(JSON.stringify(step))
    if (brandTerms.length > 0) {
      issues.push({
        message: `브랜드·서비스 이름을 쓸 수 없습니다: ${brandTerms.join(", ")}`,
        path,
        severity: "error",
      })
    }

    if (
      index < lessonQualityLimits.heavyStepEarliestIndex &&
      heavyStepTypes.has(step.type)
    ) {
      issues.push({
        message: `${step.type}은(는) ${lessonQualityLimits.heavyStepEarliestIndex + 1}번째 스텝부터 배치합니다.`,
        path,
        severity: "warning",
      })
    }

    for (const text of collectAuthorVoiceTexts(step)) {
      if (endsWithFormalEnding(text)) {
        issues.push({
          message: `해요체로 씁니다. 합니다체·해라체 종결이 있습니다: "${text}"`,
          path,
          severity: "error",
        })
      }
    }

    if ("explanation" in step) {
      const prefix = step.explanation.slice(
        0,
        lessonQualityLimits.explanationPrefixLength
      )
      explanationPrefixes.set(prefix, [
        ...(explanationPrefixes.get(prefix) ?? []),
        index + 1,
      ])

      if (
        /^['"「“‘]/u.test(step.explanation) &&
        !reasonConnectivePattern.test(step.explanation)
      ) {
        issues.push({
          message: "해설이 정답 인용으로 시작하고 이유 표현이 없습니다.",
          path,
          severity: "warning",
        })
      }
    }

    switch (step.type) {
      case "SELECT": {
        if (step.segments.length < lessonQualityLimits.selectSegmentCount.min) {
          issues.push({
            message: `SELECT 구간은 ${lessonQualityLimits.selectSegmentCount.min}개 이상이어야 합니다.`,
            path,
            severity: "error",
          })
        }
        if (step.correct.length === 1) {
          const correctIndex = step.segmentIds.indexOf(
            step.correct[0] as string
          )
          positionIndexes.push(correctIndex)
          positionIsLast.push(correctIndex === step.segmentIds.length - 1)
        }
        break
      }
      case "ERROR_CORRECT": {
        if (step.fixes.length < lessonQualityLimits.errorCorrectFixCount.min) {
          issues.push({
            message: `ERROR_CORRECT 교정안은 ${lessonQualityLimits.errorCorrectFixCount.min}개 이상이어야 합니다.`,
            path,
            severity: "error",
          })
        }
        const correctIndex = step.segmentIds.indexOf(step.correctSegment)
        const original = (step.segments[correctIndex] ?? "").trim()
        if (step.fixes.some((fix) => fix.trim() === original)) {
          issues.push({
            message: "교정안에 원문 구간을 그대로 넣을 수 없습니다.",
            path,
            severity: "error",
          })
        }
        positionIndexes.push(correctIndex)
        positionIsLast.push(correctIndex === step.segmentIds.length - 1)
        break
      }
      case "MULTIPLE_CHOICE": {
        if (
          step.options.length <
          lessonQualityLimits.multipleChoiceOptionCount.min
        ) {
          issues.push({
            message: `MULTIPLE_CHOICE 선택지는 ${lessonQualityLimits.multipleChoiceOptionCount.min}개 이상이어야 합니다.`,
            path,
            severity: "error",
          })
        }
        break
      }
      case "TRUE_FALSE": {
        if (ruleStatementPattern.test(step.statement)) {
          issues.push({
            message:
              "TRUE_FALSE 판정 문장이 규칙 진술로 보입니다. 실제 문장 하나를 판정하게 합니다.",
            path,
            severity: "warning",
          })
        }
        break
      }
      default:
        break
    }
  })

  for (const [prefix, stepNumbers] of explanationPrefixes) {
    if (stepNumbers.length > lessonQualityLimits.explanationPrefixRepeatMax) {
      issues.push({
        message: `해설 앞 ${lessonQualityLimits.explanationPrefixLength}자 "${prefix}"가 ${stepNumbers.length}회 반복됩니다 (스텝 ${stepNumbers.join(", ")}).`,
        path: lessonId,
        severity: "error",
      })
    }
  }

  if (positionIndexes.length >= lessonQualityLimits.positionSkewMinSteps) {
    const lastRatio =
      positionIsLast.filter(Boolean).length / positionIsLast.length
    if (lastRatio >= lessonQualityLimits.positionSkewRatio) {
      issues.push({
        message: `위치 정답이 마지막 구간에 ${Math.round(lastRatio * 100)}% 몰려 있습니다.`,
        path: lessonId,
        severity: "error",
      })
    } else {
      const dominant = findDominantRatio(positionIndexes)
      if (
        dominant !== null &&
        dominant.ratio >= lessonQualityLimits.positionSkewRatio
      ) {
        issues.push({
          message: `위치 정답이 ${dominant.value + 1}번째 구간에 ${Math.round(dominant.ratio * 100)}% 몰려 있습니다.`,
          path: lessonId,
          severity: "error",
        })
      }
    }
  }

  return issues
}

/** 집필자 목소리로 쓰는 필드. 학습자가 판정하는 예문(statement·options·segments)은 제외한다. */
function collectAuthorVoiceTexts(step: LessonStepDto): readonly string[] {
  const texts: string[] = []
  if ("explanation" in step) texts.push(step.explanation)
  if ("question" in step) texts.push(step.question)
  if (step.type === "COMPARE") texts.push(step.analysis)
  if (step.type === "READING") texts.push(step.body)
  return texts
}

function endsWithFormalEnding(text: string): boolean {
  const withoutQuotes = text.replace(quotedSpanPattern, "")
  return withoutQuotes
    .split(/[.!?]\s*/u)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0)
    .some((sentence) => formalEndingPattern.test(sentence))
}

function findDominantRatio(
  values: readonly number[]
): { ratio: number; value: number } | null {
  if (values.length === 0) return null
  const counts = new Map<number, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  let dominant: { ratio: number; value: number } | null = null
  for (const [value, count] of counts) {
    const ratio = count / values.length
    if (dominant === null || ratio > dominant.ratio) dominant = { ratio, value }
  }
  return dominant
}
