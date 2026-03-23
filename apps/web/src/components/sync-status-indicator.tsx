"use client"

import {
  CloudIcon,
  CloudUploadIcon,
  Alert02Icon,
  WifiDisconnected02Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import type { SyncStatus } from "@/hooks/use-sync-engine"

const statusConfig: Record<
  SyncStatus,
  {
    icon: typeof CloudIcon
    label: string
    className: string
    animate?: boolean
  }
> = {
  idle: {
    icon: CloudIcon,
    label: "저장됨",
    className: "text-success",
  },
  debouncing: {
    icon: CloudUploadIcon,
    label: "저장 중…",
    className: "text-muted-foreground",
  },
  syncing: {
    icon: Loading03Icon,
    label: "동기화 중…",
    className: "text-muted-foreground",
    animate: true,
  },
  retrying: {
    icon: Loading03Icon,
    label: "재시도 중…",
    className: "text-warning",
    animate: true,
  },
  resolving: {
    icon: Alert02Icon,
    label: "충돌 해결 중",
    className: "text-warning",
  },
  error: {
    icon: WifiDisconnected02Icon,
    label: "동기화 실패",
    className: "text-destructive",
  },
}

type SyncStatusIndicatorProps = {
  status: SyncStatus
}

export function SyncStatusIndicator({ status }: SyncStatusIndicatorProps) {
  const config = statusConfig[status]

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={`inline-flex items-center gap-1.5 text-xs ${config.className}`}
            aria-label={config.label}
          />
        }
      >
        <HugeiconsIcon
          icon={config.icon}
          size={14}
          color="currentColor"
          strokeWidth={2}
          className={config.animate ? "animate-spin" : undefined}
        />
        <span className="hidden sm:inline">{config.label}</span>
      </TooltipTrigger>
      <TooltipContent>{config.label}</TooltipContent>
    </Tooltip>
  )
}
