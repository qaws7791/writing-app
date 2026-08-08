export default function LearnerRouteGroupLoading() {
  return (
    <div
      aria-label="학습 화면을 불러오는 중"
      className="mx-auto w-full max-w-6xl px-5 py-8 md:px-10"
      role="status"
    >
      <div className="mb-8 h-10 w-52 animate-pulse rounded-2xl bg-muted" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-56 animate-pulse rounded-4xl bg-muted" />
        <div className="h-56 animate-pulse rounded-4xl bg-muted" />
      </div>
      <div className="mt-6 h-72 animate-pulse rounded-4xl bg-muted" />
    </div>
  )
}
