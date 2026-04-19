"use client"

import * as React from "react"
import { Progress, ProgressTrack, ProgressIndicator } from "./progress"
import { cn } from "../../lib/utils"

function ProgressBar({
  value,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { value: number }) {
  return (
    <Progress value={value} className={cn(className)} {...props}>
      {children}
    </Progress>
  )
}

function ProgressBarTrack({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <ProgressTrack className={cn(className)} {...props}>
      {children}
    </ProgressTrack>
  )
}

function ProgressBarFill({ className, ...props }: React.ComponentProps<"div">) {
  return <ProgressIndicator className={cn(className)} {...props} />
}

ProgressBar.Track = ProgressBarTrack
ProgressBar.Fill = ProgressBarFill

export { ProgressBar }
