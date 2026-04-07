"use client"

import { useRouter, useSearchParams } from "next/navigation"
import PromptArchiveView from "@/views/prompt-archive-view"
import JourneyArchiveView from "@/views/journey-archive-view"
import BottomNav from "@/foundation/ui/bottom-nav"
import journeyData from "@/data/journey-sessions.json"
const JOURNEY_IMAGES = [
  "https://www.figma.com/api/mcp/asset/6641c434-17fc-48b2-9a4e-e0791a903147",
  "https://www.figma.com/api/mcp/asset/f7488375-2d98-416f-a189-9a970d8f4097",
]
const STAR_ICON =
  "https://www.figma.com/api/mcp/asset/062e2961-d065-43b8-8e11-d98fc24abe73"

const TOP_TABS = ["홈", "글감", "여정"] as const

function JourneyCard({
  id,
  imageUrl,
  title,
  subtitle,
  progress,
}: {
  id: string
  imageUrl: string
  title: string
  subtitle: string
  progress: number
}) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push(`/journeys/${id}`)}
      className="flex h-32 w-full items-center gap-5 rounded-3xl bg-surface-container p-4 text-left transition-colors hover:bg-surface-container-high"
    >
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
    </button>
  )
}

function HomeContent() {
  const router = useRouter()

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
          <button
            className="text-sm font-semibold text-on-surface-low"
            onClick={() => router.push("/my-journeys")}
          >
            더보기
          </button>
        </div>
        <div className="flex flex-col gap-6">
          {journeyData.journeys.slice(0, 2).map((journey, index) => (
            <JourneyCard
              key={journey.id}
              id={journey.id}
              imageUrl={JOURNEY_IMAGES[index % JOURNEY_IMAGES.length]!}
              title={journey.title}
              subtitle={journey.category}
              progress={0}
            />
          ))}
        </div>
      </div>
    </>
  )
}

const TOP_TAB_PARAM: Record<(typeof TOP_TABS)[number], string> = {
  홈: "home",
  글감: "prompts",
  여정: "journeys",
}
const PARAM_TO_TOP_TAB: Record<string, (typeof TOP_TABS)[number]> = {
  home: "홈",
  prompts: "글감",
  journeys: "여정",
}

export default function HomeView() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const rawTab = searchParams.get("tab")
  const activeTab: (typeof TOP_TABS)[number] =
    rawTab && rawTab in PARAM_TO_TOP_TAB ? PARAM_TO_TOP_TAB[rawTab]! : "글감"

  function navigateToTab(tab: (typeof TOP_TABS)[number]) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", TOP_TAB_PARAM[tab])
    router.push(`/?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="flex items-center gap-6 px-6 py-6">
        {TOP_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => navigateToTab(tab)}
            className={`text-2xl leading-6 font-semibold transition-colors ${
              activeTab === tab ? "text-on-surface" : "text-on-surface-lowest"
            }`}
          >
            {tab}
          </button>
        ))}
      </header>

      <div className="flex-1 overflow-y-auto pb-24">
        {activeTab === "홈" && <HomeContent />}
        {activeTab === "글감" && <PromptArchiveView />}
        {activeTab === "여정" && <JourneyArchiveView />}
      </div>

      <BottomNav />
    </div>
  )
}
