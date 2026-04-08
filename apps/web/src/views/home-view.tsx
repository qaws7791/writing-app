"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { FallingStarIcon } from "@hugeicons/core-free-icons"
import { useRouter, useSearchParams } from "next/navigation"
import PromptArchiveView from "@/views/prompt-archive-view"
import JourneyArchiveView from "@/views/journey-archive-view"
import { useHomeSnapshot } from "@/features/home"

const TOP_TABS = ["홈", "글감", "여정"] as const

function JourneyCard({
  journeyId,
  thumbnailUrl,
  title,
  description,
  completionRate,
}: {
  journeyId: number
  thumbnailUrl: string | null
  title: string
  description: string
  completionRate: number
}) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push(`/journeys/${journeyId}`)}
      className="flex h-32 w-full items-center gap-5 rounded-3xl bg-surface-container p-4 text-left transition-colors hover:bg-surface-container-high"
    >
      <div className="size-24 shrink-0 overflow-hidden rounded-[32px] bg-surface-container-high">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="size-full object-cover"
          />
        ) : null}
      </div>
      <div className="flex h-[87.5px] flex-1 flex-col gap-1">
        <p className="text-base font-medium text-on-surface">{title}</p>
        <p className="line-clamp-1 text-xs text-on-surface-low">
          {description}
        </p>
        <div className="flex flex-1 items-end">
          <div className="flex w-full items-center gap-2">
            <div className="relative h-2 flex-1 rounded-full bg-surface-container-high">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-on-surface-low"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-bold text-on-surface-low">
              {completionRate}%
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

function JourneyCardSkeleton() {
  return (
    <div className="flex h-32 w-full animate-pulse items-center gap-5 rounded-3xl bg-surface-container p-4">
      <div className="size-24 shrink-0 rounded-[32px] bg-surface-container-high" />
      <div className="flex h-[87.5px] flex-1 flex-col gap-2">
        <div className="h-4 w-3/4 rounded bg-surface-container-high" />
        <div className="h-3 w-1/2 rounded bg-surface-container-high" />
      </div>
    </div>
  )
}

function HomeContent() {
  const router = useRouter()
  const { data, isPending, isError } = useHomeSnapshot()

  const dailyPrompt = data?.dailyPrompt ?? null
  const activeJourneys = data?.activeJourneys.slice(0, 2) ?? []

  return (
    <>
      {/* Greeting */}
      <div className="mt-4 px-6">
        <h1 className="text-4xl leading-[1.1] font-medium tracking-tight text-on-surface">
          오늘도 글을 써볼까요?
        </h1>
      </div>

      {/* Daily Topic Card */}
      <div className="mt-6 px-4">
        <div className="flex min-h-45 flex-col justify-between rounded-[32px] bg-surface-container-high p-6">
          <div className="flex flex-col gap-2.75">
            <div className="flex items-center gap-1.5">
              <HugeiconsIcon
                icon={FallingStarIcon}
                size={16}
                color="currentColor"
                strokeWidth={1.5}
                className="text-on-surface-low"
              />
              <span className="text-sm font-medium text-on-surface-low">
                오늘의 추천 글감
              </span>
            </div>
            {isPending ? (
              <div className="h-9 w-4/5 animate-pulse rounded bg-surface-container" />
            ) : isError || !dailyPrompt ? (
              <p className="text-2xl leading-9 font-medium text-on-surface-lowest">
                오늘의 글감을 불러올 수 없어요
              </p>
            ) : (
              <button
                type="button"
                className="text-left text-2xl leading-9 font-medium text-on-surface-low"
                onClick={() => router.push(`/prompts/${dailyPrompt.id}`)}
              >
                {dailyPrompt.title}
              </button>
            )}
          </div>
          {!isPending && dailyPrompt ? (
            <p className="text-right text-xs font-medium text-on-surface-low">
              지금까지 {dailyPrompt.responseCount.toLocaleString()}명이
              응답했어요
            </p>
          ) : null}
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
          {isPending ? (
            <>
              <JourneyCardSkeleton />
              <JourneyCardSkeleton />
            </>
          ) : isError ? (
            <p className="px-2 text-sm text-on-surface-low">
              여정 정보를 불러올 수 없어요
            </p>
          ) : activeJourneys.length === 0 ? (
            <p className="px-2 text-sm text-on-surface-low">
              진행 중인 여정이 없어요
            </p>
          ) : (
            activeJourneys.map((journey) => (
              <JourneyCard
                key={journey.journeyId}
                journeyId={journey.journeyId}
                thumbnailUrl={journey.thumbnailUrl}
                title={journey.title}
                description={journey.description}
                completionRate={Math.round(journey.completionRate)}
              />
            ))
          )}
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
    router.push(`/home?${params.toString()}`, { scroll: false })
  }

  return (
    <>
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

      <div className="flex-1 overflow-y-auto">
        {activeTab === "홈" && <HomeContent />}
        {activeTab === "글감" && <PromptArchiveView />}
        {activeTab === "여정" && <JourneyArchiveView />}
      </div>
    </>
  )
}
