export default function AdminAnalyticsLoading() {
  return (
    <div aria-label="분석 화면을 불러오는 중" className="w-full" role="status">
      <div className="mb-8 h-10 w-48 animate-pulse rounded-2xl bg-muted" />
      <div className="grid gap-4 xl:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div className="h-96 animate-pulse rounded-4xl bg-muted" key={item} />
        ))}
      </div>
      <div className="mt-4 h-96 animate-pulse rounded-4xl bg-muted" />
      <span className="sr-only">
        분석 지표와 레슨별 성과를 준비하고 있습니다.
      </span>
    </div>
  )
}
