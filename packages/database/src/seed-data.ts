import type {
  PromptLengthLabel,
  PromptLevel,
  PromptTopic,
} from "@workspace/backend-core"

export type SeedPrompt = {
  description: string
  id: number
  isTodayRecommended: boolean
  level: PromptLevel
  outline: string[]
  suggestedLengthLabel: PromptLengthLabel
  tags: string[]
  text: string
  tips: string[]
  todayRecommendationOrder: number | null
  topic: PromptTopic
}

export const seedPrompts: SeedPrompt[] = [
  {
    description:
      "최근에 생각이 달라졌던 계기와 그 뒤에 남은 감정을 구체적인 장면 중심으로 풀어냅니다.",
    id: 1,
    isTodayRecommended: true,
    level: 1,
    outline: [],
    suggestedLengthLabel: "짧음",
    tags: ["변화", "회고"],
    text: "최근에 내 생각이 바뀐 순간은?",
    tips: [
      "변화가 시작된 장면부터 써보세요.",
      "생각이 바뀌기 전과 후를 나눠 적어보세요.",
    ],
    todayRecommendationOrder: 1,
    topic: "자기이해",
  },
  {
    description:
      "익숙함이 주는 안전과 불안을 함께 살펴보며 사회적 관성 또는 개인 경험으로 확장합니다.",
    id: 2,
    isTodayRecommended: false,
    level: 2,
    outline: [],
    suggestedLengthLabel: "보통",
    tags: ["관성", "변화"],
    text: "사람들은 왜 익숙한 것을 떠나기 어려울까?",
    tips: [
      "자신의 경험을 먼저 적고 일반론으로 확장해보세요.",
      "떠나지 못하는 이유를 한 가지로 단정하지 마세요.",
    ],
    todayRecommendationOrder: null,
    topic: "사회",
  },
  {
    description:
      "하루 안에서 가장 조용한 시간을 떠올리며 지금의 감정과 리듬을 섬세하게 포착합니다.",
    id: 3,
    isTodayRecommended: true,
    level: 1,
    outline: [],
    suggestedLengthLabel: "짧음",
    tags: ["루틴", "감정"],
    text: "내 하루에서 가장 조용한 순간은 언제인가요?",
    tips: [
      "소리와 빛, 몸의 감각을 함께 써보세요.",
      "왜 그 시간이 필요한지도 적어보세요.",
    ],
    todayRecommendationOrder: 2,
    topic: "일상",
  },
  {
    description:
      "10년 뒤의 자신에게 편지를 쓰듯 현재의 고민과 바람, 미래에 남기고 싶은 말을 정리합니다.",
    id: 4,
    isTodayRecommended: false,
    level: 2,
    outline: [
      "지금의 나를 소개하기",
      "요즘 가장 많이 하는 생각",
      "10년 뒤에 꼭 전하고 싶은 말",
    ],
    suggestedLengthLabel: "보통",
    tags: ["미래", "편지"],
    text: "10년 후의 나에게 편지를 써보세요",
    tips: [
      "현재의 고민을 숨기지 말고 적어보세요.",
      "10년 뒤의 자신에게 질문을 남겨도 좋습니다.",
    ],
    todayRecommendationOrder: null,
    topic: "자기이해",
  },
  {
    description:
      "최근에 읽거나 본 콘텐츠가 생각을 어떻게 흔들었는지 인상적인 문장 하나를 중심으로 써봅니다.",
    id: 5,
    isTodayRecommended: false,
    level: 1,
    outline: [],
    suggestedLengthLabel: "짧음",
    tags: ["독서", "문화"],
    text: "최근에 읽은 글에서 가장 인상 깊었던 문장은?",
    tips: [
      "그 문장을 처음 만난 장면을 함께 적어보세요.",
      "왜 오래 남는지 감정의 이유를 풀어보세요.",
    ],
    todayRecommendationOrder: null,
    topic: "문화",
  },
  {
    description:
      "AI가 일상에 들어오며 편리함과 동시에 잃어가는 것을 자신의 경험과 관찰로 정리합니다.",
    id: 6,
    isTodayRecommended: true,
    level: 3,
    outline: [
      "AI가 일상에 들어온 장면",
      "편리해진 점",
      "잃어가고 있다고 느끼는 것",
      "앞으로의 균형점",
    ],
    suggestedLengthLabel: "깊이",
    tags: ["기술", "비평"],
    text: "AI가 일상에 들어오면서 잃어가는 것은?",
    tips: [
      "단순한 찬반 대신 양면을 함께 다뤄보세요.",
      "실제 사용 경험을 근거로 삼아보세요.",
    ],
    todayRecommendationOrder: 3,
    topic: "기술",
  },
  {
    description:
      "최근 누군가에게 고마웠던 순간을 떠올리고 그 감정이 오래 남는 이유를 정리합니다.",
    id: 7,
    isTodayRecommended: true,
    level: 1,
    outline: [],
    suggestedLengthLabel: "짧음",
    tags: ["관계", "감사"],
    text: "가장 최근에 누군가에게 고마웠던 순간은 언제인가요?",
    tips: [
      "상대의 행동보다 그때의 감정 변화를 써보세요.",
      "작은 사건일수록 더 구체적으로 적어보세요.",
    ],
    todayRecommendationOrder: 4,
    topic: "관계",
  },
  {
    description:
      "내가 사는 동네의 매력이나 분위기를 통해 익숙한 장소를 새롭게 바라보는 글을 씁니다.",
    id: 8,
    isTodayRecommended: false,
    level: 1,
    outline: [],
    suggestedLengthLabel: "짧음",
    tags: ["장소", "관찰"],
    text: "지금 내가 살고 있는 동네의 숨은 매력",
    tips: [
      "길, 소리, 냄새처럼 감각적인 요소를 넣어보세요.",
      "익숙해서 지나쳤던 디테일을 하나 골라보세요.",
    ],
    todayRecommendationOrder: null,
    topic: "일상",
  },
  {
    description:
      "실패를 두려워하지 않는다면 해보고 싶은 일을 통해 현재의 망설임을 비춰봅니다.",
    id: 9,
    isTodayRecommended: false,
    level: 2,
    outline: [],
    suggestedLengthLabel: "보통",
    tags: ["용기", "성장"],
    text: "실패를 두려워하지 않았다면 지금 가장 해보고 싶은 일은?",
    tips: [
      "하고 싶은 일 자체보다 망설임의 이유도 함께 적어보세요.",
      "작게 바로 시작할 수 있는 행동으로 끝내보세요.",
    ],
    todayRecommendationOrder: null,
    topic: "성장",
  },
  {
    description:
      "지금 당장 떠날 수 있는 곳을 상상하며 그곳이 지금의 나에게 필요한 이유를 정리합니다.",
    id: 10,
    isTodayRecommended: false,
    level: 1,
    outline: [],
    suggestedLengthLabel: "짧음",
    tags: ["여행", "상상"],
    text: "지금 당장 떠날 수 있다면 어디로 가고 싶나요?",
    tips: [
      "장소의 이름보다 그곳에서 얻고 싶은 감정에 집중해보세요.",
      "돌아온 뒤의 자신까지 상상해보세요.",
    ],
    todayRecommendationOrder: null,
    topic: "여행",
  },
]
