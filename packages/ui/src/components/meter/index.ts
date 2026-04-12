import type { ComponentProps } from "react"

import { MeterFill, MeterOutput, MeterRoot, MeterTrack } from "./meter"

export const Meter = Object.assign(MeterRoot, {
  Root: MeterRoot,
  Output: MeterOutput,
  Track: MeterTrack,
  Fill: MeterFill,
})

export type Meter = {
  Props: ComponentProps<typeof MeterRoot>
  RootProps: ComponentProps<typeof MeterRoot>
  OutputProps: ComponentProps<typeof MeterOutput>
  TrackProps: ComponentProps<typeof MeterTrack>
  FillProps: ComponentProps<typeof MeterFill>
}

export { MeterRoot, MeterOutput, MeterTrack, MeterFill }
export type {
  MeterRootProps,
  MeterRootProps as MeterProps,
  MeterOutputProps,
  MeterTrackProps,
  MeterFillProps,
} from "./meter"
export { meterVariants } from "./meter.styles"
export type { MeterVariants } from "./meter.styles"
