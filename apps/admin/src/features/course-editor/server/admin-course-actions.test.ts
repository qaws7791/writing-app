import { beforeEach, describe, expect, it, vi } from "vitest"

import { adminCourseEditorSchema } from "@/features/course-editor/model/admin-course-editor"

const {
  getCourseEditorMock,
  getServerAdminRequestOptionsMock,
  publishCourseMock,
  revalidatePathMock,
  saveCourseMock,
  uploadContentAssetMock,
} = vi.hoisted(() => ({
  getCourseEditorMock: vi.fn(),
  getServerAdminRequestOptionsMock: vi.fn(),
  publishCourseMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  saveCourseMock: vi.fn(),
  uploadContentAssetMock: vi.fn(),
}))

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }))
vi.mock("@workspace/http-client/admin", () => ({
  getAdminCourseEditor: getCourseEditorMock,
  publishAdminCourse: publishCourseMock,
  saveAdminCourseEditor: saveCourseMock,
  uploadAdminContentAsset: uploadContentAssetMock,
}))
vi.mock("@/server/http/admin-api-request-options", () => ({
  getServerAdminRequestOptions: getServerAdminRequestOptionsMock,
}))

import {
  publishAdminCourseAction,
  saveAdminCourseEditorAction,
  uploadAdminContentAssetAction,
} from "@/features/course-editor/server/admin-course-actions"
import { createAdminCourseEditorFixture } from "@/features/course-editor/test/fixtures/admin-course-editor"
import { GeneratedApiClientError } from "@workspace/http-client/generated-fetch"

const document = adminCourseEditorSchema.parse(
  createAdminCourseEditorFixture({ description: "설명", title: "코스" })
)
const requestOptions = { cache: "no-store" } as const
const nextDraft = {
  ...document,
  curriculumVersionId: "course-1-v3",
  editVersion: 0,
  revision: 3,
}

describe("admin course editor actions", () => {
  beforeEach(() => {
    getServerAdminRequestOptionsMock.mockResolvedValue(requestOptions)
  })

  it("저장 성공 시 asset을 제외한 write DTO를 editVersion If-Match와 함께 보낸다", async () => {
    saveCourseMock.mockResolvedValue(document)

    await expect(saveAdminCourseEditorAction(document)).resolves.toEqual({
      status: "ok",
      value: document,
    })

    expect(getServerAdminRequestOptionsMock).toHaveBeenCalledWith({
      headers: { "If-Match": '"1"' },
    })
    expect(saveCourseMock).toHaveBeenCalledWith(
      "course-1",
      expect.not.objectContaining({ assets: expect.anything() }),
      requestOptions
    )
  })

  it("저장 성공 시 목록과 편집 경로를 재검증한다", async () => {
    saveCourseMock.mockResolvedValue(document)

    await saveAdminCourseEditorAction(document)

    expect(revalidatePathMock.mock.calls).toEqual([
      ["/courses"],
      ["/courses/course-1"],
    ])
  })

  it("발행 성공 시 editVersion If-Match로 요청하고 다음 초안을 다시 읽어 반환한다", async () => {
    publishCourseMock.mockResolvedValue({
      curriculumVersionId: "course-1-v2",
      publishedAt: "2026-07-17T00:00:00.000Z",
      revision: 2,
    })
    getCourseEditorMock.mockResolvedValue(nextDraft)

    await expect(publishAdminCourseAction(document)).resolves.toEqual({
      status: "ok",
      value: nextDraft,
    })

    expect(getServerAdminRequestOptionsMock).toHaveBeenCalledWith({
      headers: { "If-Match": '"1"' },
    })
    expect(publishCourseMock).toHaveBeenCalledWith("course-1", requestOptions)
    expect(getCourseEditorMock).toHaveBeenCalledWith("course-1", requestOptions)
  })

  it("발행 성공 시 목록과 편집 경로를 재검증한다", async () => {
    publishCourseMock.mockResolvedValue({
      curriculumVersionId: "course-1-v2",
      publishedAt: "2026-07-17T00:00:00.000Z",
      revision: 2,
    })
    getCourseEditorMock.mockResolvedValue(nextDraft)

    await publishAdminCourseAction(document)

    expect(revalidatePathMock.mock.calls).toEqual([
      ["/courses"],
      ["/courses/course-1"],
    ])
  })

  it("잘못된 입력은 generated mutation을 호출하지 않는다", async () => {
    await saveAdminCourseEditorAction({ id: "" })

    expect(saveCourseMock).not.toHaveBeenCalled()
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })

  it("세션 없는 요청은 generated mutation을 호출하지 않는다", async () => {
    getServerAdminRequestOptionsMock.mockResolvedValue(null)

    await publishAdminCourseAction(document)

    expect(publishCourseMock).not.toHaveBeenCalled()
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })

  it("stale editVersion 409이면 인증된 최신 문서를 충돌 결과로 반환한다", async () => {
    saveCourseMock.mockRejectedValue(
      new GeneratedApiClientError({
        error: {
          code: "CONTENT_CONFLICT",
          message: "편집 버전이 충돌했습니다.",
          requestId: "course-save-conflict",
        },
        kind: "http",
        retryAfterSeconds: null,
        status: 409,
      })
    )
    getCourseEditorMock.mockResolvedValue(nextDraft)

    await expect(saveAdminCourseEditorAction(document)).resolves.toEqual({
      latest: nextDraft,
      status: "conflict",
    })
    expect(getCourseEditorMock).toHaveBeenCalledWith("course-1", requestOptions)
    expect(revalidatePathMock).not.toHaveBeenCalled()
  })

  it("업로드 FormData를 검증하고 인증된 generated multipart 요청으로 변환한다", async () => {
    const asset = {
      altText: "코스 표지",
      byteSize: 5,
      contentType: "image/png",
      courseId: "course-1",
      curriculumVersionId: "course-1-v2",
      id: "asset-1",
      kind: "course-cover",
      url: "https://assets.example.test/course-1.png",
    }
    const file = new File(["cover"], "cover.png", { type: "image/png" })
    const formData = new FormData()
    formData.set("altText", asset.altText)
    formData.set("courseId", asset.courseId)
    formData.set("curriculumVersionId", asset.curriculumVersionId)
    formData.set("file", file)
    formData.set("kind", asset.kind)
    uploadContentAssetMock.mockResolvedValue(asset)

    await expect(uploadAdminContentAssetAction(formData)).resolves.toEqual({
      status: "ok",
      value: asset,
    })
    expect(uploadContentAssetMock).toHaveBeenCalledWith(
      "course-1",
      {
        altText: "코스 표지",
        curriculumVersionId: "course-1-v2",
        file,
        kind: "course-cover",
      },
      requestOptions
    )
  })
})
