import type { Metadata } from "next"
import { headers } from "next/headers"
import { connection } from "next/server"
import type { ReactNode } from "react"
import { ThemeProvider } from "next-themes"
import "@workspace/ui/pretendard-font"

import "@/app/globals.css"

export const metadata: Metadata = {
  description: "글결 학습 플랫폼 운영 콘솔",
  robots: {
    follow: false,
    googleBot: { follow: false, index: false, noimageindex: true },
    index: false,
    nocache: true,
  },
  title: "글결 어드민",
}

export default async function RootLayout({
  children,
}: {
  readonly children: ReactNode
}) {
  await connection()
  const nonce = (await headers()).get("x-nonce") ?? undefined

  return (
    <html data-density="compact" lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
          nonce={nonce}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
