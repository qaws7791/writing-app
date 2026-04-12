import type { ComponentProps } from "react"

import {
  ProgressBarFill,
  ProgressBarOutput,
  ProgressBarRoot,
  ProgressBarTrack,
} from "./progress-bar"

export const ProgressBar = Object.assign(ProgressBarRoot, {
  Root: ProgressBarRoot,
  Output: ProgressBarOutput,
  Track: ProgressBarTrack,
  Fill: ProgressBarFill,
})

export type ProgressBar = {
  Props: ComponentProps<typeof ProgressBarRoot>
  RootProps: ComponentProps<typeof ProgressBarRoot>
  OutputProps: ComponentProps<typeof ProgressBarOutput>
  TrackProps: ComponentProps<typeof ProgressBarTrack>
  FillProps: ComponentProps<typeof ProgressBarFill>
}

export { ProgressBarRoot, ProgressBarOutput, ProgressBarTrack, ProgressBarFill }
export type {
  ProgressBarRootProps,
  ProgressBarRootProps as ProgressBarProps,
  ProgressBarOutputProps,
  ProgressBarTrackProps,
  ProgressBarFillProps,
} from "./progress-bar"
export { progressBarVariants } from "./progress-bar.styles"
export type { ProgressBarVariants } from "./progress-bar.styles"
