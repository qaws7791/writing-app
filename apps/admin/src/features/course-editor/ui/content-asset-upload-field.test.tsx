import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ContentAssetUploadField } from "@/features/course-editor/ui/content-asset-upload-field"
import { createAdminContentAssetFixture } from "@/test/admin-api-fixtures"

describe("ContentAssetUploadField", () => {
  it("화면 상단의 코스 표지를 즉시 로드한다", () => {
    render(
      <ContentAssetUploadField
        asset={createAdminContentAssetFixture()}
        kind="course-cover"
        label="코스 표지"
        onRemove={vi.fn()}
        onUploaded={vi.fn()}
        upload={vi.fn()}
      />
    )

    expect(
      screen.getByRole("img", { name: "글쓰기 코스 표지" })
    ).toHaveAttribute("loading", "eager")
  })

  it("대체 텍스트 없이 업로드하지 않는다", async () => {
    const user = userEvent.setup()
    const upload = vi.fn()
    render(
      <ContentAssetUploadField
        asset={undefined}
        kind="reading-illustration"
        label="읽기 삽화"
        onRemove={vi.fn()}
        onUploaded={vi.fn()}
        upload={upload}
      />
    )

    await user.upload(
      screen.getByLabelText("이미지 파일"),
      new File(["image"], "reading.png", { type: "image/png" })
    )
    await user.click(screen.getByRole("button", { name: "이미지 업로드" }))

    expect(screen.getByText("대체 텍스트를 입력해 주세요.")).toBeVisible()
    expect(upload).not.toHaveBeenCalled()
  })

  it("업로드 오류를 편집 맥락에서 표시한다", async () => {
    const user = userEvent.setup()
    render(
      <ContentAssetUploadField
        asset={undefined}
        kind="course-cover"
        label="코스 표지"
        onRemove={vi.fn()}
        onUploaded={vi.fn()}
        upload={async () => ({
          error: {
            code: "CONTENT_ASSET_STORAGE_UNAVAILABLE",
            kind: "http",
            message: "이미지 저장소를 사용할 수 없습니다.",
            requestId: "asset-request",
            retryAfterSeconds: null,
            status: 503,
          },
          status: "error",
        })}
      />
    )

    await user.upload(
      screen.getByLabelText("이미지 파일"),
      new File(["image"], "cover.webp", { type: "image/webp" })
    )
    await user.type(screen.getByLabelText("대체 텍스트"), "코스 표지")
    await user.click(screen.getByRole("button", { name: "이미지 업로드" }))

    expect(
      await screen.findByText("이미지 저장소를 사용할 수 없습니다.")
    ).toBeVisible()
  })

  it("발행 revision에서는 모든 변경 control을 잠근다", () => {
    render(
      <ContentAssetUploadField
        asset={undefined}
        disabled
        kind="course-cover"
        label="코스 표지"
        onRemove={vi.fn()}
        onUploaded={vi.fn()}
        upload={async () => {
          throw new Error("잠긴 control은 업로드하지 않습니다.")
        }}
      />
    )

    expect(screen.getByLabelText("이미지 파일")).toBeDisabled()
    expect(screen.getByLabelText("대체 텍스트")).toBeDisabled()
    expect(
      screen.getByText("발행된 리비전의 이미지는 변경할 수 없습니다.")
    ).toBeVisible()
  })
})
