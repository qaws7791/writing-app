import type { Metadata } from "next"
import type { ReactNode } from "react"
import { ThemeProvider } from "next-themes"

import "@/app/globals.css"

export const metadata: Metadata = {
  description: "글결 학습 플랫폼 운영 콘솔",
  title: "글결 어드민",
}

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode
}) {
  return (
    <html data-density="compact" lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
