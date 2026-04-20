"use client"

import { useEffect } from "react"

export function useDirtyGuard(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) {
      return
    }

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }

    window.addEventListener("beforeunload", handler)

    return () => {
      window.removeEventListener("beforeunload", handler)
    }
  }, [isDirty])
}
