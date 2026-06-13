import type { Lesson } from "@/features/lessons/lesson-types"

const fallbackLessons: readonly Lesson[] = [
  {
    category: "문장의 기본기",
    courseId: "c1",
    description: "명료하고 군더더기 없는 문장을 살펴봅니다.",
    estimatedMinutes: 5,
    id: "l1",
    steps: [
      {
        body: "좋은 문장은 **한 가지 의미만을 분명히** 전달합니다.\n\n모호한 수식어와 중복 표현을 줄이는 것이 시작입니다.\n\n**나쁜 예시**\n> 어느 정도 괜찮은 결과가 나왔던 것 같습니다.\n\n**좋은 예시**\n> 목표치를 달성했습니다.\n\n문장을 다듬을 때는 다음을 확인하세요:\n- 한 문장에 생각이 하나인가?\n- 없애도 의미가 유지되는 단어가 있는가?\n- 독자가 다르게 해석할 여지가 있는가?\n\n---\n\n**명료성** — 문장이 단 하나의 해석으로 읽히는 정도",
        guide:
          "좋은 문장의 핵심 기준을 읽고, 내가 자주 쓰는 표현 중 모호한 것이 있는지 생각해보세요.",
        id: "l1-s1",
        order: 1,
        title: "명료성의 원칙",
        type: "READING",
      },
    ],
    summary: ["좋은 문장은 모호하지 않다", "한 문장에는 한 가지 생각만 담는다"],
    title: "좋은 문장이란 무엇인가",
    unitId: "u1",
  },
]

export function getFallbackLesson(id: string): Lesson | undefined {
  return fallbackLessons.find((lesson) => lesson.id === id)
}
