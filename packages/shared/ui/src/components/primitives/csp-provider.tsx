"use client"

import { CSPProvider } from "@base-ui/react/csp-provider"
import type { ReactNode } from "react"

export function UiCspProvider({
  children,
  nonce,
}: {
  readonly children: ReactNode
  readonly nonce?: string
}) {
  return <CSPProvider nonce={nonce}>{children}</CSPProvider>
}
