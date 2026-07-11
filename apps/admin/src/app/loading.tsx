export default function AdminAppLoading() {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-background"
      role="status"
    >
      <span
        aria-hidden="true"
        className="size-5 animate-spin rounded-full border-2 border-muted-foreground border-r-transparent"
      />
      <span className="ml-2 text-sm font-bold text-muted-foreground">
        관리자 앱을 불러오는 중입니다.
      </span>
    </main>
  )
}
