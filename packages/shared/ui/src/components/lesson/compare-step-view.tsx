import {
  Compare,
  ComparePanel,
  CompareVersion,
  CompareVersionList,
  CompareVersions,
} from "#ui/components/ui/compare"
import {
  Insight,
  InsightDescription,
  InsightEyebrow,
} from "#ui/components/ui/insight"
import { StepHeader, StepTitle } from "#ui/components/ui/step"

export function CompareStepView({
  analysis,
  title,
  versions,
}: {
  readonly analysis: string
  readonly title: string
  readonly versions: readonly {
    readonly label: string
    readonly text: string
  }[]
}) {
  return (
    <>
      <StepHeader>
        <StepTitle>
          <h2>{title || "두 버전을 비교해보세요"}</h2>
        </StepTitle>
      </StepHeader>
      <Compare>
        <CompareVersions defaultValue="0">
          <CompareVersionList aria-label="비교할 버전">
            {versions.map((version, index) => (
              <CompareVersion
                key={`${version.label}-${index}`}
                value={String(index)}
              >
                {version.label}
              </CompareVersion>
            ))}
          </CompareVersionList>
          {versions.map((version, index) => (
            <ComparePanel
              key={`${version.label}-${index}`}
              value={String(index)}
            >
              <p className="whitespace-pre-line">{version.text}</p>
            </ComparePanel>
          ))}
        </CompareVersions>
        {analysis ? (
          <Insight tone="think">
            <InsightEyebrow>생각해보기</InsightEyebrow>
            <InsightDescription>{analysis}</InsightDescription>
          </Insight>
        ) : null}
      </Compare>
    </>
  )
}
