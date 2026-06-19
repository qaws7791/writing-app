import { describe, expect, it } from "vitest"

import { mapLesson } from "@/features/lessons/lesson-api-mappers"

describe("레슨 API mapper", () => {
  it("API 레슨 응답의 API step 타입 순서를 보존한다", () => {
    expect(
      mapLesson({
        category: "문장의 기본기",
        courseId: "c1",
        description: "명료한 문장을 살펴봅니다.",
        estimatedMinutes: 5,
        id: "l1",
        steps: [
          {
            body: "본문",
            guide: "가이드",
            id: "s1",
            sortOrder: 1,
            title: "읽기",
            type: "READING",
          },
          {
            analysis: "분석",
            id: "s2",
            sortOrder: 2,
            title: "비교",
            type: "COMPARE",
            versions: [{ label: "A", text: "문장" }],
          },
          {
            correct: "a",
            explanation: "설명",
            id: "s3",
            options: [{ id: "a", text: "선택지" }],
            question: "질문",
            sortOrder: 3,
            type: "MULTIPLE_CHOICE",
          },
          {
            answer: ["단어"],
            explanation: "설명",
            id: "s4",
            sortOrder: 4,
            template: "빈칸 ___",
            type: "FILL_BLANK",
            words: ["단어"],
          },
          {
            correct: [0],
            explanation: "설명",
            id: "s5",
            question: "질문",
            segments: ["구간"],
            sortOrder: 5,
            type: "SELECT",
          },
          {
            correct: ["문장"],
            explanation: "설명",
            id: "s6",
            items: ["문장"],
            sortOrder: 6,
            title: "순서",
            type: "ORDER",
          },
          { id: "s7", min: 1, sortOrder: 7, type: "WRITE" },
          {
            allowRetry: true,
            feedback: "피드백",
            focus: "초점",
            id: "s8",
            score: 1,
            scoreMax: 1,
            showScore: true,
            sortOrder: 8,
            target: "s7",
            type: "AI_FEEDBACK",
          },
          {
            explanation: "설명",
            guide: "가이드",
            id: "s9",
            pairs: [{ left: "왼쪽", right: "오른쪽" }],
            sortOrder: 9,
            title: "짝짓기",
            type: "MATCH",
          },
          {
            categories: [{ id: "A", label: "분류" }],
            explanation: "설명",
            guide: "가이드",
            id: "s10",
            items: [{ categoryId: "A", id: "i1", text: "항목" }],
            sortOrder: 10,
            title: "분류",
            type: "CATEGORIZE",
          },
        ],
        summary: ["좋은 문장은 모호하지 않다"],
        title: "좋은 문장이란 무엇인가",
        unitId: "u1",
      })
    ).toMatchObject({
      id: "l1",
      steps: [
        { id: "s1", order: 1, type: "READING" },
        { id: "s2", order: 2, type: "COMPARE" },
        { id: "s3", order: 3, type: "MULTIPLE_CHOICE" },
        { id: "s4", order: 4, type: "FILL_BLANK" },
        { id: "s5", order: 5, type: "SELECT" },
        { id: "s6", order: 6, type: "ORDER" },
        { id: "s7", order: 7, type: "WRITE" },
        { id: "s8", order: 8, type: "AI_FEEDBACK" },
        { id: "s9", order: 9, type: "MATCH" },
        { id: "s10", order: 10, type: "CATEGORIZE" },
      ],
    })
  })

  it("API step content를 타입별 내부 모델로 변환한다", () => {
    expect(
      mapLesson({
        category: "문장의 기본기",
        courseId: "c1",
        description: "명료한 문장을 살펴봅니다.",
        estimatedMinutes: 5,
        id: "l1",
        steps: [
          {
            body: "좋은 문장은 한 가지 의미를 분명히 전달합니다.",
            guide: "좋은 문장의 기준을 읽습니다.",
            id: "s1",
            sortOrder: 1,
            source: "글결",
            title: "명료성의 원칙",
            type: "READING",
          },
          {
            analysis: "구체적인 장면은 독자를 끌어당깁니다.",
            id: "s2",
            sortOrder: 2,
            title: "두 도입부 비교",
            type: "COMPARE",
            versions: [
              { label: "평범한 도입", text: "오늘은 글쓰기를 이야기한다." },
              { label: "훅이 있는 도입", text: "나는 3년간 매일 썼다." },
            ],
          },
          {
            correct: "b",
            explanation: "하나의 문단에는 하나의 핵심 주제문이 들어갑니다.",
            id: "s3",
            options: [
              { id: "a", text: "2개 이상" },
              { id: "b", text: "정확히 1개" },
            ],
            question: "한 문단에 들어가야 할 주제문의 수는?",
            sortOrder: 3,
            type: "MULTIPLE_CHOICE",
          },
          {
            answer: ["관찰"],
            explanation: "집중해서 살피는 행위에는 관찰이 정확합니다.",
            id: "s4",
            sortOrder: 4,
            template: "그는 발표를 ___ 했다.",
            type: "FILL_BLANK",
            words: ["보다", "관찰"],
          },
          {
            correct: [0, 1],
            explanation: "꾸준한 글쓰기는 주어부입니다.",
            id: "s5",
            question: "주어 역할을 하는 구간을 모두 선택하세요.",
            segments: ["꾸준한 ", "글쓰기는 ", "사고를 ", "정돈한다."],
            sortOrder: 5,
            type: "SELECT",
          },
          {
            correct: ["나는", "책을", "읽었다"],
            explanation: "한국어 기본 어순을 확인합니다.",
            id: "s6",
            items: ["나는", "책을", "읽었다"],
            sortOrder: 6,
            title: "문장을 자연스러운 어순으로",
            type: "ORDER",
          },
          {
            goal: 80,
            guide: "글 재료를 모읍니다.",
            id: "s7",
            max: 120,
            min: 20,
            sample: "오늘의 관찰을 짧게 적는다.",
            sortOrder: 7,
            title: "쓰기 전 5분 계획",
            type: "WRITE",
          },
          {
            allowRetry: true,
            feedback: "주장과 근거가 명확히 구분되어 있습니다.",
            focus: "명확성",
            id: "s8",
            score: 92,
            scoreMax: 100,
            showScore: true,
            sortOrder: 8,
            target: "s7",
            type: "AI_FEEDBACK",
          },
          {
            explanation: "접속사는 논리 관계를 보여줍니다.",
            guide: "왼쪽 접속사와 오른쪽 기능을 짝지으세요.",
            id: "s9",
            pairs: [{ left: "그러나", right: "역접" }],
            sortOrder: 9,
            title: "접속사와 기능 짝짓기",
            type: "MATCH",
          },
          {
            categories: [{ id: "A", label: "주제문" }],
            explanation: "단락은 주제문과 뒷받침으로 구성합니다.",
            guide: "각 문장의 역할을 분류하세요.",
            id: "s10",
            items: [
              {
                categoryId: "A",
                id: "i1",
                text: "꾸준한 글쓰기는 사고를 정돈한다.",
              },
            ],
            sortOrder: 10,
            title: "문장 분류하기",
            type: "CATEGORIZE",
          },
        ],
        summary: ["좋은 문장은 모호하지 않다"],
        title: "좋은 문장이란 무엇인가",
        unitId: "u1",
      })
    ).toMatchObject({
      steps: [
        {
          body: "좋은 문장은 한 가지 의미를 분명히 전달합니다.",
          source: "글결",
          type: "READING",
        },
        {
          analysis: "구체적인 장면은 독자를 끌어당깁니다.",
          versions: [
            { label: "평범한 도입", text: "오늘은 글쓰기를 이야기한다." },
            { label: "훅이 있는 도입", text: "나는 3년간 매일 썼다." },
          ],
        },
        {
          correct: "b",
          options: [
            { id: "a", text: "2개 이상" },
            { id: "b", text: "정확히 1개" },
          ],
        },
        {
          answer: ["관찰"],
          template: "그는 발표를 ___ 했다.",
        },
        {
          correct: [0, 1],
          segments: ["꾸준한 ", "글쓰기는 ", "사고를 ", "정돈한다."],
        },
        {
          correct: ["나는", "책을", "읽었다"],
          items: ["나는", "책을", "읽었다"],
        },
        {
          goal: 80,
          max: 120,
          min: 20,
          sample: "오늘의 관찰을 짧게 적는다.",
        },
        {
          allowRetry: true,
          focus: "명확성",
          score: 92,
          scoreMax: 100,
        },
        {
          pairs: [{ left: "그러나", right: "역접" }],
        },
        {
          categories: [{ id: "A", label: "주제문" }],
          items: [
            {
              categoryId: "A",
              id: "i1",
              text: "꾸준한 글쓰기는 사고를 정돈한다.",
            },
          ],
        },
      ],
    })
  })
})
