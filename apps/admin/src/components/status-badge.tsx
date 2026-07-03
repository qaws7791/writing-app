import { Badge } from "@workspace/ui/components/ui/badge"
import type {
  ContentStatus,
  LearnerAccountStatus,
} from "@workspace/contracts/status"

type StatusBadgeProps = {
  readonly status: ContentStatus | LearnerAccountStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge variant="secondary">{status}</Badge>
}
