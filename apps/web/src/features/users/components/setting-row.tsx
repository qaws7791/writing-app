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
        className="shrink-0 text-on-surface"
      />
      <span className="flex-1 text-title-small text-on-surface">{label}</span>
      {trailing}
      {showChevron && (
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={16}
          color="currentColor"
          strokeWidth={1.5}
          className="shrink-0 text-on-surface-low"
        />
      )}
    </button>
  )
}

export function Divider() {
  return <div className="mx-6 h-px bg-outline/10" />
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
      <p className="text-label-medium-em text-on-surface-lowest uppercase">
        {title}
      </p>
      <div className="overflow-hidden rounded-[2rem] bg-surface-container">
        {children}
      </div>
    </section>
  )
}
