"use client"

import { composeRenderProps } from "react-aria-components"
import { cx } from "tailwind-variants"

/**
 * Composes a Tailwind class string with a React Aria render-prop className.
 * Handles both static strings and render-prop functions from RAC.
 */
function composeTwRenderProps<T>(
  className: string | ((v: T) => string) | undefined,
  tailwind?: string | ((v: T) => string | undefined)
): string | ((v: T) => string) {
  return composeRenderProps(className, (className, renderProps): string => {
    const tw =
      typeof tailwind === "function"
        ? (tailwind(renderProps as T) ?? "")
        : (tailwind ?? "")
    const cls = className ?? ""

    return cx(tw, cls) ?? ""
  })
}

/**
 * Applies a slot variant function with an optional extra className.
 * Used for compound components where slots accept className overrides.
 */
const composeSlotClassName = (
  slotFn:
    | ((args?: { className?: string; [key: string]: unknown }) => string)
    | undefined,
  className?: string,
  variants?: Record<string, unknown>
): string | undefined => {
  return typeof slotFn === "function"
    ? slotFn({ ...variants, className })
    : className
}

export { composeTwRenderProps, composeSlotClassName }
