"use client"

import { usePathname } from "next/navigation"

export type GlobalNavPathProps = {
  readonly currentPath?: string
}

export function useGlobalNavCurrentPath(currentPath?: string): string {
  const pathname = usePathname()

  return currentPath ?? pathname
}
