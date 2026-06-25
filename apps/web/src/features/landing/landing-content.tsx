"use client"

import type { ComponentType } from "react"

import { SparklesIcon } from "@/features/landing/landing-icons"
import {
  FlameIcon,
  LayersIcon,
  PuzzleIcon,
} from "@workspace/ui/components/icons"

export type Pebble = {
  readonly bottom?: string
  readonly color: string
  readonly delay?: number
  readonly drift?: number
  readonly duration?: number
  readonly left?: string
  readonly right?: string
  readonly size: number
  readonly top?: string
}

export type Feature = {
  readonly bg: string
  readonly body: string
  readonly icon: ComponentType<{ className?: string; size?: number }>
  readonly title: string
}

const LANDING_ACCENT = "var(--semantic-color-action-selected-bg)"
const LANDING_DANGER = "var(--semantic-color-danger-bg)"
const LANDING_SUCCESS = "var(--semantic-color-success-bg)"
const LANDING_SUCCESS_STRONG = "var(--semantic-color-success-fg)"
const LANDING_SURFACE = "var(--semantic-color-bg-surface)"

export const marqueeRows = [
  {
    items: [
      "언어",
      "디자인",
      "코딩",
      "역사",
      "심리학",
      "경제",
      "글쓰기",
      "철학",
    ],
    reverse: false,
  },
  {
    items: [
      "데이터",
      "음악 이론",
      "비즈니스",
      "과학",
      "예술사",
      "마케팅",
      "수학",
      "사진",
    ],
    reverse: true,
  },
] as const

export const marqueeColors = [
  LANDING_ACCENT,
  LANDING_DANGER,
  LANDING_SUCCESS,
  LANDING_SURFACE,
] as const

export const heroPebbles: readonly Pebble[] = [
  { color: LANDING_ACCENT, duration: 9, left: "-60px", size: 220, top: "12%" },
  {
    bottom: "14%",
    color: LANDING_DANGER,
    delay: 1,
    duration: 7,
    left: "8%",
    size: 140,
  },
  {
    color: LANDING_SUCCESS,
    delay: 0.5,
    duration: 10,
    right: "6%",
    size: 180,
    top: "18%",
  },
  {
    bottom: "22%",
    color: LANDING_SUCCESS_STRONG,
    delay: 1.5,
    duration: 6,
    right: "24%",
    size: 90,
  },
]

export const finalPebbles: readonly Pebble[] = [
  { color: LANDING_ACCENT, duration: 8, left: "6%", size: 160, top: "-30px" },
  {
    bottom: "-20px",
    color: LANDING_DANGER,
    delay: 1,
    duration: 7,
    right: "12%",
    size: 110,
  },
  {
    color: LANDING_SUCCESS,
    delay: 0.5,
    duration: 6,
    right: "8%",
    size: 70,
    top: "30%",
  },
]

export const features: readonly Feature[] = [
  {
    bg: LANDING_ACCENT,
    body: "큰 개념을 한 입 크기의 레슨으로 나눠, 부담 없이 매일 한 조각씩 익혀요.",
    icon: LayersIcon,
    title: "작은 조각으로",
  },
  {
    bg: LANDING_DANGER,
    body: "연속 학습 기록과 부드러운 리듬이 학습을 매일의 습관으로 만들어 줍니다.",
    icon: FlameIcon,
    title: "습관이 되는 흐름",
  },
  {
    bg: LANDING_SUCCESS,
    body: "분류, 매칭, 순서 맞추기 — 손으로 조작하며 개념을 몸에 익히는 인터랙션.",
    icon: PuzzleIcon,
    title: "직접 만지는 학습",
  },
  {
    bg: LANDING_SURFACE,
    body: "진도와 관심사에 맞춰 다음에 배울 조각을 자연스럽게 이어서 추천해요.",
    icon: SparklesIcon,
    title: "나에게 맞춰",
  },
]

export const steps = [
  {
    body: "언어부터 철학까지, 배우고 싶은 주제를 선택하면 첫 조각이 준비됩니다.",
    n: "01",
    title: "관심사를 골라요",
  },
  {
    body: "하루 5분, 짧고 밀도 높은 레슨으로 개념을 손으로 만지며 익혀요.",
    n: "02",
    title: "매일 한 조각씩",
  },
  {
    body: "연속 학습이 이어지며 흩어진 조각들이 하나의 단단한 이해로 자라납니다.",
    n: "03",
    title: "쌓여서 단단해져요",
  },
] as const

export const stats = [
  { bg: LANDING_ACCENT, label: "큐레이션 코스", suffix: "+", value: 120 },
  { bg: LANDING_DANGER, label: "학습 조각", suffix: "+", value: 5000 },
  { bg: LANDING_SUCCESS, label: "습관 지속률", suffix: "%", value: 98 },
] as const

export const footerLinks = [
  { group: "제품", items: ["코스", "레슨", "학습 통계", "요금제"] },
  { group: "회사", items: ["소개", "블로그", "채용", "문의"] },
  { group: "리소스", items: ["도움말", "커뮤니티", "이용약관", "개인정보"] },
] as const
