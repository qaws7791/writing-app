import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "글필",
  description: "에세이 작성을 위한 글쓰기 플랫폼",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
