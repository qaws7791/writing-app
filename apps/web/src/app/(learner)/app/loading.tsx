export default function LearnerAppHomeLoading() {
  return (
    <div
      aria-label="홈을 불러오는 중"
      className="@container w-full"
      role="status"
    >
      <div className="grid w-full grid-cols-1 gap-10 @[48rem]:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] @[48rem]:items-start @[48rem]:gap-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <div className="h-4 w-16 animate-pulse rounded-full bg-muted" />
            <div className="h-10 w-4/5 max-w-sm animate-pulse rounded-2xl bg-muted" />
          </div>
          <div className="flex flex-col gap-3 @[32rem]:flex-row">
            <div className="h-16 min-w-0 flex-1 animate-pulse rounded-3xl bg-muted" />
            <div className="h-16 min-w-0 flex-1 animate-pulse rounded-3xl bg-muted" />
          </div>
          <div className="h-24 animate-pulse rounded-3xl bg-muted" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="h-7 w-36 animate-pulse rounded-full bg-muted" />
            <div className="h-9 w-40 animate-pulse rounded-2xl bg-muted" />
          </div>
          <div className="h-40 animate-pulse rounded-[1.75rem] bg-muted" />
          <div className="h-40 animate-pulse rounded-[1.75rem] bg-muted" />
        </div>
      </div>
    </div>
  )
}
