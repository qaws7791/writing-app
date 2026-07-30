import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"
import { setupServer } from "msw/node"

import {
  getCreateLearnerStepAiFeedbackMockHandler429,
  getCreateLearnerStepAiFeedbackMockHandler500,
  getGetCoursesMockHandler,
  getGetCoursesMockHandler401,
  getGetLessonMockHandler200,
  getSaveLearnerStepDraftMockHandler409,
} from "@workspace/http-client/learner/msw"
import {
  createApiErrorFixture,
  throwMswNetworkErrorFixture,
} from "@workspace/http-client/msw-fixtures"

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh,
    replace: vi.fn(),
  }),
}))

import { CoursesPage } from "@/features/course-catalog/ui/courses-page"
import { LessonExperience } from "@/features/lesson-session/ui/lesson-experience"
import {
  learnerAiLessonFixture,
  learnerConflictingWriteLessonWireFixture,
  learnerCourseSummaryFixture,
  learnerWriteLessonFixture,
} from "@/test/learner-api-fixtures"

const server = setupServer()
const nativeRequest = globalThis.Request

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" })
})

beforeEach(() => {
  // jsdom의 상대 URL 요청을 MSW가 가로챌 수 있도록 origin을 채운다.
  // config의 unstubGlobals가 테스트마다 stub을 되돌리므로 여기서 다시 세운다.
  vi.stubGlobal(
    "Request",
    class BrowserRequest extends nativeRequest {
      constructor(input: RequestInfo | URL, init?: RequestInit) {
        super(resolveBrowserRequestInput(input), init)
      }
    }
  )
  refresh.mockReset()
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

describe("generated learner client UI integration", () => {
  it("generated 401 handler를 보호 route refresh로 연결한다", async () => {
    const user = userEvent.setup()
    server.use(
      getGetCoursesMockHandler401(
        createGeneratedLearnerErrorFixture(401, {
          code: "UNAUTHENTICATED",
          message: "로그인이 필요합니다.",
        })
      )
    )
    renderCoursePagination()

    await user.click(screen.getByRole("button", { name: "코스 더 보기" }))

    await waitFor(() => expect(refresh).toHaveBeenCalledOnce())
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("generated handler의 network 실패를 재시도 가능한 inline 오류로 보여준다", async () => {
    const user = userEvent.setup()
    server.use(getGetCoursesMockHandler(() => throwMswNetworkErrorFixture()))
    renderCoursePagination()

    await user.click(screen.getByRole("button", { name: "코스 더 보기" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "API에 연결할 수 없습니다."
    )
    expect(screen.getByRole("button", { name: "코스 더 보기" })).toBeEnabled()
  })

  it("generated 409 handler를 서버 draft 충돌 해결 UI로 연결한다", async () => {
    const user = userEvent.setup()
    server.use(
      getSaveLearnerStepDraftMockHandler409(
        createGeneratedLearnerErrorFixture(409, {
          code: "STEP_DRAFT_VERSION_CONFLICT",
          message: "초안 버전이 충돌했습니다.",
        })
      ),
      getGetLessonMockHandler200(learnerConflictingWriteLessonWireFixture)
    )
    render(<LessonExperience lesson={learnerWriteLessonFixture} />)

    const draftInput = screen.getByRole("textbox")
    await user.click(draftInput)
    await user.type(draftInput, " 현재 탭의 수정")
    await user.tab()

    expect(
      await screen.findByRole("group", { name: "초안 충돌 해결" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "현재 내용 다시 저장" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "서버 초안 불러오기" })
    ).toBeInTheDocument()
  })

  it("generated 429 handler를 AI 일일 quota UI로 연결한다", async () => {
    const user = userEvent.setup()
    server.use(
      getCreateLearnerStepAiFeedbackMockHandler429(
        createGeneratedLearnerErrorFixture(429, {
          code: "AI_FEEDBACK_DAILY_QUOTA_EXCEEDED",
          message: "오늘의 AI 코칭 한도를 모두 사용했습니다.",
        })
      )
    )
    render(<LessonExperience lesson={learnerAiLessonFixture} />)

    await user.click(screen.getByRole("button", { name: "AI 코칭 받기" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "오늘의 AI 코칭 요청 한도를 모두 사용했습니다."
    )
    expect(
      screen.getByRole("button", { name: "피드백 없이 계속하기" })
    ).toBeInTheDocument()
  })

  it("generated 500 handler를 AI fatal fallback UI로 연결한다", async () => {
    const user = userEvent.setup()
    server.use(
      getCreateLearnerStepAiFeedbackMockHandler500(
        createGeneratedLearnerErrorFixture(500, {
          code: "AI_FEEDBACK_FAILED",
          message: "AI 코칭 처리에 실패했습니다.",
        })
      )
    )
    render(<LessonExperience lesson={learnerAiLessonFixture} />)

    await user.click(screen.getByRole("button", { name: "AI 코칭 받기" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "AI 코칭 요청을 완료하지 못했습니다."
    )
    expect(screen.getByRole("alert")).toHaveTextContent(
      "AI 코칭 처리에 실패했습니다."
    )
  })
})

function renderCoursePagination(): void {
  render(
    <CoursesPage
      categories={[]}
      courses={[learnerCourseSummaryFixture]}
      filters={{ category: "" }}
      nextCursor="next-page"
    />
  )
}

function resolveBrowserRequestInput(
  input: RequestInfo | URL
): RequestInfo | URL {
  return typeof input === "string" && input.startsWith("/")
    ? new URL(input, "http://localhost")
    : input
}

function createGeneratedLearnerErrorFixture(
  status: 401 | 409 | 429 | 500,
  overrides: Readonly<{ code: string; message: string }>
) {
  const fixture = createApiErrorFixture(status, overrides)
  return {
    code: fixture.code,
    message: fixture.message,
    requestId: fixture.requestId,
  }
}
