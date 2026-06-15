"use client"

import { Archive, Plus } from "lucide-react"
import { useState, useTransition } from "react"

import { AdminHeader } from "@/components/admin-header"
import type { AdminApiResult } from "@/lib/api/api-result"
import type {
  AdminCourseList,
  ReadAdminCoursesInput,
} from "@/lib/api/admin-api"
import type {
  AdminArchiveCourseResultDto,
  AdminCourseDetailDto,
} from "@workspace/core/admin"
import { contentStatuses } from "@workspace/core/status"

export function AdminCoursesPage({
  archiveCourse,
  coursesResult,
  createCourse,
  filters,
}: {
  readonly archiveCourse: (
    courseId: string
  ) => Promise<AdminApiResult<AdminArchiveCourseResultDto>>
  readonly coursesResult: AdminApiResult<AdminCourseList>
  readonly createCourse: () => Promise<AdminApiResult<AdminCourseDetailDto>>
  readonly filters: ReadAdminCoursesInput
}) {
  const [archiveTarget, setArchiveTarget] = useState<
    AdminCourseList["items"][number] | null
  >(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (coursesResult.status === "error") {
    return (
      <>
        <AdminHeader
          description="코스를 검색하고 새 강의를 생성하거나 보관합니다."
          title="콘텐츠 관리"
        />
        <section className="admin-alert" role="alert">
          {coursesResult.error.message}
        </section>
      </>
    )
  }

  const courses = coursesResult.value

  return (
    <>
      <AdminHeader
        description="코스를 검색하고 새 강의를 생성하거나 보관합니다."
        title="콘텐츠 관리"
      />
      <section className="admin-toolbar" aria-label="코스 필터">
        <label>
          <span>코스 검색</span>
          <input
            aria-label="코스 검색"
            defaultValue={filters.query}
            name="query"
            placeholder="제목 또는 설명 검색"
          />
        </label>
        <label>
          <span>카테고리</span>
          <select aria-label="카테고리" defaultValue={filters.category}>
            <option value="">전체</option>
            <option value="입문자를 위한 코스">입문자를 위한 코스</option>
            <option value="문법 심화">문법 심화</option>
            <option value="실전 글쓰기">실전 글쓰기</option>
            <option value="중급 글쓰기">중급 글쓰기</option>
            <option value="심화 글쓰기">심화 글쓰기</option>
            <option value="미분류">미분류</option>
          </select>
        </label>
        <label>
          <span>상태</span>
          <select aria-label="상태" defaultValue={filters.status}>
            <option value="all">전체</option>
            <option value="active">active</option>
            <option value="archived">archived</option>
          </select>
        </label>
        <label>
          <span>페이지 크기</span>
          <select aria-label="페이지 크기" defaultValue={filters.pageSize}>
            <option value={10}>10개</option>
            <option value={20}>20개</option>
            <option value={50}>50개</option>
          </select>
        </label>
        <button
          className="admin-primary-button"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              const result = await createCourse()
              setMessage(
                result.status === "ok"
                  ? "새 코스를 만들었습니다."
                  : result.error.message
              )
            })
          }}
          type="button"
        >
          <Plus aria-hidden="true" size={16} />새 코스
        </button>
      </section>
      {message === null ? null : (
        <p className="admin-inline-status" role="status">
          {message}
        </p>
      )}
      <section className="admin-panel">
        <div className="admin-section-heading">
          <h2>코스 목록</h2>
          <p>
            총 {courses.pagination.totalItems}개 · {courses.pagination.page}/
            {courses.pagination.totalPages} 페이지
          </p>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">코스</th>
                <th scope="col">카테고리</th>
                <th scope="col">구성</th>
                <th scope="col">상태</th>
                <th scope="col">작업</th>
              </tr>
            </thead>
            <tbody>
              {courses.items.map((course) => (
                <tr key={course.id}>
                  <td>
                    <a
                      className="admin-table__title"
                      href={`/courses/${course.id}`}
                    >
                      {course.title}
                    </a>
                    <span>revision {course.revision}</span>
                  </td>
                  <td>{course.category}</td>
                  <td>
                    {course.unitCount}개 유닛 · {course.lessonCount}개 레슨
                  </td>
                  <td>
                    <span className="admin-status-pill">{course.status}</span>
                  </td>
                  <td>
                    <button
                      className="admin-secondary-button"
                      disabled={
                        course.status === contentStatuses.archived || isPending
                      }
                      onClick={() => setArchiveTarget(course)}
                      type="button"
                    >
                      <Archive aria-hidden="true" size={15} />
                      보관
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {archiveTarget === null ? null : (
        <div
          aria-labelledby="archive-course-title"
          className="admin-dialog-backdrop"
          role="dialog"
        >
          <div className="admin-dialog">
            <h2 id="archive-course-title">코스 보관 확인</h2>
            <p>{archiveTarget.title} 코스를 학습자 화면에서 숨깁니다.</p>
            <div className="admin-dialog__actions">
              <button
                className="admin-secondary-button"
                onClick={() => setArchiveTarget(null)}
                type="button"
              >
                취소
              </button>
              <button
                className="admin-danger-button"
                disabled={isPending}
                onClick={() => {
                  const courseId = archiveTarget.id

                  startTransition(async () => {
                    const result = await archiveCourse(courseId)

                    setMessage(
                      result.status === "ok"
                        ? "코스를 보관했습니다."
                        : result.error.message
                    )
                    setArchiveTarget(null)
                  })
                }}
                type="button"
              >
                보관하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
