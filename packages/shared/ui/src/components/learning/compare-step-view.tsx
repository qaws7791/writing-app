import {
  Compare,
  ComparePanel,
  CompareVersion,
  CompareVersionList,
  CompareVersions,
} from "#ui/components/learning/compare"
import { StepHeader, StepTitle } from "#ui/components/learning/step"

export function CompareStepView({
  title,
  versions,
}: {
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
          <h1>{title || "두 버전을 비교해보세요"}</h1>
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
      </Compare>
    </>
  )
}
