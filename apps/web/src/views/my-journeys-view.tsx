"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Sun03Icon, FavouriteIcon } from "@hugeicons/core-free-icons"
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

interface ActiveJourney {
  id: number
  title: string
  subtitle: string
  progress: number
  imageUrl: string
}

interface JourneyCategory {
  id: string
  icon: "sun" | "heart"
  name: string
  themeCount: number
}

function ActiveJourneyCard({ journey }: { journey: ActiveJourney }) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push(`/journeys/${journey.id}`)}
      className="flex h-32 w-full items-center gap-5 rounded-3xl bg-surface-container p-4 text-left transition-colors hover:bg-surface-container-high"
    >
      <div className="size-24 shrink-0 overflow-hidden rounded-[18px] bg-surface-container-high">
        <img
          src={journey.imageUrl}
          alt={journey.title}
          className="size-full object-cover"
        />
      </div>
      <div className="flex h-[87.5px] flex-1 flex-col gap-1">
        <p className="text-lg leading-6 font-semibold text-on-surface">
          {journey.title}
        </p>
        <p className="pb-1.5 text-sm leading-4 font-medium text-on-surface-low">
          {journey.subtitle}
        </p>
        <div className="flex flex-1 items-end">
          <div className="flex w-full items-center gap-2">
            <div className="relative h-2 flex-1 rounded-full bg-surface-container-high">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-on-surface-low"
                style={{ width: `${journey.progress}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-bold text-on-surface-low">
              {journey.progress}%
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

function CategoryCard({ category }: { category: JourneyCategory }) {
  const icon = category.icon === "sun" ? Sun03Icon : FavouriteIcon

  return (
    <div className="flex h-33.75 flex-col justify-between rounded-[32px] bg-surface-container p-5">
      <div className="flex flex-col gap-4">
        <div className="flex size-10 items-center justify-center rounded-full bg-surface-container-highest">
          <HugeiconsIcon
            icon={icon}
            size={22}
            color="currentColor"
            strokeWidth={1.5}
            className="text-on-surface-low"
          />
        </div>
        <p className="text-lg leading-[22.5px] font-medium text-on-surface">
          {category.name}
        </p>
      </div>
      <p className="text-xs leading-4 font-medium text-on-surface-low">
        {category.themeCount}개 테마
      </p>
    </div>
  )
}

export default function MyJourneysView() {
  const router = useRouter()
  const {
    data: home,
    isPending: isHomePending,
    isError: isHomeError,
  } = useHomeSnapshot()
  const { data: journeys } = useJourneys()

  const activeJourneys: ActiveJourney[] =
    home?.activeJourneys.map((journey) => ({
      id: journey.journeyId,
      title: journey.title,
      subtitle: `${journey.currentSessionOrder}번째 세션 진행 중`,
      progress: Math.round(journey.completionRate * 100),
      imageUrl:
        journey.thumbnailUrl ??
        `https://picsum.photos/seed/active-journey-${journey.journeyId}/600/400`,
    })) ?? []

  const journeyCategories: JourneyCategory[] =
    journeys?.items.reduce<JourneyCategory[]>((acc, journey) => {
      const label = CATEGORY_LABEL[journey.category]
      const existing = acc.find((category) => category.name === label)

      if (existing) {
        existing.themeCount += 1
        return acc
      }

      acc.push({
        id: journey.category,
        icon: journey.category === "mindfulness" ? "heart" : "sun",
        name: label,
        themeCount: 1,
      })
      return acc
    }, []) ?? []

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <h1 className="text-2xl leading-6 font-semibold text-on-surface">
          여정
        </h1>
      </div>

      {/* Active Journeys */}
      <div className="flex flex-col gap-6 px-4">
        {isHomePending
          ? Array.from({ length: 2 }, (_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-3xl bg-surface-container"
              />
            ))
          : null}

        {isHomeError ? (
          <div className="rounded-3xl bg-surface-container p-6 text-center text-sm text-on-surface-low">
            내 여정을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
          </div>
        ) : null}

        {!isHomePending && !isHomeError && activeJourneys.length === 0 ? (
          <div className="rounded-3xl bg-surface-container p-6 text-center text-sm text-on-surface-low">
            아직 시작한 여정이 없어요. 나에게 맞는 여정을 찾아보세요!
          </div>
        ) : null}

        {!isHomePending && !isHomeError
          ? activeJourneys.map((journey) => (
              <ActiveJourneyCard key={journey.id} journey={journey} />
            ))
          : null}
      </div>

      {/* Find Journeys */}
      <div className="mt-4 flex flex-col gap-4 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-on-surface">여정 찾기</h2>
          <button
            onClick={() => router.push("/home?tab=journeys")}
            className="text-sm font-semibold text-on-surface-low"
          >
            더보기
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {journeyCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </div>
  )
}
