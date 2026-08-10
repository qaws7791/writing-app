export function HomeCourseMark({ label }: { readonly label: string }) {
  return (
    <div
      aria-hidden="true"
      className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-muted @[32rem]:size-24"
    >
      <span className="absolute inset-3 rounded-2xl border border-border/60" />
      <span className="absolute top-5 left-5 size-2.5 rounded-full bg-foreground/25" />
      <span className="absolute right-6 bottom-6 size-3 rounded-md bg-foreground/15" />
      <span className="absolute top-1/2 left-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-dashed border-foreground/20" />
      <span className="relative z-10 text-[0.65rem] font-medium tracking-[0.06em] text-muted-foreground uppercase">
        {label.slice(0, 2)}
      </span>
    </div>
  )
}
