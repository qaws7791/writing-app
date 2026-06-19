"use client"

import { useState, useTransition } from "react"

import { AdminHeader } from "@/components/admin-header"
import type { AdminApiResult } from "@/lib/api/api-result"
import type { ReadAdminUsersInput } from "@/lib/api/admin-api"
import type {
  AdminDeleteUserResultDto,
  AdminUserDetailDto,
  AdminUserListDto,
} from "@workspace/contracts/admin"
import {
  learnerAccountStatuses,
  type LearnerOperationalStatus,
} from "@workspace/contracts/status"

export function AdminUsersPage({
  deleteUser,
  filters,
  updateUserStatus,
  usersResult,
}: {
  readonly deleteUser: (
    userId: string
  ) => Promise<AdminApiResult<AdminDeleteUserResultDto>>
  readonly filters: ReadAdminUsersInput
  readonly updateUserStatus: (input: {
    readonly status: LearnerOperationalStatus
    readonly userId: string
  }) => Promise<AdminApiResult<AdminUserDetailDto>>
  readonly usersResult: AdminApiResult<AdminUserListDto>
}) {
  const [deleteTarget, setDeleteTarget] = useState<
    AdminUserListDto["items"][number] | null
  >(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (usersResult.status === "error") {
    return (
      <>
        <AdminHeader
          description="학습자 상태와 진행 현황을 관리합니다."
          title="사용자 관리"
        />
        <section className="admin-alert" role="alert">
          {usersResult.error.message}
        </section>
      </>
    )
  }

  return (
    <>
      <AdminHeader
        description="학습자 상태와 진행 현황을 관리합니다."
        title="사용자 관리"
      />
      <section className="admin-toolbar" aria-label="사용자 필터">
        <label>
          <span>사용자 검색</span>
          <input
            aria-label="사용자 검색"
            defaultValue={filters.query}
            placeholder="이름 또는 이메일"
          />
        </label>
        <label>
          <span>상태</span>
          <select aria-label="상태" defaultValue={filters.status}>
            <option value="all">전체</option>
            <option value="active">active</option>
            <option value="suspended">suspended</option>
            <option value="deleted">deleted</option>
          </select>
        </label>
        <label>
          <span>정렬</span>
          <select aria-label="정렬" defaultValue={filters.sort}>
            <option value="lastActive">최근 접속</option>
            <option value="joined">가입일</option>
            <option value="lessonsDone">완료 레슨</option>
            <option value="streak">연속 학습일</option>
          </select>
        </label>
      </section>
      {message === null ? null : (
        <p className="admin-inline-status" role="status">
          {message}
        </p>
      )}
      <section className="admin-panel">
        <div className="admin-section-heading">
          <h2>사용자 목록</h2>
          <p>
            총 {usersResult.value.pagination.totalItems}명 ·{" "}
            {usersResult.value.pagination.page}/
            {usersResult.value.pagination.totalPages} 페이지
          </p>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">사용자</th>
                <th scope="col">상태</th>
                <th scope="col">최근 접속</th>
                <th scope="col">완료</th>
                <th scope="col">연속</th>
                <th scope="col">작업</th>
              </tr>
            </thead>
            <tbody>
              {usersResult.value.items.map((user) => (
                <tr key={user.id}>
                  <td>
                    <a
                      className="admin-table__title"
                      href={`/users/${user.id}`}
                    >
                      {user.name}
                    </a>
                    <span>{user.email}</span>
                  </td>
                  <td>
                    <span className="admin-status-pill">{user.status}</span>
                  </td>
                  <td>{user.lastActive ?? "없음"}</td>
                  <td>{user.lessonsDone}개 완료</td>
                  <td>{user.streak}일</td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        className="admin-secondary-button"
                        disabled={
                          isPending ||
                          user.status === learnerAccountStatuses.suspended
                        }
                        onClick={() => {
                          startTransition(async () => {
                            const result = await updateUserStatus({
                              status: learnerAccountStatuses.suspended,
                              userId: user.id,
                            })

                            setMessage(
                              result.status === "ok"
                                ? "사용자 상태를 변경했습니다."
                                : result.error.message
                            )
                          })
                        }}
                        type="button"
                      >
                        정지
                      </button>
                      <button
                        className="admin-danger-button"
                        disabled={isPending}
                        onClick={() => setDeleteTarget(user)}
                        type="button"
                      >
                        삭제 요청
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {deleteTarget === null ? null : (
        <div
          aria-labelledby="delete-user-title"
          className="admin-dialog-backdrop"
          role="dialog"
        >
          <div className="admin-dialog">
            <h2 id="delete-user-title">삭제 요청 처리 확인</h2>
            <p>{deleteTarget.email} 계정을 삭제 상태로 전환합니다.</p>
            <div className="admin-dialog__actions">
              <button
                className="admin-secondary-button"
                onClick={() => setDeleteTarget(null)}
                type="button"
              >
                취소
              </button>
              <button
                className="admin-danger-button"
                disabled={isPending}
                onClick={() => {
                  const userId = deleteTarget.id

                  startTransition(async () => {
                    const result = await deleteUser(userId)

                    setMessage(
                      result.status === "ok"
                        ? "삭제 요청을 처리했습니다."
                        : result.error.message
                    )
                    setDeleteTarget(null)
                  })
                }}
                type="button"
              >
                삭제 처리
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
