export function AdminHeader({
  description,
  title,
}: {
  readonly description: string
  readonly title: string
}) {
  return (
    <header className="admin-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="admin-header__session" title="현재 관리자 로그인 상태">
        <span aria-hidden="true" />
        관리자 세션
      </div>
    </header>
  )
}
