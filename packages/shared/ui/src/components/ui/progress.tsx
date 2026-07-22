"use client"

import { Progress as ProgressPrimitive } from "@base-ui/react/progress"

import { cn } from "#ui/lib/utils"

/**
 * `Progress` 컴포넌트는 진행 상황을 시각적으로 나타내는 데 사용됩니다.
 * 
 * @example
 * ```tsx
 * <Progress value={56} className="w-full max-w-sm">
  <ProgressLabel>Upload progress</ProgressLabel>
  <ProgressValue />
</Progress>
 * ```
 */
function Progress({
  className,
  children,
  value,
  indicatorClassName,
  trackClassName,
  ...props
}: ProgressPrimitive.Root.Props & {
  indicatorClassName?: string
  trackClassName?: string
}) {
  return (
    <ProgressPrimitive.Root
      value={value}
      data-slot="progress"
      className={cn("flex flex-wrap gap-3", className)}
      {...props}
    >
      {children}
      <ProgressTrack className={trackClassName}>
        <ProgressIndicator className={indicatorClassName} />
      </ProgressTrack>
    </ProgressPrimitive.Root>
  )
}

function ProgressTrack({ className, ...props }: ProgressPrimitive.Track.Props) {
  return (
    <ProgressPrimitive.Track
      className={cn(
        "relative flex h-4 w-full items-center overflow-x-hidden rounded-full bg-default-soft",
        className
      )}
      data-slot="progress-track"
      {...props}
    />
  )
}

function ProgressIndicator({
  className,
  ...props
}: ProgressPrimitive.Indicator.Props) {
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn(
        "h-full bg-accent transition-[width] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        className
      )}
      {...props}
    />
  )
}

function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      className={cn("text-sm font-medium", className)}
      data-slot="progress-label"
      {...props}
    />
  )
}

function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      className={cn(
        "ml-auto text-sm text-muted-foreground tabular-nums",
        className
      )}
      data-slot="progress-value"
      {...props}
    />
  )
}

export {
  Progress,
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
  ProgressValue,
}
