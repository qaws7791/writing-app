"use client"

import { useCallback, useState } from "react"

interface UseDisclosureReturn {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  onOpenChange: (open: boolean) => void
}

function useDisclosure(initialState = false): UseDisclosureReturn {
  const [isOpen, setIsOpen] = useState(initialState)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])
  const onOpenChange = useCallback((value: boolean) => setIsOpen(value), [])

  return { isOpen, open, close, toggle, onOpenChange }
}

export { useDisclosure }
export type { UseDisclosureReturn }
