"use client"

import { useRef, useState } from "react"

import { Button } from "@workspace/ui/components/ui/button"

type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "error"; message: string }

type Props = {
  label?: string
  value: string
  onUrlChange: (url: string | null) => void
  accept?: string
}

export function ImageUpload({
  label = "썸네일 이미지 (선택)",
  value,
  onUrlChange,
  accept = "image/jpeg,image/png,image/webp,image/gif,image/avif",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
  })
  const [isDragOver, setIsDragOver] = useState(false)

  async function uploadFile(file: File) {
    setUploadState({ status: "uploading" })
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const message =
          typeof data.error === "string" ? data.error : "업로드에 실패했습니다"
        setUploadState({ status: "error", message })
        return
      }

      const { url } = (await res.json()) as { url: string }
      onUrlChange(url)
      setUploadState({ status: "idle" })
    } catch {
      setUploadState({
        status: "error",
        message: "네트워크 오류가 발생했습니다",
      })
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void uploadFile(file)
    e.target.value = ""
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) void uploadFile(file)
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave() {
    setIsDragOver(false)
  }

  const isUploading = uploadState.status === "uploading"

  return (
    <div className="space-y-1.5">
      <label className="label">{label}</label>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      {value ? (
        <div className="space-y-2">
          <img
            src={value}
            alt="썸네일 미리보기"
            className="h-40 w-auto rounded-xl border border-border object-cover"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
            >
              {isUploading ? "업로드 중..." : "이미지 교체"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isUploading}
              onClick={() => {
                onUrlChange(null)
                setUploadState({ status: "idle" })
              }}
            >
              삭제
            </Button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label="이미지 업로드. 클릭하거나 파일을 드래그하여 업로드하세요"
          onClick={() => {
            if (!isUploading) inputRef.current?.click()
          }}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !isUploading) {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={[
            "flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors",
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/50",
            isUploading ? "pointer-events-none" : "",
          ].join(" ")}
        >
          {isUploading ? (
            <p className="text-sm text-muted-foreground">업로드 중...</p>
          ) : (
            <>
              <svg
                className="size-8 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                />
              </svg>
              <p className="text-sm text-muted-foreground">
                클릭하거나 파일을 드래그하여 업로드
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WebP, GIF, AVIF · 최대 5MB
              </p>
            </>
          )}
        </div>
      )}

      {uploadState.status === "error" && (
        <p className="text-sm text-destructive">{uploadState.message}</p>
      )}
    </div>
  )
}
