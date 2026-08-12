import { lessonStepDtoSchema } from "@workspace/contracts/content/course"

const futureSecret = "__future_server_only_secret__"

export const learnerStepPresentationFutureSecret = futureSecret

export const learnerStepPresentationContext = {
  learnerScope: "learner-scope",
  lessonId: "lesson-1",
  versionId: "curriculum:course-1:1",
} as const

/**
 * `expected`의 항목 순서는 원본 순서다. 결정적 shuffle의 hash 구현을 계약으로
 * 고정하지 않도록, 소비 측은 항목을 stable ID로 정렬해 비교한다.
 */
export const learnerStepPresentationCases = [
  {
    expected: {
      body: "공개 본문",
      guide: "공개 안내",
      id: "reading-1",
      sortOrder: 1,
      source: "공개 출처",
      title: "읽기",
      type: "READING",
    },
    name: "READING",
    step: withFutureSecret({
      body: "공개 본문",
      guide: "공개 안내",
      id: "reading-1",
      sortOrder: 1,
      source: "공개 출처",
      title: "읽기",
      type: "READING",
    }),
  },
  {
    expected: {
      id: "compare-1",
      sortOrder: 2,
      title: "비교",
      type: "COMPARE",
      versions: [
        { label: "전", text: "수정 전" },
        { label: "후", text: "수정 후" },
      ],
    },
    name: "COMPARE",
    step: withFutureSecret({
      analysis: "서버 전용 분석",
      id: "compare-1",
      sortOrder: 2,
      title: "비교",
      type: "COMPARE",
      versions: [
        { label: "전", text: "수정 전" },
        { label: "후", text: "수정 후" },
      ],
    }),
  },
  {
    expected: {
      id: "choice-1",
      options: [
        { id: "option-a", text: "첫째" },
        { id: "option-b", text: "둘째" },
        { id: "option-c", text: "셋째" },
      ],
      question: "정답은?",
      sortOrder: 3,
      type: "MULTIPLE_CHOICE",
    },
    name: "MULTIPLE_CHOICE",
    step: withFutureSecret({
      correct: "option-b",
      explanation: "서버 전용 정답 해설",
      id: "choice-1",
      options: [
        { id: "option-a", text: "첫째" },
        { id: "option-b", text: "둘째" },
        { id: "option-c", text: "셋째" },
      ],
      question: "정답은?",
      sortOrder: 3,
      type: "MULTIPLE_CHOICE",
    }),
  },
  {
    expected: {
      blankCount: 2,
      choices: [
        { id: "word-a", text: "나는" },
        { id: "word-b", text: "글을" },
        { id: "word-c", text: "쓴다" },
      ],
      id: "blank-1",
      sortOrder: 4,
      template: "___ ___",
      type: "FILL_BLANK",
    },
    name: "FILL_BLANK",
    step: withFutureSecret({
      answer: ["word-a", "word-c"],
      explanation: "서버 전용 빈칸 해설",
      id: "blank-1",
      sortOrder: 4,
      template: "___ ___",
      type: "FILL_BLANK",
      wordIds: ["word-a", "word-b", "word-c"],
      words: ["나는", "글을", "쓴다"],
    }),
  },
  {
    expected: {
      id: "select-1",
      items: [
        { id: "segment-a", text: "주어" },
        { id: "segment-b", text: "목적어" },
        { id: "segment-c", text: "서술어" },
      ],
      layout: "inline",
      question: "주어를 고르세요.",
      sortOrder: 5,
      type: "SELECT",
    },
    name: "SELECT",
    step: withFutureSecret({
      correct: ["segment-a"],
      explanation: "서버 전용 선택 해설",
      id: "select-1",
      layout: "inline",
      question: "주어를 고르세요.",
      segmentIds: ["segment-a", "segment-b", "segment-c"],
      segments: ["주어", "목적어", "서술어"],
      sortOrder: 5,
      type: "SELECT",
    }),
  },
  {
    expected: {
      id: "order-1",
      items: [
        { id: "item-a", text: "나는" },
        { id: "item-b", text: "글을" },
        { id: "item-c", text: "쓴다" },
      ],
      showNumbers: true,
      sortOrder: 6,
      title: "순서",
      type: "ORDER",
    },
    name: "ORDER",
    step: withFutureSecret({
      correct: ["item-a", "item-b", "item-c"],
      explanation: "서버 전용 순서 해설",
      id: "order-1",
      itemIds: ["item-a", "item-b", "item-c"],
      items: ["나는", "글을", "쓴다"],
      showNumbers: true,
      sortOrder: 6,
      title: "순서",
      type: "ORDER",
    }),
  },
  {
    expected: {
      guide: "연결하세요.",
      id: "match-1",
      leftItems: [
        { id: "left-a", text: "그러나" },
        { id: "left-b", text: "따라서" },
        { id: "left-c", text: "또한" },
      ],
      rightItems: [
        { id: "right-a", text: "역접" },
        { id: "right-b", text: "인과" },
        { id: "right-c", text: "추가" },
      ],
      sortOrder: 7,
      title: "짝짓기",
      type: "MATCH",
    },
    name: "MATCH",
    step: withFutureSecret({
      explanation: "서버 전용 매칭 해설",
      guide: "연결하세요.",
      id: "match-1",
      pairs: [
        {
          left: "그러나",
          leftId: "left-a",
          right: "역접",
          rightId: "right-a",
        },
        {
          left: "따라서",
          leftId: "left-b",
          right: "인과",
          rightId: "right-b",
        },
        {
          left: "또한",
          leftId: "left-c",
          right: "추가",
          rightId: "right-c",
        },
      ],
      sortOrder: 7,
      title: "짝짓기",
      type: "MATCH",
    }),
  },
  {
    expected: {
      categories: [
        { id: "category-a", text: "주장" },
        { id: "category-b", text: "근거" },
        { id: "category-c", text: "예시" },
      ],
      guide: "분류하세요.",
      id: "categorize-1",
      items: [
        { id: "cat-item-a", text: "첫 문장" },
        { id: "cat-item-b", text: "둘째 문장" },
        { id: "cat-item-c", text: "셋째 문장" },
      ],
      sortOrder: 8,
      title: "분류",
      type: "CATEGORIZE",
    },
    name: "CATEGORIZE",
    step: withFutureSecret({
      categories: [
        { id: "category-a", label: "주장" },
        { id: "category-b", label: "근거" },
        { id: "category-c", label: "예시" },
      ],
      explanation: "서버 전용 분류 해설",
      guide: "분류하세요.",
      id: "categorize-1",
      items: [
        { categoryId: "category-a", id: "cat-item-a", text: "첫 문장" },
        { categoryId: "category-b", id: "cat-item-b", text: "둘째 문장" },
        { categoryId: "category-c", id: "cat-item-c", text: "셋째 문장" },
      ],
      sortOrder: 8,
      title: "분류",
      type: "CATEGORIZE",
    }),
  },
] as const

function withFutureSecret(input: unknown) {
  return Object.assign({}, lessonStepDtoSchema.parse(input), { futureSecret })
}
