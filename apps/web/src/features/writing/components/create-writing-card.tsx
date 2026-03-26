import { PencilEdit02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

type CreateWritingCardProps = {
  isPending: boolean
  onCreateWriting: () => void
}

export function CreateWritingCard({
  isPending,
  onCreateWriting,
}: CreateWritingCardProps) {
  return (
    <button
      type="button"
      onClick={onCreateWriting}
      disabled={isPending}
      className="group relative flex w-full items-center justify-between overflow-hidden rounded-2xl border border-border bg-card px-7 py-8 shadow-sm transition-all hover:border-foreground/15 hover:shadow-md disabled:opacity-60 md:px-10 md:py-10"
    >
      <div className="pointer-events-none absolute -right-8 -bottom-8 size-40 rounded-full bg-muted/70 transition-transform group-hover:scale-110" />
      <div className="pointer-events-none absolute top-4 -right-2 size-16 rounded-full bg-muted/40" />

      <div className="relative z-10 flex flex-col gap-2">
        <span className="text-xl font-semibold tracking-tight text-foreground">
          {isPending ? "새 글 생성 중…" : "새 글 시작"}
        </span>
        <span className="text-sm font-medium text-muted-foreground">
          설정 없이 바로 첫 문장을 쓸 수 있습니다
        </span>
      </div>

      <div className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-105">
        <HugeiconsIcon
          icon={PencilEdit02Icon}
          size={20}
          color="currentColor"
          strokeWidth={2}
        />
      </div>
    </button>
  )
}
