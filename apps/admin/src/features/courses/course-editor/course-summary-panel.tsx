import * as React from "react"

import type { AdminCourseDetailDto } from "@workspace/core/admin"

type CourseSummaryPanelProps = {
  course: AdminCourseDetailDto
  isReadOnly?: boolean
  isThumbnailUploading?: boolean
  onSelectThumbnailFile?: (file: File) => void
  onUpdateCourseField?: (field: "description" | "title", value: string) => void
  thumbnailUploadError?: string | null
}

export function CourseSummaryPanel({
  course,
  isReadOnly = false,
  isThumbnailUploading = false,
  onSelectThumbnailFile,
  onUpdateCourseField,
  thumbnailUploadError = null,
}: CourseSummaryPanelProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const handleUploadButtonClick = React.useCallback(() => {
    fileInputRef.current?.click()
  }, [])
  const handleFileChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.currentTarget.files?.[0]
      event.currentTarget.value = ""

      if (file) {
        onSelectThumbnailFile?.(file)
      }
    },
    [onSelectThumbnailFile]
  )

  return (
    <section className="flex flex-col gap-4" aria-labelledby="course-summary">
      <div className="space-y-3">
        <div
          aria-label={`${course.title} 썸네일`}
          className="aspect-[16/9] w-full rounded-md border bg-muted bg-cover bg-center"
          role="img"
          style={{ backgroundImage: `url(${course.thumbnailPath})` }}
        />
        <input
          ref={fileInputRef}
          accept="image/png,image/jpeg,image/webp"
          aria-label="썸네일 파일"
          className="sr-only"
          disabled={isReadOnly || isThumbnailUploading}
          type="file"
          onChange={handleFileChange}
        />
        <button
          type="button"
          className="w-full rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isReadOnly || isThumbnailUploading}
          onClick={handleUploadButtonClick}
        >
          {isThumbnailUploading ? "업로드 중..." : "썸네일 변경"}
        </button>
        {thumbnailUploadError ? (
          <p className="text-sm text-destructive">{thumbnailUploadError}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <label className="grid min-w-0 gap-1 text-sm">
          <span className="text-xs text-muted-foreground">코스 제목</span>
          <input
            id="course-summary"
            className="min-w-0 rounded-md border bg-background px-3 py-2 text-xl font-semibold disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isReadOnly}
            value={course.title}
            onChange={(event) =>
              onUpdateCourseField?.("title", event.currentTarget.value)
            }
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs text-muted-foreground">코스 설명</span>
          <textarea
            className="min-h-24 rounded-md border bg-background px-3 py-2 leading-6 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isReadOnly}
            value={course.description}
            onChange={(event) =>
              onUpdateCourseField?.("description", event.currentTarget.value)
            }
          />
        </label>
      </div>
    </section>
  )
}
