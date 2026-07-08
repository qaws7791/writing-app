"use client"

import type { CSSProperties } from "react"

import type { Pebble } from "@/features/landing/landing-content"

const previewFrameTokens = {
  "글결 앱 홈 화면 미리보기": {
    accent: "var(--semantic-color-action-selected-bg)",
    secondary: "var(--semantic-color-success-bg)",
    title: "Home",
  },
  "글결 레슨 진행 화면": {
    accent: "var(--semantic-color-success-bg)",
    secondary: "var(--semantic-color-danger-bg)",
    title: "Lesson",
  },
  "글결 코스 대시보드 화면": {
    accent: "var(--semantic-color-danger-bg)",
    secondary: "var(--semantic-color-action-selected-bg)",
    title: "Courses",
  },
} as const

type PreviewFrameAlt = keyof typeof previewFrameTokens

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
  const frame = previewFrameTokens[alt]

  return (
    <svg
      aria-label={alt}
      className="w-full rounded-panel object-cover"
      role="img"
      style={{ aspectRatio }}
      viewBox="0 0 900 1200"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        fill="var(--semantic-color-bg-inverse)"
        height="1200"
        rx="64"
        width="900"
      />
      <rect
        fill="var(--semantic-color-bg-canvas)"
        height="1040"
        rx="48"
        width="760"
        x="70"
        y="80"
      />
      <circle cx="150" cy="165" fill={frame.accent} r="30" />
      <rect
        fill="var(--semantic-color-fg-default)"
        height="24"
        rx="12"
        width="240"
        x="205"
        y="140"
      />
      <rect
        fill="var(--semantic-color-fg-muted)"
        height="18"
        rx="9"
        width="150"
        x="205"
        y="182"
      />
      <rect
        fill={frame.accent}
        height="170"
        rx="38"
        width="670"
        x="115"
        y="270"
      />
      <rect
        fill="var(--semantic-color-fg-default)"
        height="24"
        rx="12"
        width="300"
        x="160"
        y="318"
      />
      <rect
        fill="var(--semantic-color-fg-default)"
        height="18"
        opacity=".62"
        rx="9"
        width="440"
        x="160"
        y="365"
      />
      <rect
        fill="var(--semantic-color-bg-surface)"
        height="240"
        rx="38"
        width="315"
        x="115"
        y="485"
      />
      <rect
        fill="var(--semantic-color-bg-surface)"
        height="240"
        rx="38"
        width="315"
        x="470"
        y="485"
      />
      <rect
        fill="var(--semantic-color-fg-default)"
        height="22"
        rx="11"
        width="170"
        x="160"
        y="545"
      />
      <rect
        fill="var(--semantic-color-fg-default)"
        height="22"
        rx="11"
        width="160"
        x="515"
        y="545"
      />
      <rect
        fill="var(--semantic-color-fg-muted)"
        height="18"
        rx="9"
        width="210"
        x="160"
        y="610"
      />
      <rect
        fill="var(--semantic-color-fg-muted)"
        height="18"
        rx="9"
        width="200"
        x="515"
        y="610"
      />
      <rect
        fill={frame.secondary}
        height="250"
        rx="42"
        width="670"
        x="115"
        y="780"
      />
      <rect
        fill="var(--semantic-color-fg-default)"
        height="24"
        rx="12"
        width="220"
        x="160"
        y="838"
      />
      <rect
        fill="var(--semantic-color-fg-default)"
        height="18"
        opacity=".62"
        rx="9"
        width="490"
        x="160"
        y="900"
      />
      <text
        className="text-heading-lg font-black"
        fill="var(--semantic-color-fg-default)"
        fontFamily="Arial, sans-serif"
        x="160"
        y="1010"
      >
        {frame.title}
      </text>
    </svg>
  )
}
