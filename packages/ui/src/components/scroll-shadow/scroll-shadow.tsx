"use client"

import type { RefObject } from "react"

import { useMemo, useRef } from "react"

import { useSafeLayoutEffect } from "@workspace/ui/hooks/use-safe-layout-effect"
import { mergeRefs } from "@workspace/ui/utils/merge-refs"

import type { ScrollShadowVariants } from "./scroll-shadow.styles"

import { scrollShadowVariants } from "./scroll-shadow.styles"
import { useScrollShadow } from "./use-scroll-shadow"

export type ScrollShadowVisibility =
  | "auto"
  | "both"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "none"

export interface ScrollShadowRootProps
  extends Omit<React.ComponentProps<"div">, "size">, ScrollShadowVariants {
  size?: number
  offset?: number
  visibility?: ScrollShadowVisibility
  isEnabled?: boolean
  onVisibilityChange?: (visibility: ScrollShadowVisibility) => void
}

export const ScrollShadowRoot = ({
  children,
  className,
  hideScrollBar = false,
  isEnabled = true,
  offset = 0,
  onVisibilityChange,
  orientation = "vertical",
  ref,
  size = 40,
  variant = "fade",
  visibility = "auto",
  ...props
}: ScrollShadowRootProps) => {
  const internalRef = useRef<HTMLDivElement | null>(null)

  useScrollShadow({
    containerRef: internalRef as RefObject<HTMLElement>,
    isEnabled,
    offset,
    onVisibilityChange,
    orientation: orientation ?? "vertical",
    visibility,
  })

  useSafeLayoutEffect(() => {
    const el = internalRef.current

    if (!el || visibility === "auto") return

    delete el.dataset["topScroll"]
    delete el.dataset["bottomScroll"]
    delete el.dataset["topBottomScroll"]
    delete el.dataset["leftScroll"]
    delete el.dataset["rightScroll"]
    delete el.dataset["leftRightScroll"]

    if (visibility === "both") {
      el.dataset[
        orientation === "vertical" ? "topBottomScroll" : "leftRightScroll"
      ] = "true"
    } else if (visibility !== "none") {
      el.dataset[`${visibility}Scroll`] = "true"
    }
  }, [visibility, orientation])

  const slots = useMemo(
    () =>
      scrollShadowVariants({
        hideScrollBar,
        orientation,
        variant,
      }),
    [orientation, hideScrollBar, variant]
  )

  return (
    <div
      ref={mergeRefs(internalRef, ref)}
      className={slots.base({ className })}
      data-orientation={orientation}
      data-scroll-shadow-size={size}
      style={
        {
          "--scroll-shadow-size": `${size}px`,
          ...props.style,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  )
}

ScrollShadowRoot.displayName = "ScrollShadow"
