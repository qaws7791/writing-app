import type { Metadata } from "next"
import { Noto_Sans_KR } from "next/font/google"

import { ThemeProvider, Toaster } from "@workspace/ui/next"

import "./globals.css"

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "한글쓰기 — 한국어 글쓰기 학습 플랫폼",
  description:
    "한국어 글쓰기를 체계적으로 배워보세요. 기초부터 고급까지 다양한 코스를 제공합니다.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={notoSansKr.className} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
