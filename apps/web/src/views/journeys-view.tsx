"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, Layers01Icon } from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"
import { useHomeSnapshot } from "@/features/home"
import { useJourneys } from "@/features/journeys"

const CATEGORY_LABEL: Record<
  "writing_skill" | "mindfulness" | "practical",
  string
> = {
  writing_skill: "글쓰기 역량",
  mindfulness: "자기 탐구",
  practical: "실용 글쓰기",
}

type Category = string

function ActiveJourneyCard({
  id,
  title,
  subtitle,
  progress,
  imageUrl,
}: {
  id: number
  title: string
  subtitle: string
  progress: number
  imageUrl: string
}) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push(`/journeys/${id}`)}
      className="flex h-32 w-full items-center gap-5 rounded-3xl bg-surface-container p-4 text-left transition-colors hover:bg-surface-container-high"
    >
      <div className="size-24 shrink-0 overflow-hidden rounded-[18px] bg-surface-container-high">
        <img src={imageUrl} alt={title} className="size-full object-cover" />
      </div>
      <div className="flex h-[87.5px] flex-1 flex-col gap-1">
        <p className="text-title-medium text-on-surface">{title}</p>
        <p className="pb-1.5 text-body-small text-on-surface-low">{subtitle}</p>
        <div className="flex flex-1 items-end">
          <div className="flex w-full items-center gap-2">
            <div className="relative h-2 flex-1 rounded-full bg-surface-container-high">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-on-surface-low"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="shrink-0 text-label-medium-em text-on-surface-low">
              {progress}%
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

function CompletedJourneyCard({
  id,
  title,
  description,
  imageUrl,
}: {
  id: number
  title: string
  description: string
  imageUrl: string
}) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push(`/journeys/${id}`)}
      className="flex items-center gap-4 rounded-3xl bg-surface-container p-4 text-left transition-colors hover:bg-surface-container-high"
    >
      <div className="size-16 shrink-0 overflow-hidden rounded-2xl bg-surface-container-high">
        <img src={imageUrl} alt={title} className="size-full object-cover" />
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <p className="text-title-small-em text-on-surface">{title}</p>
        <p className="line-clamp-1 text-label-large text-on-surface-low">
          {description}
        </p>
      </div>
      <HugeiconsIcon
        icon={CheckmarkCircle02Icon}
        size={20}
        color="currentColor"
        strokeWidth={1.5}
        className="shrink-0 text-primary"
      />
    </button>
  )
}

function DiscoverJourneyCard({
  id,
  title,
  description,
  sessionCount,
  imageUrl,
}: {
  id: number
  title: string
  description: string
  sessionCount: number
  imageUrl: string
}) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push(`/journeys/${id}`)}
      className="flex h-32 w-full items-center gap-5 rounded-3xl bg-surface-container p-4 text-left transition-colors hover:bg-surface-container-high"
    >
      <div className="size-24 shrink-0 overflow-hidden rounded-[18px] bg-surface-container-high">
        <img src={imageUrl} alt={title} className="size-full object-cover" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5">
        <div className="flex flex-col gap-1">
          <p className="text-title-medium text-on-surface">{title}</p>
          <p className="line-clamp-2 text-body-medium text-on-surface-low">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          <HugeiconsIcon
            icon={Layers01Icon}
            size={12}
            color="currentColor"
            strokeWidth={1.5}
            className="text-on-surface-low"
          />
          <span className="text-label-small text-on-surface-low uppercase">
            {sessionCount}개의 세션
          </span>
        </div>
      </div>
    </button>
  )
}

