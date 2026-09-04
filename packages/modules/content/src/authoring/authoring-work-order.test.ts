import { describe, expect, it } from "vitest"

import { parseAuthoringWorkOrders } from "#content/authoring/authoring-work-order"

describe("parseAuthoringWorkOrders", () => {
  it("레슨 브리프 manifest를 파싱한다", () => {
    const parsed = parseAuthoringWorkOrders({
      courseId: "course-01-spelling",
      lessonsDirectory: "courses/course-01-spelling",
      orders: [
        {
          closing: "마지막 문장을 빈칸 두 개로 완성한다.",
          contrastPairs: Array.from({ length: 6 }, (_, index) => ({
            awkward: `어색한 판본 ${index + 1}`,
            correct: `바른 판본 ${index + 1}`,
          })),
          distractorRules: {
            allowed: ["로서와 로써를 바꾼 표현"],
            forbidden: ["조사 외 맞춤법 오류"],
          },
          forbidden: [],
          judgementAxis: "앞말이 자격인가 수단인가",
          lessonId: "lesson-spelling-roseo",
          scene: "팀 대화방에 올릴 회고 초안",
          thesis: "로서와 로써를 역할에 맞게 고른다.",
          title: "로서와 로써 구별하기",
        },
      ],
    })

    expect(parsed.defaultCourseId).toBe("course-01-spelling")
    expect(parsed.orders).toHaveLength(1)
  })

  it("대립쌍이 여섯 개 미만이면 거절한다", () => {
    expect(() =>
      parseAuthoringWorkOrders([
        {
          closing: "마지막 문장을 완성한다.",
          contrastPairs: [{ awkward: "어색", correct: "바름" }],
          distractorRules: { allowed: ["허용"], forbidden: ["금지"] },
          forbidden: [],
          judgementAxis: "축",
          lessonId: "lesson-a",
          scene: "장면",
          thesis: "테제",
          title: "제목",
        },
      ])
    ).toThrow()
  })
})
