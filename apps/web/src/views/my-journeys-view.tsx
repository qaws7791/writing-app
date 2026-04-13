"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { useRouter } from "next/navigation"
import { Tabs, TabPanel, TabList, Tab } from "@workspace/ui/components/tabs"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useHomeSnapshot } from "@/features/home"
import { useJourneys } from "@/features/journeys"

interface ActiveJourney {
  id: number
  title: string
  subtitle: string
  progress: number
  imageUrl: string
}

interface CompletedJourney {
  id: number
  title: string
  description: string
  imageUrl: string
}

function ActiveJourneyCard({ journey }: { journey: ActiveJourney }) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push(`/journeys/${journey.id}`)}
      className="bg-surface-container hover:bg-surface-container-high flex h-32 w-full items-center gap-5 rounded-3xl p-4 text-left transition-colors"
    >
      <div className="bg-surface-container-high size-24 shrink-0 overflow-hidden rounded-[18px]">
        <img
          src={journey.imageUrl}
          alt={journey.title}
          className="size-full object-cover"
        />
      </div>
      <div className="flex h-[87.5px] flex-1 flex-col gap-1">
        <p className="text-title-medium text-on-surface">{journey.title}</p>
        <p className="text-body-small text-on-surface-low pb-1.5">
          {journey.subtitle}
        </p>
        <div className="flex flex-1 items-end">
          <div className="flex w-full items-center gap-2">
            <div className="bg-surface-container-high relative h-2 flex-1 rounded-full">
              <div
                className="bg-on-surface-low absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${journey.progress}%` }}
              />
            </div>
            <span className="text-label-medium-em text-on-surface-low shrink-0">
              {journey.progress}%
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

function CompletedJourneyCard({ journey }: { journey: CompletedJourney }) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push(`/journeys/${journey.id}`)}
      className="bg-surface-container hover:bg-surface-container-high flex items-center gap-4 rounded-3xl p-4 text-left transition-colors"
    >
      <div className="bg-surface-container-high size-16 shrink-0 overflow-hidden rounded-2xl">
        <img
          src={journey.imageUrl}
          alt={journey.title}
          className="size-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <p className="text-title-small-em text-on-surface">{journey.title}</p>
        <p className="text-label-large text-on-surface-low line-clamp-1">
          {journey.description}
        </p>
      </div>
      <HugeiconsIcon
        icon={CheckmarkCircle02Icon}
        size={20}
        color="currentColor"
        strokeWidth={1.5}
        className="text-primary shrink-0"
      />
    </button>
  )
}

export default function MyJourneysView() {
  const router = useRouter()
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

  const completedJourneys: CompletedJourney[] =
    completedJourneysData?.items.map((journey) => ({
      id: journey.id,
      title: journey.title,
      description: journey.description,
      imageUrl:
        journey.thumbnailUrl ??
        `https://picsum.photos/seed/journey-${journey.id}/200/200`,
    })) ?? []

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <h1 className="text-headline-small-em text-on-surface">나의 여정</h1>
        <button
          onClick={() => router.push("/journeys")}
          className="text-label-large-em text-on-surface-low"
        >
          여정 찾기
        </button>
      </div>

      {/* Tabs */}
      <Tabs defaultSelectedKey="in_progress" className="px-4">
        <TabList className="w-full">
          <Tab id="in_progress" className="flex-1">
            진행 중
          </Tab>
          <Tab id="completed" className="flex-1">
            완료
          </Tab>
        </TabList>

        {/* 진행 중 탭 */}
        <TabPanel id="in_progress" className="flex flex-col gap-4 pt-4">
          {isHomePending
            ? Array.from({ length: 2 }, (_, index) => (
                <Skeleton key={index} className="h-32 rounded-3xl" />
              ))
            : null}

          {isHomeError ? (
            <div className="bg-surface-container text-body-medium text-on-surface-low rounded-3xl p-6 text-center">
              여정을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
            </div>
          ) : null}

          {!isHomePending && !isHomeError && activeJourneys.length === 0 ? (
            <div className="bg-surface-container text-body-medium text-on-surface-low rounded-3xl p-6 text-center">
              아직 시작한 여정이 없어요. 나에게 맞는 여정을 찾아보세요!
            </div>
          ) : null}

          {!isHomePending && !isHomeError
            ? activeJourneys.map((journey) => (
                <ActiveJourneyCard key={journey.id} journey={journey} />
              ))
            : null}
        </TabPanel>

        {/* 완료 탭 */}
        <TabPanel id="completed" className="flex flex-col gap-4 pt-4">
          {isCompletedPending
            ? Array.from({ length: 2 }, (_, index) => (
                <Skeleton key={index} className="h-24 rounded-3xl" />
              ))
            : null}

          {isCompletedError ? (
            <div className="bg-surface-container text-body-medium text-on-surface-low rounded-3xl p-6 text-center">
              완료한 여정을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
            </div>
          ) : null}

          {!isCompletedPending &&
          !isCompletedError &&
          completedJourneys.length === 0 ? (
            <div className="bg-surface-container text-body-medium text-on-surface-low rounded-3xl p-6 text-center">
              아직 완료한 여정이 없어요. 여정을 시작해보세요!
            </div>
          ) : null}

          {!isCompletedPending && !isCompletedError
            ? completedJourneys.map((journey) => (
                <CompletedJourneyCard key={journey.id} journey={journey} />
              ))
            : null}
        </TabPanel>
      </Tabs>
    </div>
  )
}
