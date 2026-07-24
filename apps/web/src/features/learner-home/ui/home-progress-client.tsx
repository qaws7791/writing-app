"use client"

import { useCallback, useState } from "react"

import { useRouter } from "next/navigation"
import { getProgress } from "@workspace/http-client/learner"
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
import {
  isLearnerApiAuthenticationError,
  settleLearnerApiRequest,
  type LearnerProgressPageDto,
} from "@/shared/http/learner-api-client"

export type HomeProgressClientProps = {
  readonly inProgress: LearnerProgressPageDto
}

export function HomeProgressClient({ inProgress }: HomeProgressClientProps) {
  const router = useRouter()
  const [completedState, setCompletedState] = useState<CompletedCoursesState>({
    status: "idle",
  })
  const [inProgressState, setInProgressState] = useState<ProgressCourseState>({
    courses: inProgress.items,
    loadMoreError: null,
    loadMoreStatus: "idle",
    nextCursor: inProgress.nextCursor,
  })

  const loadCompletedCourses = useCallback(async () => {
    setCompletedState({ status: "loading" })
    const result = await settleLearnerApiRequest(
      getProgress({ status: "completed" })
    )

    if (result.status === "error") {
      if (isLearnerApiAuthenticationError(result.error)) {
        router.refresh()
        return
      }
      setCompletedState({ message: result.error.message, status: "error" })
      return
    }

    setCompletedState({
      courses: result.value.items,
      loadMoreError: null,
      loadMoreStatus: "idle",
      nextCursor: result.value.nextCursor,
      status: "loaded",
    })
  }, [router])

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
      loadMoreError: null,
      loadMoreStatus: "loading",
    }))
    const result = await settleLearnerApiRequest(
      getProgress({
        cursor,
        status: "in_progress",
      })
    )

    if (result.status === "error") {
      if (isLearnerApiAuthenticationError(result.error)) {
        router.refresh()
        return
      }
      setInProgressState((state) => ({
        ...state,
        loadMoreError: result.error.message,
        loadMoreStatus: "error",
      }))
      return
    }

    setInProgressState((state) => ({
      courses: appendUniqueProgressCourses(state.courses, result.value.items),
      loadMoreError: null,
      loadMoreStatus: "idle",
      nextCursor: result.value.nextCursor,
    }))
  }, [inProgressState.loadMoreStatus, inProgressState.nextCursor, router])

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
        ? { ...state, loadMoreError: null, loadMoreStatus: "loading" }
        : state
    )
    const result = await settleLearnerApiRequest(
      getProgress({
        cursor,
        status: "completed",
      })
    )

    if (result.status === "error") {
      if (isLearnerApiAuthenticationError(result.error)) {
        router.refresh()
        return
      }
      setCompletedState((state) =>
        state.status === "loaded"
          ? {
              ...state,
              loadMoreError: result.error.message,
              loadMoreStatus: "error",
            }
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
            loadMoreError: null,
            loadMoreStatus: "idle",
            nextCursor: result.value.nextCursor,
            status: "loaded",
          }
        : state
    )
  }, [completedState, router])

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
              loadMoreError={inProgressState.loadMoreError}
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
