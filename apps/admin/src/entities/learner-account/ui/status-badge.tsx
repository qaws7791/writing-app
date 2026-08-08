import {
  contentStatuses,
  type ContentStatus,
} from "@workspace/contracts/content/status"
import {
  learnerAccountStatuses,
  type LearnerAccountStatus,
} from "@workspace/contracts/identity/status"
import { BanIcon as Ban } from "@workspace/ui/components/icons"
import { Badge } from "@workspace/ui/components/ui/badge"

type StatusBadgeProps = {
  readonly status: ContentStatus | LearnerAccountStatus
}

type StatusPresentation = {
  readonly label: string
  readonly showBanIcon: boolean
  readonly variant: "destructive" | "secondary" | "success"
}

const activePresentation: StatusPresentation = {
  label: "활성",
  showBanIcon: false,
  variant: "success",
}

const statusPresentation: Record<
  Exclude<ContentStatus | LearnerAccountStatus, "active">,
  StatusPresentation
> = {
  [contentStatuses.archived]: {
    label: "보관",
    showBanIcon: false,
    variant: "secondary",
  },
  [learnerAccountStatuses.suspended]: {
    label: "정지",
    showBanIcon: true,
    variant: "destructive",
  },
  [learnerAccountStatuses.deleted]: {
    label: "삭제",
    showBanIcon: false,
    variant: "destructive",
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const presentation =
    status === contentStatuses.active
      ? activePresentation
      : statusPresentation[status]

  return (
    <Badge variant={presentation.variant}>
      {presentation.showBanIcon ? <Ban aria-hidden="true" size={12} /> : null}
      {presentation.label}
    </Badge>
  )
}
