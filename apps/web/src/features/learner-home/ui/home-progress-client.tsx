"use client"

import { useCallback, useMemo, useState } from "react"

import type { LearnerProgressResponse } from "@workspace/contracts/learning"
import {
  getBrowserLearnerHomeApi,
  type LearnerHomeApi,
} from "@/features/learner-home/api/learner-home-api"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/ui/tabs"
import {
  ContinueCourseCard,
  StartCourseCta,
} from "@/features/learner-home/ui/home-course-cards"
import {
  CompletedCoursesPanel,
  ProgressCourseList,
} from "@/features/learner-home/ui/home-progress-panels"
import {
  appendUniqueProgressCourses,
  type CompletedCoursesState,
  type ProgressCourseState,
} from "@/features/learner-home/model/home-progress-state"

export type HomeProgressClientProps = {
  readonly api?: LearnerHomeApi
  readonly inProgress: LearnerProgressResponse
}

export function HomeProgressClient({
  api,
  inProgress,
}: HomeProgressClientProps) {
  const resolvedApi = useMemo(() => api ?? getBrowserLearnerHomeApi(), [api])
  const [completedState, setCompletedState] = useState<CompletedCoursesState>({
    status: "idle",
  })
  const [inProgressState, setInProgressState] = useState<ProgressCourseState>({
    courses: inProgress.items,
    loadMoreStatus: "idle",
    nextCursor: inProgress.nextCursor,
  })

  const loadCompletedCourses = useCallback(async () => {
    setCompletedState({ status: "loading" })
    const result = await resolvedApi.getProgress({ status: "completed" })

    if (result.status === "error") {
      setCompletedState({ status: "error" })
      return
    }

    setCompletedState({
      courses: result.value.items,
      loadMoreStatus: "idle",
      nextCursor: result.value.nextCursor,
      status: "loaded",
    })
  }, [resolvedApi])

  const loadMoreInProgressCourses = useCallback(async () => {
    if (
      inProgressState.nextCursor === null ||
      inProgressState.loadMoreStatus === "loading"
    ) {
      return
    }

    const cursor = inProgressState.nextCursor
    setInProgressState((state) => ({
      ...state,
      loadMoreStatus: "loading",
    }))
    const result = await resolvedApi.getProgress({
      cursor,
      status: "in_progress",
    })

    if (result.status === "error") {
      setInProgressState((state) => ({
        ...state,
        loadMoreStatus: "error",
      }))
      return
    }

    setInProgressState((state) => ({
      courses: appendUniqueProgressCourses(state.courses, result.value.items),
      loadMoreStatus: "idle",
      nextCursor: result.value.nextCursor,
    }))
  }, [inProgressState.loadMoreStatus, inProgressState.nextCursor, resolvedApi])

  const loadMoreCompletedCourses = useCallback(async () => {
    if (
      completedState.status !== "loaded" ||
      completedState.nextCursor === null ||
      completedState.loadMoreStatus === "loading"
    ) {
      return
    }

    const cursor = completedState.nextCursor
    setCompletedState((state) =>
      state.status === "loaded"
        ? { ...state, loadMoreStatus: "loading" }
        : state
    )
    const result = await resolvedApi.getProgress({
      cursor,
      status: "completed",
    })

    if (result.status === "error") {
      setCompletedState((state) =>
        state.status === "loaded"
          ? { ...state, loadMoreStatus: "error" }
          : state
      )
      return
    }

    setCompletedState((state) =>
      state.status === "loaded"
        ? {
            courses: appendUniqueProgressCourses(
              state.courses,
              result.value.items
            ),
            loadMoreStatus: "idle",
            nextCursor: result.value.nextCursor,
            status: "loaded",
          }
        : state
    )
  }, [completedState, resolvedApi])

  const handleTabChange = useCallback(
    (value: string) => {
      if (value === "completed" && completedState.status === "idle") {
        void loadCompletedCourses()
      }
    },
    [completedState.status, loadCompletedCourses]
  )

  return (
    <div className="flex-1 min-w-0">
      <Tabs
        className="flex w-full flex-col gap-4"
        defaultValue="in_progress"
        onValueChange={handleTabChange}
      >
        <TabsList className="w-fit shrink-0 self-start">
          <TabsTrigger value="in_progress">진행중</TabsTrigger>
          <TabsTrigger value="completed">완료</TabsTrigger>
        </TabsList>
        <TabsContent className="w-full flex-none" value="in_progress">
          {inProgressState.courses.length > 0 ? (
            <ProgressCourseList
              courses={inProgressState.courses}
              loadMoreLabel="진행 중 코스 더 보기"
              loadMoreStatus={inProgressState.loadMoreStatus}
              nextCursor={inProgressState.nextCursor}
              onLoadMore={() => {
                void loadMoreInProgressCourses()
              }}
              renderCard={(course, index) => (
                <ContinueCourseCard
                  course={course}
                  key={course.id}
                  priority={index === 0}
                />
              )}
            />
          ) : (
            <StartCourseCta />
          )}
        </TabsContent>

        <TabsContent className="w-full flex-none" value="completed">
          <CompletedCoursesPanel
            onLoadMore={() => {
              void loadMoreCompletedCourses()
            }}
            onRetry={() => {
              void loadCompletedCourses()
            }}
            state={completedState}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
