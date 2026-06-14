import type { Metadata } from "next"
import type { ReactNode } from "react"

import "@/app/globals.css"

export const metadata: Metadata = {
  description: "글결 학습 플랫폼 운영 콘솔",
  title: "글결 관리자",
}

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
