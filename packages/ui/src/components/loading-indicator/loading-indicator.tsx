"use client"

import { cn } from "@workspace/ui/lib/utils"

export interface LoadingIndicatorProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

function LoadingIndicator({ size = "md", className }: LoadingIndicatorProps) {
  const sizeMap = {
    sm: "size-5",
    md: "size-8",
    lg: "size-12",
  } as const

  return (
    <div
      data-slot="loading-indicator"
      role="progressbar"
      aria-label="로딩 중"
      className={cn("inline-flex items-center justify-center", className)}
    >
      <svg
        className={cn("animate-spin text-primary", sizeMap[size])}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </div>
  )
}

export { LoadingIndicator }
