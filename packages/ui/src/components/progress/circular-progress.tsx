"use client"

import { cn } from "@workspace/ui/lib/utils"

export interface CircularProgressProps {
  value?: number
  size?: number
  indeterminate?: boolean
  className?: string
}

function CircularProgress({
  value,
  size = 48,
  indeterminate,
  className,
}: CircularProgressProps) {
  const strokeWidth = size >= 48 ? 4 : 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = indeterminate
    ? circumference * 0.75
    : circumference - (circumference * (value ?? 0)) / 100

  return (
    <div
      data-slot="circular-progress"
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : (value ?? 0)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(indeterminate && "animate-spin", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        className="block -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-secondary-container"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            "text-primary",
            !indeterminate &&
              "duration-medium2 transition-[stroke-dashoffset] ease-standard"
          )}
        />
      </svg>
    </div>
  )
}

export { CircularProgress }
