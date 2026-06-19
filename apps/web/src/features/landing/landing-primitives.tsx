"use client"

/* eslint-disable @next/next/no-img-element */

import type { CSSProperties } from "react"

import type { Pebble } from "@/features/landing/landing-content"

const previewFrameSources = {
  "Kernel 앱 홈 화면 미리보기": createPreviewFrameSource({
    accent: "#FFC800",
    secondary: "#34C759",
    title: "Home",
  }),
  "Kernel 레슨 진행 화면": createPreviewFrameSource({
    accent: "#34C759",
    secondary: "#FF7A6B",
    title: "Lesson",
  }),
  "Kernel 코스 대시보드 화면": createPreviewFrameSource({
    accent: "#FF7A6B",
    secondary: "#FFC800",
    title: "Courses",
  }),
} as const

type PreviewFrameAlt = keyof typeof previewFrameSources

export function Pebbles({ items }: { readonly items: readonly Pebble[] }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      {items.map((pebble) => (
        <div
          className="rounded-full"
          key={`${pebble.color}-${pebble.size}-${pebble.top ?? pebble.bottom}`}
          style={
            {
              "--landing-pebble-drift": `${pebble.drift ?? 24}px`,
              animation: `landing-pebble-float ${pebble.duration ?? 8}s ease-in-out ${pebble.delay ?? 0}s infinite`,
              backgroundColor: pebble.color,
              bottom: pebble.bottom,
              height: pebble.size,
              left: pebble.left,
              position: "absolute",
              right: pebble.right,
              top: pebble.top,
              width: pebble.size,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

export function PreviewFrame({
  alt,
  aspectRatio,
}: {
  readonly alt: PreviewFrameAlt
  readonly aspectRatio: string
}) {
  return (
    <img
      alt={alt}
      className="w-full rounded-4xl object-cover"
      src={previewFrameSources[alt]}
      style={{ aspectRatio }}
    />
  )
}

function createPreviewFrameSource({
  accent,
  secondary,
  title,
}: {
  readonly accent: string
  readonly secondary: string
  readonly title: string
}) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200">
  <rect width="900" height="1200" rx="64" fill="#2A2621"/>
  <rect x="70" y="80" width="760" height="1040" rx="48" fill="#FDFBF7"/>
  <circle cx="150" cy="165" r="30" fill="${accent}"/>
  <rect x="205" y="140" width="240" height="24" rx="12" fill="#2A2621"/>
  <rect x="205" y="182" width="150" height="18" rx="9" fill="#8C857A"/>
  <rect x="115" y="270" width="670" height="170" rx="38" fill="${accent}"/>
  <rect x="160" y="318" width="300" height="24" rx="12" fill="#2A2621"/>
  <rect x="160" y="365" width="440" height="18" rx="9" fill="#2A2621" opacity=".62"/>
  <rect x="115" y="485" width="315" height="240" rx="38" fill="#F4EFE6"/>
  <rect x="470" y="485" width="315" height="240" rx="38" fill="#F4EFE6"/>
  <rect x="160" y="545" width="170" height="22" rx="11" fill="#2A2621"/>
  <rect x="515" y="545" width="160" height="22" rx="11" fill="#2A2621"/>
  <rect x="160" y="610" width="210" height="18" rx="9" fill="#8C857A"/>
  <rect x="515" y="610" width="200" height="18" rx="9" fill="#8C857A"/>
  <rect x="115" y="780" width="670" height="250" rx="42" fill="${secondary}"/>
  <rect x="160" y="838" width="220" height="24" rx="12" fill="#2A2621"/>
  <rect x="160" y="900" width="490" height="18" rx="9" fill="#2A2621" opacity=".62"/>
  <text x="160" y="1010" fill="#2A2621" font-family="Arial, sans-serif" font-size="54" font-weight="800">${title}</text>
</svg>`

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
