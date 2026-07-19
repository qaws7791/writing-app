"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "next-themes"

export function AppProviders({
  children,
  nonce,
}: {
  readonly children: ReactNode
  readonly nonce?: string
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      enableSystem
      {...(nonce === undefined ? {} : { nonce })}
    >
      {children}
    </ThemeProvider>
  )
}
