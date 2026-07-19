import type { Metadata } from "next"
import { headers } from "next/headers"
import { connection } from "next/server"
import type { ReactNode } from "react"

import "@workspace/ui/pretendard-font"

import "@/app/globals.css"
import { AppProviders } from "@/app/_providers/app-providers"
import { readWebOrigin } from "@/server/env/runtime-config"

export const metadata: Metadata = {
  description:
    "글결은 짧은 학습, 즉시 쓰기, AI 코칭으로 글쓰기 루틴을 만드는 학습 플랫폼입니다.",
  metadataBase: new URL(readWebOrigin()),
  openGraph: {
    description:
      "짧은 학습과 즉시 쓰기로 매일 글쓰기 루틴을 만드는 학습 플랫폼",
    images: ["/course-thumbnails/basic-sentence-writing.png"],
    locale: "ko_KR",
    siteName: "글결",
    title: "글결",
    type: "website",
  },
  title: {
    default: "글결",
    template: "%s | 글결",
  },
  twitter: {
    card: "summary_large_image",
    description:
      "짧은 학습과 즉시 쓰기로 매일 글쓰기 루틴을 만드는 학습 플랫폼",
    images: ["/course-thumbnails/basic-sentence-writing.png"],
    title: "글결",
  },
}

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await connection()
  const nonce = (await headers()).get("x-nonce") ?? undefined

  return (
    <html data-density="comfortable" lang="ko" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AppProviders {...(nonce === undefined ? {} : { nonce })}>
          {children}
        </AppProviders>
      </body>
    </html>
  )
}
