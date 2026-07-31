// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AdminCoursesPage } from "@/features/course-catalog/ui/admin-courses-page"
import type {
  AdminArchiveCourseResult,
  AdminCreatedCourse,
  AdminCourseList,
  AdminRestoreCourseResult,
  ReadAdminCoursesInput,
} from "@/features/course-catalog/model/admin-course-catalog"
import type {
  AdminRequestError,
  AdminRequestResult,
} from "@/shared/http/admin-api-client"

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}))

const filters: ReadAdminCoursesInput = {
  category: "",
  page: 1,
  pageSize: 20,
  query: "",
  status: "all",
}

const courses: AdminCourseList = {
  items: [
    {
      category: "입문자를 위한 코스",
      cover: null,
      id: "c1",
      lessonCount: 10,
      revision: 2,
      status: "active",
      title: "글쓰기 첫걸음 30일",
      unitCount: 3,
      visualKey: "basic-sentence-writing",
    },
    {
      category: "문법 심화",
      cover: null,
      id: "c2",
      lessonCount: 8,
      revision: 1,
      status: "archived",
      title: "문장의 기본 문법",
      unitCount: 3,
      visualKey: "grammar-complete",
    },
  ],
  pagination: {
    page: 1,
    pageSize: 20,
    totalItems: 2,
    totalPages: 1,
  },
}

describe("AdminCoursesPage", () => {
  it("보관 확인 대화상자를 확인하면 해당 코스를 보관하고 결과를 알린다", async () => {
    const user = userEvent.setup()
    const archiveCourse = vi.fn<
      () => Promise<AdminRequestResult<AdminArchiveCourseResult>>
    >(async () => ok({ archived: true }))

    renderCoursesPage({ archiveCourse })

    const activeRow = screen.getByRole("row", { name: /글쓰기 첫걸음 30일/ })
    await user.click(
      within(activeRow).getByRole("button", { name: "글쓰기 첫걸음 30일 보관" })
    )
    await user.click(
      within(readArchiveDialog()).getByRole("button", { name: "보관하기" })
    )

    expect(archiveCourse).toHaveBeenCalledWith("c1")
    expect(screen.getByText("코스를 보관했습니다.")).toBeVisible()
  })

  it("상태 필터를 바꾸면 같은 이동 URL에서 page를 1로 되돌린다", async () => {
    const user = userEvent.setup()

    renderCoursesPage({ filters: { ...filters, page: 3 } })
    await user.click(screen.getByRole("combobox", { name: "상태" }))
    await user.click(await screen.findByRole("option", { name: "활성" }))

    const [href] = pushMock.mock.calls.at(-1) ?? []
    expect(href).toContain("status=active")
    expect(href).toContain("page=1")
  })

  it("새 코스 생성 결과를 알려준다", async () => {
    const user = userEvent.setup()
    const createCourse = vi.fn<
      () => Promise<AdminRequestResult<AdminCreatedCourse>>
    >(async () => ok(courseDetail("new-course")))

    renderCoursesPage({ createCourse })

    await user.click(screen.getByRole("button", { name: "새 강의" }))

    expect(createCourse).toHaveBeenCalled()
    expect(screen.getByText("새 코스를 만들었습니다.")).toBeVisible()
  })

  it("API 오류 상태를 보여준다", () => {
    renderCoursesPage({
      coursesResult: { error: networkError(), status: "error" },
    })

    expect(screen.getByText("네트워크 연결을 확인해 주세요.")).toBeVisible()
  })

  it("보관된 코스는 확인 없이 보관 해제만 제공한다", async () => {
    const user = userEvent.setup()
    const restoreCourse = vi.fn<
      () => Promise<AdminRequestResult<AdminRestoreCourseResult>>
    >(async () => ok({ restored: true }))

    renderCoursesPage({ restoreCourse })

    const archivedRow = screen.getByRole("row", { name: /문장의 기본 문법/ })
    expect(
      within(archivedRow).queryByRole("button", { name: /보관$/ })
    ).not.toBeInTheDocument()
    await user.click(
      within(archivedRow).getByRole("button", {
        name: "문장의 기본 문법 보관 해제",
      })
    )

    expect(restoreCourse).toHaveBeenCalledWith("c2")
    expect(screen.getByText("코스 보관을 해제했습니다.")).toBeVisible()
  })
})

function renderCoursesPage({
  archiveCourse = async () => ok({ archived: true }),
  coursesResult = ok(courses),
  createCourse = async () => ok(courseDetail("new-course")),
  filters: pageFilters = filters,
  restoreCourse = async () => ok({ restored: true }),
}: {
  readonly archiveCourse?: () => Promise<
    AdminRequestResult<AdminArchiveCourseResult>
  >
  readonly coursesResult?: AdminRequestResult<AdminCourseList>
  readonly createCourse?: () => Promise<AdminRequestResult<AdminCreatedCourse>>
  readonly filters?: ReadAdminCoursesInput
  readonly restoreCourse?: () => Promise<
    AdminRequestResult<AdminRestoreCourseResult>
  >
} = {}) {
  return render(
    <AdminCoursesPage
      archiveCourse={archiveCourse}
      coursesResult={coursesResult}
      createCourse={createCourse}
      filters={pageFilters}
      restoreCourse={restoreCourse}
    />
  )
}

function readArchiveDialog(): HTMLElement {
  return screen.getByRole("alertdialog", { name: "코스 보관 확인" })
}

function ok<TValue>(value: TValue): AdminRequestResult<TValue> {
  return {
    status: "ok",
    value,
  }
}

function networkError(): AdminRequestError {
  return {
    code: "NETWORK_ERROR",
    kind: "network",
    message: "네트워크 연결을 확인해 주세요.",
    requestId: "client",
    retryAfterSeconds: null,
    status: null,
  }
}

function courseDetail(id: string): AdminCreatedCourse {
  return {
    category: "미분류",
    curriculumVersionId: `${id}-v1`,
    description: "강의 설명",
    editVersion: 0,
    id,
    revision: 1,
    status: "active",
    title: "새 강의",
    units: [],
  }
}
