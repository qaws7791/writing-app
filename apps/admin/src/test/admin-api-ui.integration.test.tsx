import { File as NodeFile } from "node:buffer"

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
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
  getUploadAdminContentAssetMockHandler,
  getUploadAdminContentAssetMockHandler200,
  getUploadAdminContentAssetMockHandler409,
} from "@workspace/http-client/admin/msw"
import {
  createApiErrorFixture,
  throwMswNetworkErrorFixture,
} from "@workspace/http-client/msw-fixtures"

import { CourseEditorShell } from "@/features/course-editor/ui/course-editor-shell"
import type { AdminRequestResult } from "@/shared/http/admin-api-client"
import {
  createAdminContentAssetFixture,
  createAdminCourseEditorFixture,
  type AdminContentAssetFixture,
  type AdminCourseEditorFixture,
} from "@/test/admin-api-fixtures"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const server = setupServer()
const nativeRequest = globalThis.Request

beforeAll(() => {
  globalThis.Request = class BrowserRequest extends nativeRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      super(resolveBrowserRequestInput(input), init)
    }
  }
  server.listen({ onUnhandledRequest: "error" })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
  globalThis.Request = nativeRequest
})

describe("generated admin client UI integration", () => {
  it("multipart write 필드를 제한하고 업로드 중 진행 상태 뒤 generated asset을 반영한다", async () => {
    const user = userEvent.setup()
    const asset = createAdminContentAssetFixture()
    let finishUpload: ((asset: AdminContentAssetFixture) => void) | undefined
    const upload = new Promise<AdminContentAssetFixture>((resolve) => {
      finishUpload = resolve
    })
    let uploadRequest: Request | undefined
    server.use(
      getUploadAdminContentAssetMockHandler200(async ({ request }) => {
        uploadRequest = request
        return upload
      })
    )
    renderEditor()

    await selectCover(user, asset.altText)
    expect(
      await screen.findByRole("progressbar", {
        name: "코스 표지 업로드 진행 중",
      })
    ).toBeVisible()
    expect(uploadRequest).toBeDefined()
    if (uploadRequest === undefined) throw new Error("업로드 요청이 없습니다.")
    const body = await uploadRequest.clone().formData()
    const file = body.get("file")
    expect([...body.keys()].sort()).toEqual([
      "altText",
      "curriculumVersionId",
      "file",
      "kind",
    ])
    expect(body.get("altText")).toBe(asset.altText)
    expect(body.get("curriculumVersionId")).toBe(asset.curriculumVersionId)
    expect(body.get("kind")).toBe(asset.kind)
    expect(file).not.toBeNull()

    finishUpload?.(asset)

    expect(
      await screen.findByRole("img", { name: asset.altText })
    ).toBeVisible()
  })

  it("generated upload 409를 편집 맥락의 오류로 표시한다", async () => {
    const user = userEvent.setup()
    server.use(
      getUploadAdminContentAssetMockHandler409(
        createGeneratedAdminErrorFixture(409, {
          code: "CONTENT_CONFLICT",
          message: "발행된 리비전의 이미지는 변경할 수 없습니다.",
        })
      )
    )
    renderEditor()

    await selectCover(user, "발행된 코스 표지")

    expect(
      await screen.findByText("발행된 리비전의 이미지는 변경할 수 없습니다.")
    ).toBeVisible()
  })

  it("generated upload network 실패를 다시 시도 가능한 inline 오류로 표시한다", async () => {
    const user = userEvent.setup()
    server.use(
      getUploadAdminContentAssetMockHandler(() => throwMswNetworkErrorFixture())
    )
    renderEditor()

    await selectCover(user, "네트워크 오류 표지")

    expect(
      await screen.findByText("네트워크 연결을 확인해 주세요.")
    ).toBeVisible()
    expect(screen.getByRole("button", { name: "이미지 업로드" })).toBeEnabled()
  })

  it("저장 409 뒤 generated editor read로 최신 충돌 문서를 제공한다", async () => {
    const user = userEvent.setup()
    const latest = createAdminCourseEditorFixture({
      editVersion: 2,
      title: "서버 최신 제목",
    })
    server.use(getGetAdminCourseEditorMockHandler200(latest))
    renderEditor({
      saveCourse: async () => ({
        error: {
          code: "CONTENT_CONFLICT",
          kind: "http",
          message: "편집 버전이 충돌했습니다.",
          requestId: "save-conflict",
          retryAfterSeconds: null,
          status: 409,
        },
        status: "error",
      }),
    })

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

function renderEditor({
  course = createAdminCourseEditorFixture(),
  saveCourse = async (document) => ok(document),
}: {
  readonly course?: AdminCourseEditorFixture
  readonly saveCourse?: (
    document: AdminCourseEditorFixture
  ) => Promise<AdminRequestResult<AdminCourseEditorFixture>>
} = {}): void {
  render(
    <CourseEditorShell
      course={course}
      publishCourse={async () =>
        ok({
          curriculumVersionId: course.curriculumVersionId,
          publishedAt: "2026-07-24T00:00:00.000Z",
          revision: course.revision,
        })
      }
      saveCourse={saveCourse}
    />
  )
}

async function selectCover(
  user: ReturnType<typeof userEvent.setup>,
  altText: string
): Promise<void> {
  // Vitest의 generated client는 Node FormData를 사용하므로 jsdom과 다른
  // realm의 File 대신 같은 runtime brand를 전달한다.
  fireEvent.change(screen.getByLabelText("이미지 파일"), {
    target: {
      files: [new NodeFile(["cover"], "cover.png", { type: "image/png" })],
    },
  })
  await user.type(screen.getByLabelText("대체 텍스트"), altText)
  await user.click(screen.getByRole("button", { name: "이미지 업로드" }))
}

function ok<TValue>(value: TValue): AdminRequestResult<TValue> {
  return { status: "ok", value }
}

function resolveBrowserRequestInput(
  input: RequestInfo | URL
): RequestInfo | URL {
  return typeof input === "string" && input.startsWith("/")
    ? new URL(input, "http://localhost")
    : input
}

function createGeneratedAdminErrorFixture(
  status: 409,
  overrides: Readonly<{ code: string; message: string }>
) {
  const fixture = createApiErrorFixture(status, overrides)
  return {
    code: fixture.code,
    message: fixture.message,
    requestId: fixture.requestId,
  }
}
