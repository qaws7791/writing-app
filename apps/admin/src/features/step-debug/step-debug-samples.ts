import type { LessonStep } from "@/features/step-debug/step-types"

type LessonStepDebugDto = Omit<LessonStep, "order"> & {
  readonly sortOrder: number
}

export type StepDebugEntry = {
  readonly type: string
  readonly label: string
  readonly icon: string
  readonly desc: string
  readonly sample: LessonStep
  readonly dto: LessonStepDebugDto
}

function createStepDebugEntry(
  entry: Omit<StepDebugEntry, "dto">
): StepDebugEntry {
  const { order: _order, ...rest } = entry.sample

  return {
    ...entry,
    dto: {
      ...rest,
      sortOrder: entry.sample.order,
    } as LessonStepDebugDto,
  }
}

export const STEP_DEBUG_ENTRIES: readonly StepDebugEntry[] = [
  createStepDebugEntry({
    type: "READING",
    label: "읽기 (READING)",
    icon: "📖",
    desc: "지문·개념 읽기",
    sample: {
      id: "debug-reading-1",
      order: 1,
      type: "READING",
      title: "명료성의 원칙",
      guide:
        "좋은 문장의 핵심 기준을 읽고, 내가 자주 쓰는 표현 중 모호한 것이 있는지 생각해보세요.",
      body: "좋은 문장은 **한 가지 의미만을 분명히** 전달합니다.\n\n모호한 수식어와 중복 표현을 줄이는 것이 시작입니다.\n\n**나쁜 예시**\n> 어느 정도 괜찮은 결과가 나왔던 것 같습니다.\n\n**좋은 예시**\n> 목표치를 달성했습니다.\n\n문장을 다듬을 때는 다음을 확인하세요:\n- 한 문장에 생각이 하나인가?\n- 없애도 의미가 유지되는 단어가 있는가?\n- 독자가 다르게 해석할 여지가 있는가?\n\n---\n\n**명료성** — 문장이 단 하나의 해석으로 읽히는 정도",
    },
  }),
  createStepDebugEntry({
    type: "COMPARE",
    label: "비교 (COMPARE)",
    icon: "⚖️",
    desc: "버전 비교 탭",
    sample: {
      id: "debug-compare-1",
      order: 1,
      type: "COMPARE",
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
      analysis:
        "구체적인 장면과 변화의 암시는 독자를 다음 문장으로 끌어당깁니다.",
    },
  }),
  createStepDebugEntry({
    type: "MULTIPLE_CHOICE",
    label: "객관식 (MULTIPLE_CHOICE)",
    icon: "✅",
    desc: "객관식 퀴즈",
    sample: {
      id: "debug-mc-1",
      order: 1,
      type: "MULTIPLE_CHOICE",
      question: "한 문단에 들어가야 할 주제문의 수는?",
      options: [
        { id: "a", text: "2개 이상" },
        { id: "b", text: "정확히 1개" },
        { id: "c", text: "없어도 된다" },
      ],
      correct: "b",
      explanation: "하나의 문단에는 단 하나의 핵심 주제문이 들어갑니다.",
      wrong: "주제가 두 개라면 문단을 나누는 편이 좋습니다.",
    },
  }),
  createStepDebugEntry({
    type: "FILL_BLANK",
    label: "빈칸 (FILL_BLANK)",
    icon: "🧩",
    desc: "빈칸 채우기",
    sample: {
      id: "debug-fb-1",
      order: 1,
      type: "FILL_BLANK",
      template: "그는 회의 내내 동료의 발표를 ___ 했다.",
      words: ["보다", "관찰", "쳐다", "구경"],
      answer: ["관찰"],
      explanation: '집중해서 살피는 행위에는 "관찰"이 가장 정확합니다.',
    },
  }),
  createStepDebugEntry({
    type: "SELECT",
    label: "선택 (SELECT)",
    icon: "🔍",
    desc: "구간/문장 선택",
    sample: {
      id: "debug-select-1",
      order: 1,
      type: "SELECT",
      question: "다음 문장에서 주어 역할을 하는 구간을 모두 선택하세요.",
      segments: ["꾸준한 ", "글쓰기는 ", "나의 ", "사고를 ", "정돈한다."],
      correct: [0, 1],
      explanation: '"꾸준한 글쓰기는"이 주어부입니다.',
    },
  }),
  createStepDebugEntry({
    type: "ORDER",
    label: "순서 (ORDER)",
    icon: "🔢",
    desc: "순서 정렬",
    sample: {
      id: "debug-order-1",
      order: 1,
      type: "ORDER",
      title: "문장을 자연스러운 어순으로",
      items: ["나는", "어제", "도서관에서", "책을", "읽었다"],
      correct: ["나는", "어제", "도서관에서", "책을", "읽었다"],
      showNumbers: true,
      explanation:
        "한국어 기본 어순은 주어 - 시간 - 장소 - 목적어 - 서술어 입니다.",
    },
  }),
  createStepDebugEntry({
    type: "MATCH",
    label: "매칭 (MATCH)",
    icon: "🔗",
    desc: "두 집합 짝짓기",
    sample: {
      id: "debug-match-1",
      order: 1,
      type: "MATCH",
      title: "접속사와 기능 짝짓기",
      guide: "왼쪽 접속사와 오른쪽 기능을 짝지어 보세요.",
      pairs: [
        { left: "그러나", right: "역접" },
        { left: "따라서", right: "인과" },
        { left: "예를 들어", right: "예시" },
        { left: "또한", right: "추가" },
      ],
      explanation: "접속사는 문장 사이의 논리 관계를 신호로 보여줍니다.",
    },
  }),
  createStepDebugEntry({
    type: "CATEGORIZE",
    label: "분류 (CATEGORIZE)",
    icon: "🗂️",
    desc: "항목을 카테고리에 분류",
    sample: {
      id: "debug-categorize-1",
      order: 1,
      type: "CATEGORIZE",
      title: "문장 분류하기",
      guide: "각 문장이 단락에서 어떤 역할을 하는지 분류하세요.",
      categories: [
        {
          id: "A",
          label: "주제문",
        },
        {
          id: "B",
          label: "뒷받침",
        },
        {
          id: "C",
          label: "예시",
        },
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
    },
  }),
  createStepDebugEntry({
    type: "WRITE",
    label: "글쓰기 (WRITE)",
    icon: "✏️",
    desc: "단문·장문·논증·계획·개요·퇴고를 아우르는 통합 쓰기",
    sample: {
      id: "debug-write-1",
      order: 1,
      type: "WRITE",
      title: "쓰기 전 5분 계획",
      guide:
        '"최근 새롭게 도전한 일"에 대해 짧은 글을 쓰려 합니다. 본격 쓰기 전에 재료를 모아보세요.',
      min: 20,
      goal: 80,
      structure:
        "- **독자**: 이 글을 읽을 대상은 누구인가요?\n- **목적**: 이 글의 목적은 무엇인가요? (설득, 정보 전달, 공감 등)\n- **키워드**: 글에 담을 핵심 단어나 개념을 나열해 보세요.\n- **핵심 주장**: 이 글이 전하려는 한 문장을 적어보세요.",
    },
  }),
  createStepDebugEntry({
    type: "AI_FEEDBACK",
    label: "AI 코칭 (AI_FEEDBACK)",
    icon: "🤖",
    desc: "AI 코칭 — 잘된 점·다듬을 점·다음 시도",
    sample: {
      id: "debug-ai-1",
      order: 1,
      type: "AI_FEEDBACK",
      target: "debug-write-1",
      focus: "명확성",
      feedback:
        "주장과 근거가 명확히 구분되어 있습니다. 근거에 구체적인 수치가 포함되어 설득력이 높습니다.",
      showScore: true,
      score: 92,
      scoreMax: 100,
      allowRetry: true,
    },
  }),
]
