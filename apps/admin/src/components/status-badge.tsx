import {
  contentStatuses,
  learnerAccountStatuses,
  type ContentStatus,
  type LearnerAccountStatus,
} from "@workspace/contracts/status"
import { Ban } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

type StatusBadgeProps = {
  readonly status: ContentStatus | LearnerAccountStatus
}

type StatusPresentation = {
  readonly className: string
  readonly label: string
  readonly showBanIcon: boolean
}

const activePresentation: StatusPresentation = {
  className: "bg-mint-light text-mint-dark",
  label: "활성",
  showBanIcon: false,
}

const statusPresentation: Record<
  Exclude<ContentStatus | LearnerAccountStatus, "active">,
  StatusPresentation
> = {
  [contentStatuses.archived]: {
    className: "bg-surface text-muted-foreground",
    label: "보관",
    showBanIcon: false,
  },
  [learnerAccountStatuses.suspended]: {
    className: "bg-coral-light text-coral-dark",
    label: "정지",
    showBanIcon: true,
  },
  [learnerAccountStatuses.deleted]: {
    className: "bg-coral-light text-coral-dark",
    label: "삭제",
    showBanIcon: false,
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const presentation =
    status === contentStatuses.active
      ? activePresentation
      : statusPresentation[status]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.75rem] font-bold",
        presentation.className
      )}
    >
      {presentation.showBanIcon ? <Ban aria-hidden="true" size={12} /> : null}
      {presentation.label}
    </span>
  )
}
