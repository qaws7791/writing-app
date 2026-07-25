import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AdminCoursesPage } from "@/features/course-catalog/ui/admin-courses-page"
import type {
  AdminArchiveCourseResult,
  AdminCreatedCourse,
  AdminCourseList,
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
  it("코스 검색, 필터, 페이지 크기, 목록과 보관 대화상자를 렌더링한다", async () => {
    const user = userEvent.setup()
    const archiveCourse = vi.fn<
      () => Promise<AdminRequestResult<AdminArchiveCourseResult>>
    >(async () => ({
      status: "ok",
      value: {
        archived: true,
      },
    }))

    render(
      <AdminCoursesPage
        archiveCourse={archiveCourse}
        coursesResult={ok(courses)}
        createCourse={async () => ok(courseDetail("new-course"))}
        filters={filters}
      />
    )

    const activeRow = screen.getByRole("row", {
      name: /글쓰기 첫걸음 30일/,
    })
    await user.click(within(activeRow).getByRole("button", { name: "보관" }))
    expect(
      screen.getByRole("alertdialog", { name: "코스 보관 확인" })
    ).toBeVisible()
    await user.click(screen.getByRole("button", { name: "보관하기" }))

    expect(archiveCourse).toHaveBeenCalledWith("c1")
    expect(screen.getByText("코스를 보관했습니다.")).toBeVisible()

    await user.click(screen.getByRole("combobox", { name: "상태" }))
    await user.click(await screen.findByRole("option", { name: "활성" }))
    expect(pushMock).toHaveBeenCalledWith(
      expect.stringContaining("status=active")
    )
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining("page=1"))
  }, 15_000)

  it("새 코스 생성 결과를 알려준다", async () => {
    const user = userEvent.setup()
    const createCourse = vi.fn<
      () => Promise<AdminRequestResult<AdminCreatedCourse>>
    >(async () => ok(courseDetail("new-course")))

    render(
      <AdminCoursesPage
        archiveCourse={async () => ok({ archived: true })}
        coursesResult={ok(courses)}
        createCourse={createCourse}
        filters={filters}
      />
    )

    await user.click(screen.getByRole("button", { name: "새 강의" }))

    expect(createCourse).toHaveBeenCalled()
    expect(screen.getByText("새 코스를 만들었습니다.")).toBeVisible()
  })

  it("API 오류 상태를 보여준다", () => {
    render(
      <AdminCoursesPage
        archiveCourse={async () => ok({ archived: true })}
        coursesResult={{
          error: networkError(),
          status: "error",
        }}
        createCourse={async () => ok(courseDetail("new-course"))}
        filters={filters}
      />
    )

    expect(screen.getByText("네트워크 연결을 확인해 주세요.")).toBeVisible()
  })
})

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
