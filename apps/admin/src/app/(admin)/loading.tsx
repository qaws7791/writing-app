export default function AdminRouteGroupLoading() {
  return (
    <div
      aria-label="관리자 화면을 불러오는 중"
      className="w-full"
      role="status"
    >
      <div className="mb-8 h-10 w-48 animate-pulse rounded-2xl bg-surface" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            className="h-32 animate-pulse rounded-panel bg-surface"
            key={item}
          />
        ))}
      </div>
      <div className="mt-6 h-80 animate-pulse rounded-panel bg-surface" />
    </div>
  )
}
