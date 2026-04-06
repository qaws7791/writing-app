"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Sun03Icon, FavouriteIcon } from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"

const JOURNEY_IMAGE_1 =
  "https://www.figma.com/api/mcp/asset/1a3a4942-67ce-4428-b640-f9df6d44775c"
const JOURNEY_IMAGE_2 =
  "https://www.figma.com/api/mcp/asset/2ae9530d-daa9-4a43-afd4-317a38251550"

interface ActiveJourney {
  id: string
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

const ACTIVE_JOURNEYS: ActiveJourney[] = [
  {
    id: "1",
    title: "새벽의 대화",
    subtitle: "완성된 단편선",
    progress: 65,
    imageUrl: JOURNEY_IMAGE_1,
  },
  {
    id: "2",
    title: "나를 찾는 여행",
    subtitle: "자아 성찰 에세이",
    progress: 14,
    imageUrl: JOURNEY_IMAGE_2,
  },
]

const JOURNEY_CATEGORIES: JourneyCategory[] = [
  { id: "1", icon: "sun", name: "일상의 발견", themeCount: 12 },
  { id: "2", icon: "heart", name: "관계의 밀도", themeCount: 8 },
  { id: "3", icon: "sun", name: "일상의 발견", themeCount: 12 },
  { id: "4", icon: "heart", name: "관계의 밀도", themeCount: 8 },
  { id: "5", icon: "sun", name: "일상의 발견", themeCount: 12 },
  { id: "6", icon: "heart", name: "관계의 밀도", themeCount: 8 },
]

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
        {ACTIVE_JOURNEYS.length === 0 ? (
          <div className="rounded-3xl bg-surface-container p-6 text-center text-sm text-on-surface-low">
            아직 시작한 여정이 없어요. 나에게 맞는 여정을 찾아보세요!
          </div>
        ) : (
          ACTIVE_JOURNEYS.map((journey) => (
            <ActiveJourneyCard key={journey.id} journey={journey} />
          ))
        )}
      </div>

      {/* Find Journeys */}
      <div className="mt-4 flex flex-col gap-4 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-on-surface">여정 찾기</h2>
          <button className="text-sm font-semibold text-on-surface-low">
            더보기
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {JOURNEY_CATEGORIES.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </div>
  )
}
