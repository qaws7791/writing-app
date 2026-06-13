import type { Metadata } from "next"
import type { ReactNode } from "react"

import { InlineStyleAttributeNormalizer } from "@/components/layout/inline-style-attribute-normalizer"

import "@/app/globals.css"

export const metadata: Metadata = {
  description:
    "글결은 짧은 학습, 즉시 쓰기, AI 코칭으로 글쓰기 루틴을 만드는 학습 플랫폼입니다.",
  title: {
    default: "글결",
    template: "%s | 글결",
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <InlineStyleAttributeNormalizer />
        {children}
      </body>
    </html>
  )
}
