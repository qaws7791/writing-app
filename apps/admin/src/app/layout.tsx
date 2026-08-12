import type { Metadata } from "next"
import { headers } from "next/headers"
import { connection } from "next/server"
import type { ReactNode } from "react"
import { ThemeProvider } from "next-themes"
import { zodJitlessBootstrapScript } from "@workspace/nextjs-config/zod-jitless"
import { UiCspProvider } from "@workspace/ui/components/primitives/csp-provider"
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
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: zodJitlessBootstrapScript }}
          id="admin-zod-jitless"
          suppressHydrationWarning
          {...(nonce === undefined ? {} : { nonce })}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
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
      </body>
    </html>
  )
}
