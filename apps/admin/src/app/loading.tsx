import { Spinner } from "@workspace/ui/components/ui/spinner"

export default function AdminAppLoading() {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-background"
      role="status"
    >
      <Spinner aria-hidden="true" />
      <span className="ml-2 text-sm font-bold text-muted-foreground">
        관리자 앱을 불러오는 중입니다.
      </span>
    </main>
  )
}
