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
      body: "로서는 자격, 로써는 수단입니다. 헷갈리면 문맥에서 역할을 먼저 보세요.",
      id: "reading-1",
      sortOrder: 1,
      source: "공개 출처",
      title: "로서와 로써",
      type: "READING",
    },
    name: "READING",
    step: withFutureSecret({
      body: "로서는 자격, 로써는 수단입니다. 헷갈리면 문맥에서 역할을 먼저 보세요.",
      id: "reading-1",
      sortOrder: 1,
      source: "공개 출처",
      title: "로서와 로써",
      type: "READING",
    }),
  },
  {
    expected: {
      id: "compare-1",
      sortOrder: 2,
      title: "두 문장 비교",
      type: "COMPARE",
      versions: [
        { label: "전", text: "수정 전" },
        { label: "후", text: "수정 후" },
      ],
    },
    name: "COMPARE",
    step: withFutureSecret({
      id: "compare-1",
      sortOrder: 2,
      title: "두 문장 비교",
      type: "COMPARE",
      versions: [
        { label: "전", text: "수정 전" },
        { label: "후", text: "수정 후" },
      ],
    }),
  },
  {
    expected: {
      correct: "option-b",
      explanation: "둘째가 정답이에요.",
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
      explanation: "둘째가 정답이에요.",
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
      answer: ["word-a", "word-c"],
      blankCount: 2,
      choices: [
        { id: "word-a", text: "나는" },
        { id: "word-b", text: "글을" },
        { id: "word-c", text: "쓴다" },
      ],
      explanation: "서버 전용 빈칸 해설",
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
      correct: ["segment-a"],
      explanation: "서버 전용 선택 해설",
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
      correct: ["item-a", "item-b", "item-c"],
      explanation: "서버 전용 순서 해설",
      id: "order-1",
      items: [
        { id: "item-a", text: "나는" },
        { id: "item-b", text: "글을" },
        { id: "item-c", text: "쓴다" },
      ],
      sortOrder: 6,
      title: "순서 맞추기",
      type: "ORDER",
    },
    name: "ORDER",
    step: withFutureSecret({
      correct: ["item-a", "item-b", "item-c"],
      explanation: "서버 전용 순서 해설",
      id: "order-1",
      itemIds: ["item-a", "item-b", "item-c"],
      items: ["나는", "글을", "쓴다"],
      sortOrder: 6,
      title: "순서 맞추기",
      type: "ORDER",
    }),
  },
  {
    expected: {
      explanation: "서버 전용 매칭 해설",
      id: "match-1",
      leftItems: [
        { id: "left-a", text: "그러나" },
        { id: "left-b", text: "따라서" },
        { id: "left-c", text: "또한" },
      ],
      pairs: [
        { leftId: "left-a", rightId: "right-a" },
        { leftId: "left-b", rightId: "right-b" },
        { leftId: "left-c", rightId: "right-c" },
      ],
      rightItems: [
        { id: "right-a", text: "역접" },
        { id: "right-b", text: "인과" },
        { id: "right-c", text: "추가" },
      ],
      sortOrder: 7,
      title: "연결 짝짓기",
      type: "MATCH",
    },
    name: "MATCH",
    step: withFutureSecret({
      explanation: "서버 전용 매칭 해설",
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
      title: "연결 짝짓기",
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
      explanation: "서버 전용 분류 해설",
      id: "categorize-1",
      items: [
        { categoryId: "category-a", id: "cat-item-a", text: "첫 문장" },
        { categoryId: "category-b", id: "cat-item-b", text: "둘째 문장" },
        { categoryId: "category-c", id: "cat-item-c", text: "셋째 문장" },
        { categoryId: "category-a", id: "cat-item-d", text: "넷째 문장" },
      ],
      sortOrder: 8,
      title: "항목 분류",
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
      id: "categorize-1",
      items: [
        { categoryId: "category-a", id: "cat-item-a", text: "첫 문장" },
        { categoryId: "category-b", id: "cat-item-b", text: "둘째 문장" },
        { categoryId: "category-c", id: "cat-item-c", text: "셋째 문장" },
        { categoryId: "category-a", id: "cat-item-d", text: "넷째 문장" },
      ],
      sortOrder: 8,
      title: "항목 분류",
      type: "CATEGORIZE",
    }),
  },
  {
    expected: {
      correct: false,
      explanation: "서버 전용 판정 해설이에요.",
      id: "true-false-1",
      question: "참인지 거짓인지 판단하세요.",
      sortOrder: 9,
      statement: "근거는 주장을 반복하는 문장으로 충분하다.",
      type: "TRUE_FALSE",
    },
    name: "TRUE_FALSE",
    step: withFutureSecret({
      correct: false,
      explanation: "서버 전용 판정 해설이에요.",
      id: "true-false-1",
      question: "참인지 거짓인지 판단하세요.",
      sortOrder: 9,
      statement: "근거는 주장을 반복하는 문장으로 충분하다.",
      type: "TRUE_FALSE",
    }),
  },
  {
    expected: {
      correct: ["tile-a", "tile-d"],
      explanation: "서버 전용 조립 해설",
      id: "sentence-build-1",
      question: "어절을 모아 문장을 만드세요.",
      sortOrder: 10,
      tileCount: 2,
      tiles: [
        { id: "tile-a", text: "나는" },
        { id: "tile-b", text: "아주" },
        { id: "tile-c", text: "글을" },
        { id: "tile-d", text: "쓴다" },
      ],
      type: "SENTENCE_BUILD",
    },
    name: "SENTENCE_BUILD",
    step: withFutureSecret({
      correct: ["tile-a", "tile-d"],
      explanation: "서버 전용 조립 해설",
      id: "sentence-build-1",
      question: "어절을 모아 문장을 만드세요.",
      sortOrder: 10,
      tileIds: ["tile-a", "tile-b", "tile-c", "tile-d"],
      tiles: ["나는", "아주", "글을", "쓴다"],
      type: "SENTENCE_BUILD",
    }),
  },
  {
    expected: {
      correctFix: "fix-b",
      correctSegment: "segment-b",
      explanation: "서버 전용 교정 해설",
      fixes: [
        { id: "fix-a", text: "주장을 되풀이하며" },
        { id: "fix-b", text: "사실과 사례를 들며" },
      ],
      id: "error-correct-1",
      question: "오류 구간을 찾아 고치세요.",
      segments: [
        { id: "segment-a", text: "근거는" },
        { id: "segment-b", text: "주장을 되풀이하며" },
        { id: "segment-c", text: "독자를 설득한다." },
      ],
      sortOrder: 11,
      type: "ERROR_CORRECT",
    },
    name: "ERROR_CORRECT",
    step: withFutureSecret({
      correctFix: "fix-b",
      correctSegment: "segment-b",
      explanation: "서버 전용 교정 해설",
      fixIds: ["fix-a", "fix-b"],
      fixes: ["주장을 되풀이하며", "사실과 사례를 들며"],
      id: "error-correct-1",
      question: "오류 구간을 찾아 고치세요.",
      segmentIds: ["segment-a", "segment-b", "segment-c"],
      segments: ["근거는", "주장을 되풀이하며", "독자를 설득한다."],
      sortOrder: 11,
      type: "ERROR_CORRECT",
    }),
  },
] as const

function withFutureSecret(input: unknown) {
  return Object.assign({}, lessonStepDtoSchema.parse(input), { futureSecret })
}
