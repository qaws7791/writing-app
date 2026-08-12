"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "next-themes"
import { UiCspProvider } from "@workspace/ui/components/primitives/csp-provider"

export function AppProviders({
  children,
  nonce,
}: {
  readonly children: ReactNode
  readonly nonce?: string
}) {
  return (
    <UiCspProvider {...(nonce === undefined ? {} : { nonce })}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        disableTransitionOnChange
        enableSystem
        {...(nonce === undefined ? {} : { nonce })}
      >
        {children}
      </ThemeProvider>
    </UiCspProvider>
  )
}
