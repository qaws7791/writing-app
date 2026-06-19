import { AdminHeader } from "@/components/admin-header"
import type { AdminApiResult } from "@/lib/api/api-result"
import type { AdminUserDetailDto } from "@workspace/contracts/admin"

export function AdminUserDetailPage({
  userResult,
}: {
  readonly userResult: AdminApiResult<AdminUserDetailDto>
}) {
  if (userResult.status === "error") {
    return (
      <>
        <AdminHeader
          description="사용자의 학습 상태와 계정 상태를 확인합니다."
          title="사용자 상세"
        />
        <section className="admin-alert" role="alert">
          {userResult.error.message}
        </section>
      </>
    )
  }

  const user = userResult.value

  return (
    <>
      <AdminHeader
        description="사용자의 학습 상태와 계정 상태를 확인합니다."
        title="사용자 상세"
      />
      <section className="admin-panel user-detail-panel">
        <div>
          <strong>{user.name}</strong>
          <span>{user.email}</span>
          <small>{user.status}</small>
        </div>
        <dl>
          <div>
            <dt>가입일</dt>
            <dd>{user.joined}</dd>
          </div>
          <div>
            <dt>최근 접속</dt>
            <dd>{user.lastActive ?? "없음"}</dd>
          </div>
          <div>
            <dt>완료 레슨</dt>
            <dd>
              {user.lessonsDone} / {user.totalLessons}
            </dd>
          </div>
          <div>
            <dt>전체 진도</dt>
            <dd>{user.progressPercent}%</dd>
          </div>
          <div>
            <dt>연속 학습일</dt>
            <dd>{user.streak}일 연속</dd>
          </div>
        </dl>
      </section>
    </>
  )
}
