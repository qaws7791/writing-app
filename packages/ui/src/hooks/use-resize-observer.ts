"use client"

import type { RefObject } from "react"

import { useEffect } from "react"

/**
 * Observes element size changes and calls onResize callback.
 * Simplified replacement for @react-aria/utils useResizeObserver.
 */
export function useResizeObserver({
  ref,
  onResize,
}: {
  ref: RefObject<Element | null>
  onResize: () => void
}): void {
  useEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === "undefined") return

    const observer = new ResizeObserver(onResize)
    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [ref, onResize])
}
