export default function WritingHomeLoading() {
  return (
    <div
      aria-label="쓰기를 불러오는 중"
      className="@container flex w-full max-w-2xl flex-col gap-10"
      role="status"
    >
      <div className="flex items-end justify-between gap-4">
        <div className="h-10 w-36 animate-pulse rounded-2xl bg-muted" />
        <div className="h-9 w-32 animate-pulse rounded-2xl bg-muted" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 px-1">
          <div className="h-4 w-40 animate-pulse rounded-full bg-muted" />
          <div className="h-7 w-3/4 animate-pulse rounded-2xl bg-muted" />
        </div>
        <div className="h-36 animate-pulse rounded-[1.75rem] bg-muted" />
        <div className="h-36 animate-pulse rounded-[1.75rem] bg-muted" />
      </div>
    </div>
  )
}
