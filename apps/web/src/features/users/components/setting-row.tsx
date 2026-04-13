import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"

export function SettingRow({
  icon,
  label,
  trailing,
  showChevron = true,
  onClick,
}: {
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"]
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
      <HugeiconsIcon
        icon={icon}
        size={20}
        color="currentColor"
        strokeWidth={1.5}
        className="shrink-0 text-foreground"
      />
      <span className="flex-1 text-base leading-6 font-medium text-foreground">
        {label}
      </span>
      {trailing}
      {showChevron && (
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={16}
          color="currentColor"
          strokeWidth={1.5}
          className="shrink-0 text-muted"
        />
      )}
    </button>
  )
}

export function Divider() {
  return <div className="mx-6 h-px bg-separator/80" />
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
      <p className="text-xs leading-5 font-semibold tracking-wide text-muted/80 uppercase">
        {title}
      </p>
      <div className="overflow-hidden rounded-[2rem] bg-surface-secondary">
        {children}
      </div>
    </section>
  )
}
