import type { Metadata } from "next"

import "./globals.css"

export const metadata: Metadata = {
  title: "글필 어드민",
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
