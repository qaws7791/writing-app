import type { LucideIcon } from "lucide-react"
import { ChevronRight } from "lucide-react"

export function SettingRow({
  icon: Icon,
  label,
  trailing,
  showChevron = true,
  onClick,
}: {
  icon: LucideIcon
  label: string
  trailing?: React.ReactNode
  showChevron?: boolean
  onClick?: () => void
}) {
  return (
    <button
      className="flex w-full items-center gap-4 px-6 py-5 text-left"
      onClick={onClick}
    >
      <Icon size={20} strokeWidth={1.5} className="shrink-0 text-foreground" />
      <span className="flex-1 text-base leading-6 font-medium text-foreground">
        {label}
      </span>
      {trailing}
      {showChevron && (
        <ChevronRight
          size={16}
          strokeWidth={1.5}
          className="shrink-0 text-muted-foreground"
        />
      )}
    </button>
  )
}

export function Divider() {
  return <div className="mx-6 h-px bg-border/80" />
}

export function SettingSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <p className="text-xs leading-5 font-semibold tracking-wide text-muted-foreground/80 uppercase">
        {title}
      </p>
      <div className="overflow-hidden rounded-[2rem] bg-muted">{children}</div>
    </section>
  )
}
