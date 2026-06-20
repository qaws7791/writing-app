import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AdminCoursesPage } from "@/features/courses/admin-courses-page"
import type {
  AdminArchiveCourseResult,
  AdminCourseDetail,
  AdminCourseList,
  ReadAdminCoursesInput,
} from "@/lib/api/admin-api"
import { networkAdminApiError } from "@/lib/api/api-error"
import type { AdminApiResult } from "@/lib/api/api-result"
import { createHttpNetworkError } from "@workspace/http-client"

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
    },
    {
      category: "문법 심화",
      id: "c2",
      lessonCount: 8,
      revision: 1,
      status: "archived",
      title: "문장의 기본 문법",
      unitCount: 3,
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
      () => Promise<AdminApiResult<AdminArchiveCourseResult>>
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

    expect(screen.getByRole("heading", { name: "콘텐츠 관리" })).toBeVisible()
    expect(screen.getByLabelText("코스 검색")).toHaveValue("")
    expect(screen.getByLabelText("카테고리")).toHaveDisplayValue("전체")
    expect(screen.getByLabelText("상태")).toHaveDisplayValue("전체")
    expect(screen.getByLabelText("페이지 크기")).toHaveDisplayValue("20개")
    expect(screen.getByRole("button", { name: "필터 적용" })).toHaveAttribute(
      "type",
      "submit"
    )
    expect(screen.getByLabelText("코스 검색")).toHaveAttribute("name", "query")
    expect(screen.getByLabelText("카테고리")).toHaveAttribute(
      "name",
      "category"
    )
    expect(screen.getByLabelText("상태")).toHaveAttribute("name", "status")
    expect(screen.getByLabelText("페이지 크기")).toHaveAttribute(
      "name",
      "pageSize"
    )

    const activeRow = screen.getByRole("row", {
      name: /글쓰기 첫걸음 30일/,
    })
    expect(within(activeRow).getByText("입문자를 위한 코스")).toBeVisible()
    expect(within(activeRow).getByText("3개 유닛 · 10개 레슨")).toBeVisible()
    expect(within(activeRow).getByText("active")).toBeVisible()

    await user.click(within(activeRow).getByRole("button", { name: "보관" }))
    expect(screen.getByRole("dialog", { name: "코스 보관 확인" })).toBeVisible()
    await user.click(screen.getByRole("button", { name: "보관하기" }))

    expect(archiveCourse).toHaveBeenCalledWith("c1")
    expect(screen.getByText("코스를 보관했습니다.")).toBeVisible()
  })

  it("새 코스 생성 결과를 알려준다", async () => {
    const user = userEvent.setup()
    const createCourse = vi.fn<
      () => Promise<AdminApiResult<AdminCourseDetail>>
    >(async () => ok(courseDetail("new-course")))

    render(
      <AdminCoursesPage
        archiveCourse={async () => ok({ archived: true })}
        coursesResult={ok(courses)}
        createCourse={createCourse}
        filters={filters}
      />
    )

    await user.click(screen.getByRole("button", { name: "새 코스" }))

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

function ok<TValue>(value: TValue): AdminApiResult<TValue> {
  return {
    status: "ok",
    value,
  }
}

function networkError() {
  return networkAdminApiError(
    createHttpNetworkError(
      new Request("https://admin-api.example.test/test"),
      new TypeError("test network failure")
    )
  )
}

function courseDetail(id: string): AdminCourseDetail {
  return {
    category: "미분류",
    description: "강의 설명",
    id,
    revision: 1,
    status: "active",
    title: "새 강의",
    units: [],
  }
}