export default function JourneysView() {
  const {
    data: home,
    isPending: isHomePending,
    isError: isHomeError,
  } = useHomeSnapshot()
  const {
    data: completedJourneysData,
    isPending: isCompletedPending,
    isError: isCompletedError,
  } = useJourneys({ status: "completed" })
  const { data: allJourneysData, isPending: isAllPending } = useJourneys()
  const [selectedCategory, setSelectedCategory] = useState<Category>("전체")

  const activeJourneys =
    home?.activeJourneys.map((journey) => ({
      id: journey.journeyId,
      title: journey.title,
      subtitle: `${journey.currentSessionOrder}번째 세션 진행 중`,
      progress: Math.round(journey.completionRate * 100),
      imageUrl:
        journey.thumbnailUrl ??
        `https://picsum.photos/seed/active-journey-${journey.journeyId}/600/400`,
    })) ?? []

  const completedJourneys =
    completedJourneysData?.items.map((journey) => ({
      id: journey.id,
      title: journey.title,
      description: journey.description,
      imageUrl:
        journey.thumbnailUrl ??
        `https://picsum.photos/seed/journey-${journey.id}/200/200`,
    })) ?? []

  const discoverJourneys =
    allJourneysData?.items.map((journey) => ({
      id: journey.id,
      title: journey.title,
      description: journey.description,
      sessionCount: journey.sessionCount,
      imageUrl:
        journey.thumbnailUrl ??
        `https://picsum.photos/seed/journey-card-${journey.id}/600/400`,
      category: CATEGORY_LABEL[journey.category],
    })) ?? []

  const categories = [
    "전체",
    ...Array.from(new Set(discoverJourneys.map((journey) => journey.category))),
  ]

  const filteredJourneys =
    selectedCategory === "전체"
      ? discoverJourneys
      : discoverJourneys.filter(
          (journey) => journey.category === selectedCategory
        )

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-headline-small-em text-on-surface">여정</h1>
      </div>

      {/* Active Journeys Section */}
      {(isHomePending || activeJourneys.length > 0) && (
        <section className="flex flex-col gap-4 px-4 pt-4">
          <h2 className="px-2 text-title-medium-em text-on-surface-low">
            진행 중인 여정
          </h2>
          {isHomePending
            ? Array.from({ length: 2 }, (_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-3xl bg-surface-container"
                />
              ))
            : activeJourneys.map((journey) => (
                <ActiveJourneyCard key={journey.id} {...journey} />
              ))}
          {isHomeError && (
            <div className="rounded-3xl bg-surface-container p-6 text-center text-body-medium text-on-surface-low">
              여정을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
            </div>
          )}
        </section>
      )}

      {/* Completed Journeys Section */}
      {(isCompletedPending || completedJourneys.length > 0) && (
        <section className="flex flex-col gap-4 px-4 pt-8">
          <h2 className="px-2 text-title-medium-em text-on-surface-low">
            완료한 여정
          </h2>
          {isCompletedPending
            ? Array.from({ length: 2 }, (_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-3xl bg-surface-container"
                />
              ))
            : completedJourneys.map((journey) => (
                <CompletedJourneyCard key={journey.id} {...journey} />
              ))}
          {isCompletedError && (
            <div className="rounded-3xl bg-surface-container p-6 text-center text-body-medium text-on-surface-low">
              완료한 여정을 불러오지 못했어요.
            </div>
          )}
        </section>
      )}

      {/* Discover Section */}
      <section className="flex flex-col pt-8">
        <h2 className="px-6 text-title-medium-em text-on-surface-low">
          새 여정 시작하기
        </h2>

        {/* Category Filter Chips */}
        <div className="flex gap-2.5 overflow-x-auto px-4 py-4 [scrollbar-width:none]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 rounded-full px-5 py-2.5 text-title-small whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-on-primary"
                  : "bg-secondary-container text-on-surface-low"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Journey Cards */}
        <div className="flex flex-col gap-4 px-4 pb-8">
          {isAllPending ? (
            Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-3xl bg-surface-container"
              />
            ))
          ) : filteredJourneys.length === 0 ? (
            <div className="rounded-3xl bg-surface-container p-6 text-body-medium text-on-surface-low">
              조건에 맞는 여정이 아직 없어요.
            </div>
          ) : (
            filteredJourneys.map((journey) => (
              <DiscoverJourneyCard key={journey.id} {...journey} />
            ))
          )}
        </div>
      </section>
    </div>
  )
}
