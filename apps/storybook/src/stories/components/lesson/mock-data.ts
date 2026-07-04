import type { AiFeedbackViewModel } from "@workspace/ui/components/lesson/ai-feedback-answer"

export const readingDefaults = {
  title: "명료성의 원칙",
  guide:
    "좋은 문장의 핵심 기준을 읽고, 내가 자주 쓰는 표현 중 모호한 것이 있는지 생각해보세요.",
  body: "좋은 문장은 **한 가지 의미만을 분명히** 전달합니다.\n\n모호한 수식어와 중복 표현을 줄이는 것이 시작입니다.\n\n**나쁜 예시**\n> 어느 정도 괜찮은 결과가 나왔던 것 같습니다.\n\n**좋은 예시**\n> 목표치를 달성했습니다.",
  source: "글쓰기 입문 교재",
} as const

export const compareDefaults = {
  title: "두 도입부 비교",
  versions: [
    {
      label: "평범한 도입",
      text: "오늘은 글쓰기에 대해 이야기해 보려고 한다.",
    },
    {
      label: "훅이 있는 도입",
      text: "나는 3년간 매일 30분씩 글을 썼다. 어느 날 거울 앞에 선 내 생각이 달라져 있었다.",
    },
  ],
  analysis: "구체적인 장면과 변화의 암시는 독자를 다음 문장으로 끌어당깁니다.",
} as const

export const multipleChoiceDefaults = {
  question: "한 문단에 들어가야 할 주제문의 수는?",
  options: [
    { id: "a", text: "2개 이상" },
    { id: "b", text: "정확히 1개" },
    { id: "c", text: "없어도 된다" },
  ],
  correctOptionId: "b",
  checked: false as const,
} as const

export const fillBlankDefaults = {
  template: "그는 회의 내내 동료의 발표를 ___ 했다.",
  words: ["보다", "관찰", "쳐다", "구경"],
  blankCount: 1,
  checked: false as const,
} as const

export const selectDefaults = {
  question: "다음 문장에서 주어 역할을 하는 구간을 모두 선택하세요.",
  segments: ["꾸준한 ", "글쓰기는 ", "나의 ", "사고를 ", "정돈한다."],
  correctIndexes: [0, 1],
  explanation: '"꾸준한 글쓰기는"이 주어부입니다.',
  layout: undefined as string | undefined,
  checked: false as const,
} as const

export const orderDefaults = {
  items: ["나는", "어제", "도서관에서", "책을", "읽었다"],
  correctItems: ["나는", "어제", "도서관에서", "책을", "읽었다"],
  showNumbers: true,
  explanation:
    "한국어 기본 어순은 주어 - 시간 - 장소 - 목적어 - 서술어 입니다.",
  checked: false as const,
} as const

export const matchDefaults = {
  title: "접속사와 기능 짝짓기",
  guide: "왼쪽 접속사와 오른쪽 기능을 짝지어 보세요.",
  pairs: [
    { left: "그러나", right: "역접" },
    { left: "따라서", right: "인과" },
    { left: "예를 들어", right: "예시" },
    { left: "또한", right: "추가" },
  ],
  explanation: "접속사는 문장 사이의 논리 관계를 신호로 보여줍니다.",
  checked: false as const,
} as const

export const categorizeDefaults = {
  title: "문장 분류하기",
  guide: "각 문장이 단락에서 어떤 역할을 하는지 분류하세요.",
  categories: [
    { id: "A", label: "주제문" },
    { id: "B", label: "뒷받침" },
    { id: "C", label: "예시" },
  ],
  items: [
    { id: "i1", text: "꾸준한 글쓰기는 사고를 정돈한다.", categoryId: "A" },
    {
      id: "i2",
      text: "매일 쓰는 사람은 자기 생각을 더 명확히 표현한다.",
      categoryId: "B",
    },
    {
      id: "i3",
      text: "예컨대 일기를 3년 쓴 이는 회의에서도 핵심을 빠르게 짚는다.",
      categoryId: "C",
    },
    {
      id: "i4",
      text: "글쓰기 습관은 단순한 기술 이상의 효과를 낸다.",
      categoryId: "B",
    },
  ],
  explanation:
    "단락은 주제문 1개, 뒷받침 1~2개, 구체 예시로 구성하면 단단해집니다.",
  checked: false as const,
} as const

export const writeDefaults = {
  title: "띄어쓰기 교정",
  badge: "🩹 띄어쓰기",
  guide: "**힌트**: 조사 앞은 붙이고, 자립명사 뒤는 띄웁니다.",
  reference: "그는회의내동료의발표를집중해서들었다.",
  min: 20,
  max: 2000,
  draft: false,
  placeholder: "여기에 작성하세요...",
  sample: "그는 회의 내내 동료의 발표를 집중해서 들었다.",
  checked: false as const,
} as const

export const aiFeedbackDefaults = {
  focus: "명확성",
  draftText:
    "꾸준한 글쓰기는 사고를 정돈합니다. 매일 쓰는 사람은 자기 생각을 더 명확히 표현합니다.",
  allowRetry: true,
  mockOutcome: "success" as const,
} as const

export const aiFeedbackViewModel: AiFeedbackViewModel = {
  summary:
    "주장과 근거가 명확히 구분되어 있습니다. 근거에 구체적인 수치가 포함되어 설득력이 높습니다.",
  strengths: [
    "주제문이 한 문장에 하나의 생각만 담고 있습니다.",
    "근거가 주장을 직접 뒷받침합니다.",
  ],
  improvements: [
    "두 번째 문장에 구체적인 예시를 추가하면 더 설득력이 높아집니다.",
  ],
  nextAction: "근거 문장에 숫자나 사례를 하나 넣어 다시 작성해 보세요.",
  score: 92,
  scoreRange: [0, 100],
  showScore: true,
  remainingAttempts: 2,
}
