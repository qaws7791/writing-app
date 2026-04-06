"use client"

import { useState } from "react"

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
    <div className="flex h-32 items-center gap-5 rounded-3xl bg-[#fdfcf8] p-4">
      <div className="size-24 shrink-0 overflow-hidden rounded-[32px] bg-[#ebe7e6]">
        <img src={imageUrl} alt={title} className="size-full object-cover" />
      </div>
      <div className="flex h-[87.5px] flex-1 flex-col gap-1">
        <p className="text-base font-medium text-[#1c1b1b]">{title}</p>
        <p className="text-xs text-[#4d4848]">{subtitle}</p>
        <div className="flex flex-1 items-end">
          <div className="flex w-full items-center gap-2">
            <div className="relative h-2 flex-1 rounded-full bg-[#ebe7e6]">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#4d4848]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-bold text-[#4d4848]">
              {progress}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomeView() {
  const [activeTab, setActiveTab] = useState<(typeof TOP_TABS)[number]>("홈")

  return (
    <div className="min-h-screen bg-[#fdfcf8]">
      {/* Top Tabs */}
      <header className="flex items-center gap-6 px-6 py-6">
        {TOP_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-2xl leading-6 font-semibold transition-colors ${
              activeTab === tab ? "text-[#1c1b1b]" : "text-[#837c7c]"
            }`}
          >
            {tab}
          </button>
        ))}
      </header>

      {/* Greeting */}
      <div className="mt-4 px-6">
        <h1 className="text-[36px] leading-[1.1] font-medium tracking-[-0.025em] text-[#1c1b1b]">
          좋은 아침입니다,
          <br />
          준혁님.
        </h1>
      </div>

      {/* Daily Topic Card */}
      <div className="mt-6 px-4">
        <div className="flex min-h-[180px] flex-col justify-between rounded-[32px] bg-[#ebe7e6] p-6">
          <div className="flex flex-col gap-[11px]">
            <div className="flex items-center gap-1.5">
              <img src={STAR_ICON} alt="star" className="size-4" />
              <span className="text-sm font-medium text-[#4d4848]">
                오늘의 추천 주제
              </span>
            </div>
            <p className="text-2xl leading-9 font-medium text-[#4d4848]">
              나를 설레게 하는 작은 것들
            </p>
          </div>
          <p className="text-right text-xs font-medium text-[#4d4848]">
            지금까지 247명이 응답했어요
          </p>
        </div>
      </div>

      {/* Journey Section */}
      <div className="mt-8 flex flex-col gap-6 px-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-semibold text-[#4d4848]">
            현재 진행 중인 여정
          </h2>
          <button className="text-sm font-semibold text-[#4d4848]">
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
    </div>
  )
}
