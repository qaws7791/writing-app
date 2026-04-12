import type { ComponentProps } from "react"

import {
  AlertContent,
  AlertDescription,
  AlertIndicator,
  AlertRoot,
  AlertTitle,
} from "./alert"

export const Alert = Object.assign(AlertRoot, {
  Root: AlertRoot,
  Indicator: AlertIndicator,
  Content: AlertContent,
  Title: AlertTitle,
  Description: AlertDescription,
})

export type Alert = {
  Props: ComponentProps<typeof AlertRoot>
  RootProps: ComponentProps<typeof AlertRoot>
  IndicatorProps: ComponentProps<typeof AlertIndicator>
  ContentProps: ComponentProps<typeof AlertContent>
  TitleProps: ComponentProps<typeof AlertTitle>
  DescriptionProps: ComponentProps<typeof AlertDescription>
}

export {
  AlertRoot,
  AlertIndicator,
  AlertContent,
  AlertTitle,
  AlertDescription,
} from "./alert"
export type {
  AlertRootProps,
  AlertRootProps as AlertProps,
  AlertIndicatorProps,
  AlertContentProps,
  AlertTitleProps,
  AlertDescriptionProps,
} from "./alert"
export { alertVariants } from "./alert.styles"
export type { AlertVariants } from "./alert.styles"
