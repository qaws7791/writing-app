"use client"

import type { ScrollShadowVisibility } from "./scroll-shadow"
import type { RefObject } from "react"

import { useCallback, useEffect, useRef } from "react"

export interface UseScrollShadowProps {
  containerRef: RefObject<HTMLElement>
  orientation: "vertical" | "horizontal"
  offset: number
  visibility: ScrollShadowVisibility
  isEnabled: boolean
  onVisibilityChange?: (visibility: ScrollShadowVisibility) => void
}

export const useScrollShadow = (props: UseScrollShadowProps) => {
  const {
    containerRef,
    isEnabled,
    offset,
    onVisibilityChange,
    orientation,
    visibility,
  } = props

  const prevStateRef = useRef<{
    hasScrollBefore: boolean
    hasScrollAfter: boolean
  } | null>(null)

  const rafIdRef = useRef<number | null>(null)

  const checkOverflow = useCallback(() => {
    const el = containerRef.current

    if (!el) return

    const isVertical = orientation === "vertical"
    const scrollStart = isVertical ? el.scrollTop : el.scrollLeft
    const scrollSize = isVertical ? el.scrollHeight : el.scrollWidth
    const clientSize = isVertical ? el.clientHeight : el.clientWidth

    const hasScrollBefore = scrollStart > offset
    const hasScrollAfter = scrollStart + clientSize + offset < scrollSize

    const prevState = prevStateRef.current

    if (
      prevState &&
      prevState.hasScrollBefore === hasScrollBefore &&
      prevState.hasScrollAfter === hasScrollAfter
    ) {
      return
    }

    prevStateRef.current = { hasScrollBefore, hasScrollAfter }

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
    }

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null

      if (isVertical) {
        if (hasScrollBefore && hasScrollAfter) {
          el.dataset["topBottomScroll"] = "true"
          delete el.dataset["topScroll"]
          delete el.dataset["bottomScroll"]

          onVisibilityChange?.("both")
        } else {
          el.dataset["topScroll"] = String(hasScrollBefore)
          el.dataset["bottomScroll"] = String(hasScrollAfter)
          delete el.dataset["topBottomScroll"]

          if (onVisibilityChange) {
            if (hasScrollBefore) {
              onVisibilityChange("top")
            } else if (hasScrollAfter) {
              onVisibilityChange("bottom")
            } else {
              onVisibilityChange("none")
            }
          }
        }
      } else {
        if (hasScrollBefore && hasScrollAfter) {
          el.dataset["leftRightScroll"] = "true"
          delete el.dataset["leftScroll"]
          delete el.dataset["rightScroll"]

          onVisibilityChange?.("both")
        } else {
          el.dataset["leftScroll"] = String(hasScrollBefore)
          el.dataset["rightScroll"] = String(hasScrollAfter)
          delete el.dataset["leftRightScroll"]

          if (onVisibilityChange) {
            if (hasScrollBefore) {
              onVisibilityChange("left")
            } else if (hasScrollAfter) {
              onVisibilityChange("right")
            } else {
              onVisibilityChange("none")
            }
          }
        }
      }
    })
  }, [containerRef, orientation, offset, onVisibilityChange])

  useEffect(() => {
    const el = containerRef.current

    if (!el || !isEnabled || visibility !== "auto") return

    checkOverflow()

    el.addEventListener("scroll", checkOverflow, { passive: true })

    const resizeObserver = new ResizeObserver(checkOverflow)

    resizeObserver.observe(el)

    return () => {
      el.removeEventListener("scroll", checkOverflow)
      resizeObserver.disconnect()

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      prevStateRef.current = null
    }
  }, [containerRef, visibility, isEnabled, checkOverflow])
}
