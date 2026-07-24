import {
  StepFormShell,
  StepTextField,
  type StepFormProps,
} from "@/features/course-editor/ui/step-forms/shared/step-form-contract"
import { ContentAssetUploadField } from "@/features/course-editor/ui/content-asset-upload-field"

export function ReadingStepForm({
  assetUpload,
  onChange,
  step,
}: StepFormProps<"READING">) {
  const illustration = assetUpload.assets.find(
    (asset) =>
      asset.id === step.illustrationAssetId &&
      asset.kind === "reading-illustration"
  )

  return (
    <StepFormShell step={step}>
      <StepTextField
        id={`${step.id}-title`}
        label="제목"
        onChange={(title) => onChange({ ...step, title })}
        value={step.title}
      />
      <StepTextField
        id={`${step.id}-guide`}
        label="안내"
        multiline
        onChange={(guide) => onChange({ ...step, guide })}
        value={step.guide}
      />
      <StepTextField
        id={`${step.id}-body`}
        label="본문"
        multiline
        onChange={(body) => onChange({ ...step, body })}
        value={step.body}
      />
      <StepTextField
        id={`${step.id}-source`}
        label="출처"
        onChange={(source) => {
          const { source: _source, ...stepWithoutSource } = step
          onChange(source === "" ? stepWithoutSource : { ...step, source })
        }}
        value={step.source}
      />
      <ContentAssetUploadField
        asset={illustration}
        disabled={assetUpload.disabled}
        kind="reading-illustration"
        label="읽기 삽화"
        onRemove={() => {
          const { illustrationAssetId: _illustrationAssetId, ...nextStep } =
            step
          onChange(nextStep)
        }}
        onUploaded={(asset) =>
          onChange({ ...step, illustrationAssetId: asset.id })
        }
        upload={assetUpload.upload}
      />
    </StepFormShell>
  )
}
