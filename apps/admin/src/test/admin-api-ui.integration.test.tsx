// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest"
import { setupServer } from "msw/node"

import {
  getGetAdminCourseEditorMockHandler200,
  getSaveAdminCourseEditorMockHandler409,
  getUploadAdminContentAssetMockHandler,
  getUploadAdminContentAssetMockHandler200,
  getUploadAdminContentAssetMockHandler409,
} from "@workspace/http-client/admin/msw"
import {
  createApiErrorFixture,
  throwMswNetworkErrorFixture,
} from "@workspace/http-client/msw-fixtures"
import { localRuntimeDefaults } from "@workspace/env/local-runtime-defaults"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"
import type { ApiError } from "@workspace/contracts/api-error"

import type { AdminCourseDetail } from "@/features/course-editor/model/admin-course-editor"
import {
  saveAdminCourseEditorAction,
  uploadAdminContentAssetAction,
} from "@/features/course-editor/server/admin-course-actions"
import {
  createAdminCourseEditorFixture,
  emptyAssetsResult,
} from "@/features/course-editor/test/fixtures/admin-course-editor"
import { CourseEditorShell } from "@/features/course-editor/ui/course-editor-shell"
import { createAdminContentAssetFixture } from "@/test/admin-api-fixtures"

const sessionToken = "integration-session-token"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))
vi.mock("@/server/auth/get-admin-session-token", () => ({
  getServerAdminSessionToken: async () => sessionToken,
}))

const server = setupServer()

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

describe("generated admin client UI integration", () => {
  it("Server Action은 courseId를 path로만 보내고 multipart body는 write 필드로 제한한다", async () => {
    const user = userEvent.setup()
    const asset = createAdminContentAssetFixture()
    const requests: Request[] = []
    server.use(
      getUploadAdminContentAssetMockHandler200(({ request }) => {
        requests.push(request.clone())
        return asset
      })
    )
    renderEditor()

    await uploadCover(user, asset.altText)
    expect(
      await screen.findByRole("img", { name: asset.altText })
    ).toBeVisible()

    const uploadRequest = requests.at(0)
    expect(uploadRequest?.url).toContain(`/courses/${asset.courseId}/assets`)
    const body = await uploadRequest?.text()
    expect(readMultipartFieldNames(body)).toEqual([
      "altText",
      "curriculumVersionId",
      "file",
      "kind",
    ])
    expect(body).toContain(asset.altText)
    expect(body).toContain(asset.curriculumVersionId)
    expect(body).toContain(asset.kind)
  })

  it("Server Action 요청은 검증된 Origin과 세션 cookie를 함께 실어 보낸다", async () => {
    const user = userEvent.setup()
    const asset = createAdminContentAssetFixture()
    const requests: Request[] = []
    server.use(
      getUploadAdminContentAssetMockHandler200(({ request }) => {
        requests.push(request.clone())
        return asset
      })
    )
    renderEditor()

    await uploadCover(user, asset.altText)
    await screen.findByRole("img", { name: asset.altText })

    const uploadRequest = requests.at(0)
    expect(uploadRequest?.headers.get("origin")).toBe(
      localRuntimeDefaults.adminWebOrigin
    )
    expect(uploadRequest?.headers.get("cookie")).toBe(
      `${adminSessionCookieName}=${sessionToken}`
    )
  })

  it("generated upload 409를 편집 맥락의 오류로 표시한다", async () => {
    const user = userEvent.setup()
    server.use(
      getUploadAdminContentAssetMockHandler409(
        toGeneratedErrorBody(
          createApiErrorFixture(409, {
            code: "CONTENT_CONFLICT",
            message: "발행된 리비전의 이미지는 변경할 수 없습니다.",
          })
        )
      )
    )
    renderEditor()

    await uploadCover(user, "발행된 코스 표지")

    expect(
      await screen.findByText("발행된 리비전의 이미지는 변경할 수 없습니다.")
    ).toBeVisible()
  })

  it("generated upload network 실패 뒤 다시 시도하면 업로드를 완료한다", async () => {
    const user = userEvent.setup()
    const asset = createAdminContentAssetFixture()
    server.use(
      getUploadAdminContentAssetMockHandler(() => throwMswNetworkErrorFixture())
    )
    renderEditor()

    await uploadCover(user, "네트워크 오류 표지")

    expect(
      await screen.findByText("네트워크 연결을 확인해 주세요.")
    ).toBeVisible()
    const uploadButton = screen.getByRole("button", { name: "이미지 업로드" })
    expect(uploadButton).toBeEnabled()

    server.use(getUploadAdminContentAssetMockHandler200(asset))
    await user.click(uploadButton)

    expect(
      await screen.findByRole("img", { name: asset.altText })
    ).toBeVisible()
    expect(
      screen.queryByText("네트워크 연결을 확인해 주세요.")
    ).not.toBeInTheDocument()
  })

  it("저장 409 뒤 generated editor read로 최신 충돌 문서를 제공한다", async () => {
    const user = userEvent.setup()
    const latest = createAdminCourseEditorFixture({
      editVersion: 2,
      title: "서버 최신 제목",
    })
    server.use(
      getSaveAdminCourseEditorMockHandler409(
        toGeneratedErrorBody(
          createApiErrorFixture(409, {
            code: "CONTENT_CONFLICT",
            message: "편집 버전이 충돌했습니다.",
          })
        )
      ),
      getGetAdminCourseEditorMockHandler200(latest)
    )
    renderEditor()

    await user.clear(screen.getByLabelText("제목"))
    await user.type(screen.getByLabelText("제목"), "로컬 변경 제목")
    await user.click(screen.getByRole("button", { name: "변경 저장" }))

    expect(
      await screen.findByRole("group", { name: "충돌 해결" })
    ).toBeVisible()
    await user.click(screen.getByRole("button", { name: "최신본으로 교체" }))
    await waitFor(() =>
      expect(screen.getByLabelText("제목")).toHaveValue("서버 최신 제목")
    )
  })
})

function renderEditor(
  course: AdminCourseDetail = createAdminCourseEditorFixture()
): void {
  render(
    <CourseEditorShell
      assetsResult={emptyAssetsResult}
      course={course}
      publishCourse={async (document) => ({ status: "ok", value: document })}
      saveCourse={saveAdminCourseEditorAction}
      uploadAdminContentAsset={uploadAdminContentAssetAction}
    />
  )
}

async function uploadCover(
  user: ReturnType<typeof userEvent.setup>,
  altText: string
): Promise<void> {
  await user.upload(
    screen.getByLabelText("이미지 파일"),
    new File(["cover"], "cover.png", { type: "image/png" })
  )
  await user.type(screen.getByLabelText("대체 텍스트"), altText)
  await user.click(screen.getByRole("button", { name: "이미지 업로드" }))
}

function readMultipartFieldNames(body: string | undefined): readonly string[] {
  return [...(body ?? "").matchAll(/form-data; name="([^"]+)"/gu)]
    .flatMap((match) => (match[1] === undefined ? [] : [match[1]]))
    .sort()
}

/** generated 오류 타입은 exact optional이라 설정하지 않은 violations key를 남기지 않는다. */
function toGeneratedErrorBody(fixture: ApiError): Omit<ApiError, "violations"> {
  const { violations: _violations, ...error } = fixture

  return error
}
