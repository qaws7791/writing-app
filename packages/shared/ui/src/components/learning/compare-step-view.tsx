import {
  Compare,
  CompareMark,
  CompareVersion,
  CompareVersionLabel,
  CompareVersionText,
} from "#ui/components/learning/compare"
import { Insight, InsightDescription } from "#ui/components/learning/insight"
import {
  StepBody,
  StepEyebrow,
  StepHeader,
  StepTitle,
} from "#ui/components/learning/step"

const COMPARE_TASK_TITLE = "두 판본을 비교하세요"

export function CompareStepView({
  analysis,
  title,
  versions,
}: {
  readonly analysis: string
  readonly title: string
  readonly versions: readonly {
    readonly label: string
    readonly mark: string
    readonly text: string
  }[]
}) {
  const situation = title.trim()

  return (
    <>
      <StepHeader>
        {situation === "" ? null : <StepEyebrow>{situation}</StepEyebrow>}
        <StepTitle>
          <h1>{COMPARE_TASK_TITLE}</h1>
        </StepTitle>
      </StepHeader>
      <StepBody>
        <Compare
          className={versions.length === 2 ? undefined : "sm:grid-cols-1"}
        >
          {versions.map((version, index) => (
            <CompareVersion key={`${version.label}-${index}`}>
              <CompareVersionLabel>{version.label}</CompareVersionLabel>
              <CompareVersionText>
                {renderMarkedText(version.text, version.mark)}
              </CompareVersionText>
            </CompareVersion>
          ))}
        </Compare>
        <Insight tone="think">
          <InsightDescription>{analysis}</InsightDescription>
        </Insight>
      </StepBody>
    </>
  )
}

function renderMarkedText(text: string, mark: string) {
  const index = text.indexOf(mark)
  if (index < 0) return text

  return (
    <>
      {text.slice(0, index)}
      <CompareMark>{mark}</CompareMark>
      {text.slice(index + mark.length)}
    </>
  )
}
