"use client"

import { startTransition, useEffect, useRef, useState } from "react"

export function useCSSVariable(
  property: string,
  override?: string
): string | undefined {
  const ref = useRef<HTMLElement | null>(null)
  const [value, setValue] = useState<string | undefined>(override)

  useEffect(() => {
    if (override) return

    const el = ref.current ?? document.documentElement
    const computed = getComputedStyle(el).getPropertyValue(property).trim()

    if (computed) {
      startTransition(() => setValue(computed))
    }
  }, [property, override])

  return value
}
