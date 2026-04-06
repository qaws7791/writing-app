"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Home01Icon,
  BookOpen01Icon,
  QuillWrite01Icon,
  User02Icon,
} from "@hugeicons/core-free-icons"
import PromptArchiveView from "@/views/prompt-archive-view"
import JourneyArchiveView from "@/views/journey-archive-view"
import MyJourneysView from "@/views/my-journeys-view"
import WritingsListView from "@/views/writings-list-view"
const JOURNEY_IMAGE_1 =
  "https://www.figma.com/api/mcp/asset/6641c434-17fc-48b2-9a4e-e0791a903147"
const JOURNEY_IMAGE_2 =
  "https://www.figma.com/api/mcp/asset/f7488375-2d98-416f-a189-9a970d8f4097"
const STAR_ICON =
  "https://www.figma.com/api/mcp/asset/062e2961-d065-43b8-8e11-d98fc24abe73"

const TOP_TABS = ["홈", "글감", "여정"] as const

function JourneyCard({
  imageUrl,
  title,
  subtitle,
  progress,
}: {
  imageUrl: string
  title: string
  subtitle: string
  progress: number
}) {
  return (
    <div className="flex h-32 items-center gap-5 rounded-3xl bg-surface-container p-4">
      <div className="size-24 shrink-0 overflow-hidden rounded-[32px] bg-surface-container-high">
        <img src={imageUrl} alt={title} className="size-full object-cover" />
      </div>
      <div className="flex h-[87.5px] flex-1 flex-col gap-1">
        <p className="text-base font-medium text-on-surface">{title}</p>
        <p className="text-xs text-on-surface-low">{subtitle}</p>
        <div className="flex flex-1 items-end">
          <div className="flex w-full items-center gap-2">
            <div className="relative h-2 flex-1 rounded-full bg-surface-container-high">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-on-surface-low"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-bold text-on-surface-low">
              {progress}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const BOTTOM_NAV_ITEMS = [
  { icon: Home01Icon, label: "홈" },
  { icon: BookOpen01Icon, label: "나의 여정" },
  { icon: QuillWrite01Icon, label: "서재" },
  { icon: User02Icon, label: "프로필" },
] as const

type BottomNavLabel = (typeof BOTTOM_NAV_ITEMS)[number]["label"]

function HomeContent() {
  return (
    <>
      {/* Greeting */}
      <div className="mt-4 px-6">
        <h1 className="text-4xl leading-[1.1] font-medium tracking-tight text-on-surface">
          좋은 아침입니다,
          <br />
          준혁님.
        </h1>
      </div>

      {/* Daily Topic Card */}
      <div className="mt-6 px-4">
        <div className="flex min-h-45 flex-col justify-between rounded-[32px] bg-surface-container-high p-6">
          <div className="flex flex-col gap-2.75">
            <div className="flex items-center gap-1.5">
              <img src={STAR_ICON} alt="star" className="size-4" />
              <span className="text-sm font-medium text-on-surface-low">
                오늘의 추천 주제
              </span>
            </div>
            <p className="text-2xl leading-9 font-medium text-on-surface-low">
              나를 설레게 하는 작은 것들
            </p>
          </div>
          <p className="text-right text-xs font-medium text-on-surface-low">
            지금까지 247명이 응답했어요
          </p>
        </div>
      </div>

      {/* Journey Section */}
      <div className="mt-8 flex flex-col gap-6 px-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-semibold text-on-surface-low">
            현재 진행 중인 여정
          </h2>
          <button className="text-sm font-semibold text-on-surface-low">
            더보기
          </button>
        </div>
        <div className="flex flex-col gap-6">
          <JourneyCard
            imageUrl={JOURNEY_IMAGE_1}
            title="새벽의 대화"
            subtitle="완성된 단편선"
            progress={65}
          />
          <JourneyCard
            imageUrl={JOURNEY_IMAGE_2}
            title="나를 찾는 여행"
            subtitle="자아 성찰 에세이"
            progress={14}
          />
        </div>
      </div>
    </>
  )
}

export default function HomeView() {
  const [activeTab, setActiveTab] = useState<(typeof TOP_TABS)[number]>("글감")
  const [activeBottomNav, setActiveBottomNav] = useState<BottomNavLabel>("홈")

  const isHomeSection = activeBottomNav === "홈"

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Top Tabs (홈 섹션에서만 표시) */}
      {isHomeSection && (
        <header className="flex items-center gap-6 px-6 py-6">
          {TOP_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-2xl leading-6 font-semibold transition-colors ${
                activeTab === tab ? "text-on-surface" : "text-on-surface-lowest"
              }`}
            >
              {tab}
            </button>
          ))}
        </header>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {isHomeSection && activeTab === "홈" && <HomeContent />}
        {isHomeSection && activeTab === "글감" && <PromptArchiveView />}
        {isHomeSection && activeTab === "여정" && <JourneyArchiveView />}
        {activeBottomNav === "나의 여정" && <MyJourneysView />}
        {activeBottomNav === "서재" && <WritingsListView />}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed right-0 bottom-0 left-0 z-50 flex items-center justify-around rounded-tl-[2rem] rounded-tr-[2rem] border-t border-outline/20 bg-surface/95 px-4 py-4.25 shadow-[0px_-12px_40px_0px_rgba(47,52,48,0.04)] backdrop-blur-xl">
        {BOTTOM_NAV_ITEMS.map(({ icon, label }) => {
          const isActive = activeBottomNav === label
          return (
            <button
              key={label}
              onClick={() => setActiveBottomNav(label)}
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive ? "text-primary" : "text-on-surface-lowest"
              }`}
            >
              <HugeiconsIcon
                icon={icon}
                size={24}
                color="currentColor"
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span className="text-[11px] font-semibold tracking-wide uppercase">
                {label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
