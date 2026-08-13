import type {
  WritingDifficulty,
  WritingDomain,
} from "@workspace/contracts/writing/writing"

type SeedWritingTask = {
  audience: string
  difficulty: WritingDifficulty
  domain: WritingDomain
  goalChars: number
  id: string
  minChars: number
  requiredElements: readonly string[]
  situation: string
  taskId: string
  title: string
  typeName: string
}

export const defaultWritingTaskSeed: readonly SeedWritingTask[] = [
  {
    audience: "친구",
    difficulty: "입문",
    domain: "일상·실용문",
    goalChars: 120,
    id: "p-invite",
    minChars: 60,
    requiredElements: [
      "언제·어디서 만나는지 밝힌다",
      "상대가 답할 수 있게 한 질문을 남긴다",
    ],
    situation:
      "주말에 가까운 사람을 공원 소풍에 초대하는 짧은 메시지를 씁니다.",
    taskId: "t-invite",
    title: "주말 소풍 초대 메시지",
    typeName: "초대장",
  },
  {
    audience: "처음 오는 손님",
    difficulty: "기본",
    domain: "일상·실용문",
    goalChars: 200,
    id: "p-review",
    minChars: 100,
    requiredElements: [
      "먹은 메뉴를 구체적으로 적는다",
      "다시 갈지 여부를 분명히 한다",
    ],
    situation: "어제 간 식당을 다른 손님이 고를 수 있게 후기를 남깁니다.",
    taskId: "t-review",
    title: "동네 식당 후기",
    typeName: "후기",
  },
  {
    audience: "같은 수업 동료",
    difficulty: "기본",
    domain: "학업·논술문",
    goalChars: 250,
    id: "p-summary",
    minChars: 120,
    requiredElements: [
      "기사의 주장을 한 문장으로 남긴다",
      "근거를 두 가지 이상 정리한다",
    ],
    situation: "제공된 기사의 주장과 근거만 남기고 짧게 정리합니다.",
    taskId: "t-summary",
    title: "기사 한 편의 핵심 요약",
    typeName: "요약문",
  },
  {
    audience: "함께 일하는 팀",
    difficulty: "입문",
    domain: "업무·비즈니스 문서",
    goalChars: 180,
    id: "p-email",
    minChars: 80,
    requiredElements: [
      "변경된 일시를 분명히 적는다",
      "양해와 다음 행동을 한 문장씩 넣는다",
    ],
    situation: "내일 회의를 이틀 뒤로 미루는 이유를 정중하게 알립니다.",
    taskId: "t-email",
    title: "회의 일정 변경 안내",
    typeName: "이메일",
  },
  {
    audience: "글 읽는 낯선 사람",
    difficulty: "심화",
    domain: "창작·문학",
    goalChars: 400,
    id: "p-essay",
    minChars: 200,
    requiredElements: [
      "한 장면을 감각으로 묘사한다",
      "그날의 감정을 직접 이름 붙인다",
    ],
    situation: "오늘 아침의 한 장면을 짧은 수필로 옮깁니다.",
    taskId: "t-essay",
    title: "비 오는 출근길",
    typeName: "수필",
  },
  {
    audience: "학교 신문 독자",
    difficulty: "심화",
    domain: "설득·의견문",
    goalChars: 500,
    id: "p-column",
    minChars: 200,
    requiredElements: [
      "한 문단 안에 주장과 근거를 연결한다",
      "반대 의견을 한 문장 이상 다룬다",
      "격식체를 유지한다",
    ],
    situation: "숙제를 줄이자는 주장과 근거, 예상 반론을 한 칼럼으로 씁니다.",
    taskId: "t-column",
    title: "숙제 폐지 찬반 칼럼",
    typeName: "칼럼",
  },
  {
    audience: "비개발 동료",
    difficulty: "기본",
    domain: "정보전달·설명문",
    goalChars: 300,
    id: "p-explain",
    minChars: 150,
    requiredElements: [
      "두 개념을 각각 한 문장으로 정의한다",
      "차이를 한 가지 쓰임으로 비교한다",
    ],
    situation:
      "기술 지식이 없는 동료에게 두 개념의 차이를 순서대로 설명합니다.",
    taskId: "t-explain",
    title: "캐시와 쿠키 차이 설명",
    typeName: "개념 설명",
  },
  {
    audience: "채용 담당자",
    difficulty: "기본",
    domain: "자기서사·기록",
    goalChars: 400,
    id: "p-intro",
    minChars: 180,
    requiredElements: [
      "지원하는 일과 내 경험을 연결한다",
      "그 일이 하고 싶은 이유를 한 문장으로 밝힌다",
    ],
    situation: "지원하는 일과 내 경험을 한 문단에서 연결합니다.",
    taskId: "t-intro",
    title: "지원 동기 한 문단",
    typeName: "자기소개서",
  },
  {
    audience: "동료",
    difficulty: "입문",
    domain: "관계·소통 문서",
    goalChars: 160,
    id: "p-thanks",
    minChars: 70,
    requiredElements: [
      "어떤 도움이었는지 구체적으로 적는다",
      "고마운 마음을 직접 표현한다",
    ],
    situation: "바쁜 일정 중에 일을 나눠 준 동료에게 짧게 감사를 전합니다.",
    taskId: "t-thanks",
    title: "도움을 준 동료에게 감사",
    typeName: "감사편지",
  },
  {
    audience: "블로그 독자",
    difficulty: "기본",
    domain: "디지털·뉴미디어",
    goalChars: 350,
    id: "p-blog",
    minChars: 160,
    requiredElements: [
      "코스의 시작과 끝을 안내한다",
      "그 길을 권하는 이유를 한 가지 이상 적는다",
    ],
    situation: "독자가 따라 걸을 수 있게 코스와 이유를 소개합니다.",
    taskId: "t-blog",
    title: "주말 산책 코스 소개",
    typeName: "블로그 포스트",
  },
]
