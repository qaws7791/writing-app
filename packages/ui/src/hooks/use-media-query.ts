"use client"

import { useState } from "react"

import { useSafeLayoutEffect } from "./use-safe-layout-effect"

const IS_SERVER = typeof window === "undefined"

export function useMediaQuery(query: string, defaultValue = false): boolean {
  const getMatches = (): boolean => {
    if (IS_SERVER) return defaultValue

    return window.matchMedia(query).matches
  }

  const [matches, setMatches] = useState<boolean>(getMatches)

  useSafeLayoutEffect(() => {
    const matchMedia = window.matchMedia(query)

    const handleChange = () => setMatches(matchMedia.matches)

    handleChange()
    matchMedia.addEventListener("change", handleChange)

    return () => matchMedia.removeEventListener("change", handleChange)
  }, [query])

  return matches
}
