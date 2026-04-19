"use client"

import { useRouter } from "next/navigation"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/ui/tabs"
import { Skeleton } from "@workspace/ui/components/ui/skeleton"
import { useHomeSnapshot } from "@/features/home"
import { useJourneys } from "@/features/journeys"
import { JourneyCard } from "@/features/journeys/components/journey-card"

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

  const activeJourneys =
    home?.activeJourneys.map((journey) => ({
      id: journey.journeyId,
      title: journey.title,
      description: `${journey.currentSessionOrder}번째 세션 진행 중`,
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

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <h1 className="text-xl leading-snug font-semibold text-foreground">
          나의 여정
        </h1>
        <button
          onClick={() => router.push("/journeys")}
          className="text-sm leading-5 font-medium text-muted-foreground"
        >
          여정 찾기
        </button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="in_progress" className="px-4">
        <TabsList className="w-full">
          <TabsTrigger value="in_progress" className="flex-1">
            진행 중
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">
            완료
          </TabsTrigger>
        </TabsList>

        {/* 진행 중 탭 */}
        <TabsContent value="in_progress" className="flex flex-col gap-4 pt-4">
          {isHomePending
            ? Array.from({ length: 2 }, (_, index) => (
                <Skeleton key={index} className="h-32 rounded-3xl" />
              ))
            : null}

          {isHomeError ? (
            <div className="rounded-3xl bg-muted p-6 text-center text-sm leading-6 text-muted-foreground">
              여정을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
            </div>
          ) : null}

          {!isHomePending && !isHomeError && activeJourneys.length === 0 ? (
            <div className="rounded-3xl bg-muted p-6 text-center text-sm leading-6 text-muted-foreground">
              아직 시작한 여정이 없어요. 나에게 맞는 여정을 찾아보세요!
            </div>
          ) : null}

          {!isHomePending && !isHomeError
            ? activeJourneys.map((journey) => (
                <JourneyCard key={journey.id} mode="active" {...journey} />
              ))
            : null}
        </TabsContent>

        {/* 완료 탭 */}
        <TabsContent value="completed" className="flex flex-col gap-4 pt-4">
          {isCompletedPending
            ? Array.from({ length: 2 }, (_, index) => (
                <Skeleton key={index} className="h-24 rounded-3xl" />
              ))
            : null}

          {isCompletedError ? (
            <div className="rounded-3xl bg-muted p-6 text-center text-sm leading-6 text-muted-foreground">
              완료한 여정을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
            </div>
          ) : null}

          {!isCompletedPending &&
          !isCompletedError &&
          completedJourneys.length === 0 ? (
            <div className="rounded-3xl bg-muted p-6 text-center text-sm leading-6 text-muted-foreground">
              아직 완료한 여정이 없어요. 여정을 시작해보세요!
            </div>
          ) : null}

          {!isCompletedPending && !isCompletedError
            ? completedJourneys.map((journey) => (
                <JourneyCard key={journey.id} mode="completed" {...journey} />
              ))
            : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
