import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const generatedClient = vi.hoisted(() => ({
  getProgress: vi.fn(),
}))

const refresh = vi.hoisted(() => vi.fn())

vi.mock("@workspace/http-client/learner", () => generatedClient)
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}))

import { HomePage } from "@/features/learner-home/ui/home-page"
import { HomeProgressClient } from "@/features/learner-home/ui/home-progress-client"
import type {
  LearnerProfileStatsDto,
  LearnerProgressPageDto,
} from "@/shared/http/learner-api-client"

const profileStats: LearnerProfileStatsDto = {
  completedLessons: 0,
  currentStreakDays: 0,
  lastActiveDate: null,
  progressPercent: 0,
  totalLessons: 0,
}

const version = { curriculumVersionId: "c1-v1", revision: 1 }
const emptyInProgress: LearnerProgressPageDto = {
  items: [],
  nextCursor: null,
}

const progressWithActiveCourse: LearnerProgressPageDto = {
  items: [
    {
      cover: null,
      id: "c1",
      learning: {
        completedLessons: 1,
        lastActivityAt: "2026-06-14T00:00:00.000Z",
        nextLesson: {
          currentStepId: "l2-s1",
          currentStepIndex: 0,
          estimatedMinutes: 7,
          id: "l2",
          title: "짧게 쓰기",
        },
        progressPercent: 33,
        status: "in_progress",
        totalLessons: 3,
        version,
      },
      title: "글쓰기 첫걸음 30일",
      visualKey: "basic-sentence-writing",
    },
  ],
  nextCursor: null,
}

const completedProgress: LearnerProgressPageDto = {
  items: [
    {
      cover: null,
      id: "c2",
      learning: {
        completedAt: "2026-06-14T00:00:00.000Z",
        completedLessons: 1,
        lastActivityAt: "2026-06-14T00:00:00.000Z",
        nextLesson: null,
        progressPercent: 100,
        status: "completed",
        totalLessons: 1,
        version: { curriculumVersionId: "c2-v1", revision: 1 },
      },
      title: "완료한 코스",
      visualKey: "expression",
    },
  ],
  nextCursor: null,
}

describe("홈 화면", () => {
  beforeEach(() => {
    generatedClient.getProgress.mockReset()
    refresh.mockReset()
  })

  it("fresh 상태의 인사, 통계, 진행중 탭 CTA를 보여준다", () => {
    render(
      <HomePage
        inProgress={emptyInProgress}
        learnerName="글쓰기 탐험가"
        profileStats={profileStats}
      />
    )

    expect(screen.getByText("안녕하세요 👋")).toBeInTheDocument()
    expect(
      screen.getByRole("heading", {
        name: /글쓰기님,\s*오늘도 함께 써봐요\./,
      })
    ).toBeInTheDocument()
    expect(screen.getByText("0일")).toBeInTheDocument()
    expect(screen.getByText("연속 학습")).toBeInTheDocument()
    expect(screen.getByText("0개")).toBeInTheDocument()
    expect(screen.getByText("완료한 레슨")).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "진행중" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "완료" })).toBeInTheDocument()

    const startCard = screen.getByRole("link", { name: /코스 둘러보기/ })
    expect(startCard).toHaveAttribute("href", "/app/courses")
    expect(
      within(startCard).getByText("지금 시작해볼까요?")
    ).toBeInTheDocument()
    expect(
      within(startCard).getByRole("heading", {
        name: /새로운 코스를\s*선택해 보세요/,
      })
    ).toBeInTheDocument()
  })

  it("진행 중 코스와 다음 레슨 링크를 보여준다", () => {
    render(
      <HomePage
        inProgress={progressWithActiveCourse}
        learnerName="몽쉘"
        profileStats={{
          ...profileStats,
          completedLessons: 1,
          currentStreakDays: 2,
        }}
      />
    )

    expect(screen.getByRole("tab", { name: "진행중" })).toBeInTheDocument()
    expect(screen.getAllByText("글쓰기 첫걸음 30일")).toHaveLength(1)
    expect(screen.getAllByText("1/3")).toHaveLength(1)
    expect(screen.getAllByText("짧게 쓰기")).toHaveLength(1)
    expect(
      screen.getAllByRole("img", { name: "글쓰기 첫걸음 30일" })
    ).toHaveLength(1)
    expect(
      screen.getByRole("img", { name: "글쓰기 첫걸음 30일" })
    ).toHaveAttribute("sizes", "(min-width: 1024px) 176px, 100vw")

    expect(
      screen.getByRole("link", { name: /글쓰기 첫걸음 30일/ })
    ).toHaveAttribute("href", "/app/courses/c1")
    expect(screen.getByRole("link", { name: /짧게 쓰기/ })).toHaveAttribute(
      "href",
      "/app/lesson?lesson_id=l2"
    )
  })

  it("완료 탭에서 완료 코스 목록을 불러온다", async () => {
    const user = userEvent.setup()
    generatedClient.getProgress.mockResolvedValue(completedProgress)

    render(<HomeProgressClient inProgress={emptyInProgress} />)

    await user.click(screen.getByRole("tab", { name: "완료" }))

    expect(generatedClient.getProgress).toHaveBeenCalledWith(
      { status: "completed" },
      { signal: expect.any(AbortSignal) }
    )
    expect(await screen.findAllByText("완료한 코스")).toHaveLength(1)
    expect(
      screen.queryByRole("heading", {
        name: /새로운 코스를\s*선택해 보세요/,
      })
    ).not.toBeInTheDocument()
  })

  it("진행 중 코스의 다음 cursor 페이지를 이어 붙인다", async () => {
    const user = userEvent.setup()
    const initialPage: LearnerProgressPageDto = {
      items: progressWithActiveCourse.items,
      nextCursor: "progress-cursor-2",
    }
    const nextPage: LearnerProgressPageDto = {
      items: [
        {
          cover: null,
          id: "c3",
          learning: {
            completedLessons: 0,
            lastActivityAt: "2026-06-15T00:00:00.000Z",
            nextLesson: {
              currentStepId: "l3-s1",
              currentStepIndex: 0,
              estimatedMinutes: 5,
              id: "l3",
              title: "문장 다듬기",
            },
            progressPercent: 0,
            status: "in_progress",
            totalLessons: 2,
            version: { curriculumVersionId: "c3-v1", revision: 1 },
          },
          title: "표현 확장",
          visualKey: "expression",
        },
      ],
      nextCursor: null,
    }
    generatedClient.getProgress.mockResolvedValue(nextPage)

    render(<HomeProgressClient inProgress={initialPage} />)

    await user.click(
      screen.getByRole("button", { name: "진행 중 코스 더 보기" })
    )

    expect(generatedClient.getProgress).toHaveBeenCalledWith(
      { cursor: "progress-cursor-2", status: "in_progress" },
      { signal: expect.any(AbortSignal) }
    )
    expect(await screen.findByText("표현 확장")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "진행 중 코스 더 보기" })
    ).not.toBeInTheDocument()
  })
})
