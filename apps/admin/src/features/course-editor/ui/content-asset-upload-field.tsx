"use client"

import Image from "next/image"
import { useId, useState } from "react"
import type {
  AdminContentAsset,
  AdminContentAssetKind,
} from "@/features/course-editor/model/admin-course-editor"

import type { AdminRequestResult } from "@/shared/http/admin-api-client"
import {
  Alert,
  AlertDescription,
} from "@workspace/ui/components/primitives/alert"
import { Button } from "@workspace/ui/components/primitives/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/primitives/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/primitives/field"
import { Input } from "@workspace/ui/components/primitives/input"

const acceptedImageTypes = "image/jpeg,image/png,image/webp"

export function ContentAssetUploadField({
  asset,
  disabled = false,
  kind,
  label,
  onRemove,
  onUploaded,
  upload,
}: {
  readonly asset: AdminContentAsset | undefined
  readonly disabled?: boolean
  readonly kind: AdminContentAssetKind
  readonly label: string
  readonly onRemove: () => void
  readonly onUploaded: (asset: AdminContentAsset) => void
  readonly upload: (input: {
    readonly altText: string
    readonly file: File
    readonly kind: AdminContentAssetKind
  }) => Promise<AdminRequestResult<AdminContentAsset>>
}) {
  return (
    <ContentAssetUploadControl
      asset={asset}
      disabled={disabled}
      key={asset?.id ?? `${kind}-empty`}
      kind={kind}
      label={label}
      onRemove={onRemove}
      onUploaded={onUploaded}
      upload={upload}
    />
  )
}

function ContentAssetUploadControl({
  asset,
  disabled,
  kind,
  label,
  onRemove,
  onUploaded,
  upload,
}: {
  readonly asset: AdminContentAsset | undefined
  readonly disabled: boolean
  readonly kind: AdminContentAssetKind
  readonly label: string
  readonly onRemove: () => void
  readonly onUploaded: (asset: AdminContentAsset) => void
  readonly upload: (input: {
    readonly altText: string
    readonly file: File
    readonly kind: AdminContentAssetKind
  }) => Promise<AdminRequestResult<AdminContentAsset>>
}) {
  const generatedId = useId()
  const inputPrefix = `${kind}-${asset?.id ?? generatedId}`
  const [altText, setAltText] = useState(asset?.altText ?? "")
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const submit = async () => {
    if (file === null) {
      setError("업로드할 이미지를 선택해 주세요.")
      return
    }
    if (altText.trim() === "") {
      setError("대체 텍스트를 입력해 주세요.")
      return
    }

    setError(null)
    setUploading(true)
    const result = await upload({ altText: altText.trim(), file, kind })
    setUploading(false)
    if (result.status === "error") {
      setError(result.error.message)
      return
    }
    onUploaded(result.value)
  }

  return (
    <Card aria-label={label} role="region" size="sm">
      <CardHeader>
        <CardTitle>
          <h2>{label}</h2>
        </CardTitle>
        <CardDescription>JPEG, PNG, WebP · 최대 5MB</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {asset === undefined ? null : (
          <figure className="grid gap-2">
            <Image
              alt={asset.altText}
              className="aspect-video w-full rounded-lg border border-border object-cover"
              height={405}
              loading={kind === "course-cover" ? "eager" : "lazy"}
              sizes="(max-width: 768px) calc(100vw - 4rem), 36rem"
              src={asset.url}
              width={720}
            />
            <figcaption className="text-xs text-muted-foreground">
              현재 이미지: {asset.altText}
            </figcaption>
          </figure>
        )}
        <Field data-invalid={error === null ? undefined : true}>
          <FieldLabel htmlFor={`${inputPrefix}-file`}>
            {asset === undefined ? "이미지 파일" : "교체할 이미지 파일"}
          </FieldLabel>
          <Input
            accept={acceptedImageTypes}
            disabled={disabled || uploading}
            id={`${inputPrefix}-file`}
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null)
              setError(null)
            }}
            type="file"
          />
          <FieldDescription>
            이미지를 설명하는 대체 텍스트와 함께 업로드합니다.
          </FieldDescription>
        </Field>
        <Field data-invalid={error === null ? undefined : true}>
          <FieldLabel htmlFor={`${inputPrefix}-alt`}>대체 텍스트</FieldLabel>
          <Input
            disabled={disabled || uploading}
            id={`${inputPrefix}-alt`}
            maxLength={500}
            onChange={(event) => {
              setAltText(event.target.value)
              setError(null)
            }}
            required
            value={altText}
          />
          <FieldError>{error}</FieldError>
        </Field>
        {uploading ? (
          <div aria-live="polite" className="grid gap-2 text-sm">
            <progress
              aria-label={`${label} 업로드 진행 중`}
              className="w-full"
            />
            <span>이미지를 업로드하고 있습니다…</span>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={disabled || uploading}
            onClick={submit}
            type="button"
            variant="outline"
          >
            {asset === undefined ? "이미지 업로드" : "이미지 교체"}
          </Button>
          {asset === undefined ? null : (
            <Button
              disabled={disabled || uploading}
              onClick={onRemove}
              type="button"
              variant="ghost"
            >
              이미지 연결 해제
            </Button>
          )}
        </div>
        {disabled ? (
          <Alert>
            <AlertDescription>
              발행된 리비전의 이미지는 변경할 수 없습니다.
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  )
}
