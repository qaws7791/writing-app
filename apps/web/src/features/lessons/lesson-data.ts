import type {
  Lesson,
  LessonId,
  LessonStepId,
} from "@/features/lessons/lesson-types"

export function lessonId(value: string): LessonId {
  return value as LessonId
}

export function lessonStepId(value: string): LessonStepId {
  return value as LessonStepId
}

export const prototypeLesson: Lesson = {
  id: lessonId("lesson-c1-c3-l4"),
  title: "피동문과 능동문",
  categoryId: "cat1",
  courseId: "course1-3",
  unitNumber: 4,
  steps: [
    {
      id: lessonStepId("step-1"),
      type: "INTRO",
      order: 1,
      points: 5,
      required: true,
      content: {
        title: "피동문과 능동문",
        category: "문장 구조",
        tagTone: "info",
        bullets: [
          "능동태와 수동태의 차이를 이해한다",
          "수동태가 문장을 어떻게 약하게 만드는지 안다",
          "능동태로 변환하는 연습을 한다",
        ],
        estimatedMinutes: 8,
        totalSteps: 20,
      },
    },
    {
      id: lessonStepId("step-2"),
      type: "CONCEPT",
      order: 2,
      points: 5,
      required: true,
      content: {
        subtitle: "능동태 vs. 수동태",
        body: "능동태 문장에서는 주어가 직접 행동합니다. 수동태 문장에서는 행위를 받는 대상이 주어가 됩니다.\n\n능동태는 문장에 **생동감**을 부여하고 **책임**을 명확히 합니다. 수동태는 행위자를 숨기거나 격식을 표현할 때 의도적으로 씁니다.",
        highlight: {
          icon: "💡",
          text: "글쓰기에서 능동태를 기본으로 쓰고, 수동태는 의도가 있을 때만 선택적으로 사용하세요.",
          tone: "info",
        },
        keyTerms: [
          {
            term: "능동태",
            definition:
              '주어가 동작을 직접 행하는 문장 형태. "철수가 밥을 먹었다."',
          },
          {
            term: "수동태",
            definition:
              '주어가 동작을 받는 문장 형태. "밥이 철수에 의해 먹혔다."',
          },
        ],
      },
    },
    {
      id: lessonStepId("step-3"),
      type: "READING_PASSAGE",
      order: 3,
      points: 5,
      required: true,
      content: {
        instruction: "다음 글을 읽어보세요.",
        title: "능동적 문체의 힘",
        source: "한국어 글쓰기 플랫폼 예시 지문",
        text: '글쓰기에서 문체는 단순한 스타일의 문제가 아닙니다. 능동적 문체는 독자에게 **에너지**를 전달합니다.\n\n헤밍웨이는 "짧고 강한 문장을 써라"고 말했습니다. 그의 문장은 거의 대부분 능동태입니다. "비가 왔다"가 아니라 "비가 쏟아졌다". "그는 슬펐다"가 아니라 "그의 눈이 뜨거워졌다".\n\n수동태가 나쁜 것은 아닙니다. 다만 습관적으로 쓰면 문장이 **무기력**해집니다. 행위자가 사라지고, 책임이 흐려지고, 독자의 집중이 분산됩니다.\n\n오늘 이 레슨에서 우리는 수동태를 능동태로 바꾸는 구체적인 연습을 합니다.',
        estimatedReadMinutes: 1,
        highlightEnabled: true,
        focusQuestion: "어떤 표현이 능동태의 특성을 잘 보여주나요?",
      },
    },
    {
      id: lessonStepId("step-4"),
      type: "EXAMPLE_REVEAL",
      order: 4,
      points: 5,
      required: true,
      content: {
        instruction: "다음 문장을 읽어보세요.",
        bad: {
          label: "피해야 할 표현",
          text: "이 정책은 시민들에 의해 강하게 반대되었다.",
        },
        good: {
          label: "더 나은 표현",
          text: "시민들이 이 정책에 강하게 반대했다.",
        },
        analysis:
          '**수동태** "반대되었다"를 **능동태** "반대했다"로 바꾸면 문장이 훨씬 직접적이고 생동감 있어집니다. 행위의 주체(시민들)를 주어로 올리면 책임과 의지가 명확해집니다.',
        revealTrigger: "button",
      },
    },
    {
      id: lessonStepId("step-5"),
      type: "COMPARE",
      order: 5,
      points: 5,
      required: true,
      content: {
        instruction: "두 버전을 비교해보세요. 어느 쪽이 더 생생한가요?",
        versions: [
          {
            label: "수동태 버전",
            text: "회의는 팀장에 의해 소집되었고, 안건이 위원들에 의해 검토되었다. 결론은 만장일치로 채택되었다.",
            tone: "danger",
          },
          {
            label: "능동태 버전",
            text: "팀장이 회의를 소집했고, 위원들이 안건을 검토했다. 모두가 만장일치로 결론을 채택했다.",
            tone: "primary",
          },
        ],
        analysis:
          "능동태 버전(B)은 각 문장마다 행위자가 명확합니다. 누가 무엇을 했는지가 한눈에 들어오고, 전체 문장에 리듬감이 생깁니다.",
        discussionQuestion: "어떤 상황에서는 수동태가 오히려 더 적절할까요?",
      },
    },
    {
      id: lessonStepId("step-6"),
      type: "MULTIPLE_CHOICE",
      order: 6,
      points: 10,
      required: true,
      content: {
        question: "다음 중 능동태 문장은 무엇인가요?",
        options: [
          {
            id: "A",
            text: "그 보고서는 팀장에 의해 검토되었다.",
            isCorrect: false,
          },
          {
            id: "B",
            text: "새로운 규칙이 위원회에 의해 결정되었다.",
            isCorrect: false,
          },
          {
            id: "C",
            text: "작가가 밤새 소설을 완성했다.",
            isCorrect: true,
          },
          {
            id: "D",
            text: "회의 결과가 모두에게 공지되었다.",
            isCorrect: false,
          },
        ],
        explanation:
          '정답은 C입니다. "작가가 밤새 소설을 완성했다"는 주어(작가)가 직접 행동(완성했다)을 수행하는 능동태 문장입니다. 나머지는 모두 "~에 의해 ~되었다" 구조의 수동태입니다.',
        allowMultiple: false,
        shuffleOptions: false,
      },
    },
    {
      id: lessonStepId("step-7"),
      type: "FILL_BLANK",
      order: 7,
      points: 10,
      required: true,
      content: {
        instruction: "알맞은 단어를 골라 빈칸을 채워보세요.",
        template:
          "능동태에서는 {{blank_1}}이/가 행동을 직접 수행합니다. 반면 수동태에서는 행위를 {{blank_2}} 대상이 주어가 됩니다.",
        blanks: [
          {
            id: "blank_1",
            correctAnswers: ["주어", "행위자"],
            hint: "문장에서 동작을 하는 주체",
          },
          {
            id: "blank_2",
            correctAnswers: ["받는", "당하는"],
          },
        ],
        inputMode: "word-bank",
        wordBank: ["주어", "목적어", "서술어", "받는", "주는", "행위자"],
        explanation:
          "능동태: 주어가 동작을 직접 수행합니다. 수동태: 행위를 받는 대상이 주어 자리에 옵니다.",
        caseSensitive: false,
      },
    },
    {
      id: lessonStepId("step-8"),
      type: "WORD_SELECT",
      order: 8,
      points: 10,
      required: true,
      content: {
        instruction: "다음 글에서 수동태 표현을 모두 찾아 탭하세요.",
        markedText:
          "{{이 정책은 정부에 의해 발표되었다.:s1:correct}} {{시민들이 적극적으로 의견을 냈다.:s2:incorrect}} {{최종 결정은 위원회에 의해 내려졌다.:s3:correct}} {{우리는 함께 더 나은 사회를 만들어간다.:s4:incorrect}}",
        globalExplanation:
          '"~에 의해 ~되었다/졌다" 구조가 수동태의 특징입니다. 문장 1번과 3번이 수동태입니다.',
        spanExplanations: {
          s1: '"발표되었다"는 수동태 표현입니다.',
          s2: '"의견을 냈다"는 능동태 표현입니다.',
          s3: '"내려졌다"는 수동태 표현입니다.',
          s4: '"만들어간다"는 능동태 표현입니다.',
        },
      },
    },
    {
      id: lessonStepId("step-9"),
      type: "REORDER",
      order: 9,
      points: 10,
      required: true,
      content: {
        instruction: "다음 문장들을 올바른 논리 순서로 배열해보세요.",
        items: [
          {
            id: "r1",
            text: "따라서 글을 쓸 때는 능동태를 기본으로 선택해야 합니다.",
            correctOrder: 4,
          },
          {
            id: "r2",
            text: "능동태와 수동태는 같은 내용을 다르게 표현하는 방법입니다.",
            correctOrder: 1,
          },
          {
            id: "r3",
            text: "반면 수동태는 행위자를 숨기거나 격식 표현에 적합합니다.",
            correctOrder: 3,
          },
          {
            id: "r4",
            text: "능동태는 주어가 행동을 직접 수행하여 문장이 생동감 있습니다.",
            correctOrder: 2,
          },
        ],
        itemType: "sentence",
        explanation:
          "올바른 순서: 개념 소개 → 능동태 특징 → 수동태 특징 → 결론. 이 흐름이 가장 논리적입니다.",
        showNumberHint: true,
      },
    },
    {
      id: lessonStepId("step-10"),
      type: "MATCH",
      order: 10,
      points: 10,
      required: true,
      content: {
        instruction: "왼쪽과 오른쪽을 올바르게 연결해보세요.",
        pairs: [
          {
            id: "p1",
            left: "능동태",
            right: "주어가 행동을 직접 수행",
          },
          {
            id: "p2",
            left: "수동태",
            right: "행위를 받는 대상이 주어",
          },
          {
            id: "p3",
            left: '"쓰다"',
            right: "능동적 동사 형태",
          },
          {
            id: "p4",
            left: '"씌어지다"',
            right: "수동적 동사 형태",
          },
        ],
        shuffleRight: true,
        displayMode: "tap-connect",
        explanation:
          "능동태/수동태 각각의 특징과 대표적인 동사 형태를 기억해두세요.",
      },
    },
    {
      id: lessonStepId("step-11"),
      type: "CLASSIFY",
      order: 11,
      points: 10,
      required: true,
      content: {
        instruction: "다음 문장들을 능동태와 수동태로 분류해보세요.",
        categories: [
          {
            id: "active",
            label: "능동태",
            tone: "primary",
          },
          {
            id: "passive",
            label: "수동태",
            tone: "danger",
          },
        ],
        items: [
          {
            id: "i1",
            text: "기자가 사건을 취재했다.",
            correctCategoryId: "active",
          },
          {
            id: "i2",
            text: "사건이 기자에 의해 취재되었다.",
            correctCategoryId: "passive",
          },
          {
            id: "i3",
            text: "선생님이 학생들을 가르쳤다.",
            correctCategoryId: "active",
          },
          {
            id: "i4",
            text: "법안이 국회에서 통과되었다.",
            correctCategoryId: "passive",
          },
          {
            id: "i5",
            text: "아이가 사탕을 먹었다.",
            correctCategoryId: "active",
          },
          {
            id: "i6",
            text: "편지가 우체부에 의해 배달되었다.",
            correctCategoryId: "passive",
          },
        ],
        globalExplanation:
          '"~에 의해 ~되었다" 구조가 수동태의 특징입니다. 능동태는 주어가 직접 동작을 수행합니다.',
      },
    },
    {
      id: lessonStepId("step-12"),
      type: "SHORT_WRITE",
      order: 12,
      points: 15,
      required: true,
      content: {
        instruction: "다음 수동태 문장을 능동태로 바꿔 써보세요.",
        prompt: "아래 문장을 능동태로 자연스럽게 변환해보세요.",
        sourceText: '"이 제안은 경영진에 의해 거부되었다."',
        maxChars: 200,
        minChars: 10,
        referenceAnswer: "경영진이 이 제안을 거부했다.",
        aiEvaluationEnabled: false,
        showReferenceAfterSubmit: true,
      },
    },
    {
      id: lessonStepId("step-13"),
      type: "LONG_WRITE",
      order: 13,
      points: 20,
      required: true,
      content: {
        instruction: "오늘의 글쓰기 과제",
        topic:
          '다음 상황을 능동적인 문체로 100자 이상 묘사해보세요: "회의에서 중요한 결정이 내려진 장면"',
        context: "수동태 없이, 각 인물이 직접 행동하는 방식으로 작성해보세요.",
        structureGuide: [
          "1. 누가 회의를 이끌었나요?",
          "2. 각 참여자가 무엇을 했나요?",
          "3. 어떻게 결론이 났나요?",
        ],
        minChars: 100,
        targetChars: 200,
        maxChars: 500,
        aiEvaluationEnabled: false,
        evaluationCriteria: "능동태 사용 비율, 문장의 생동감, 행위자 명확성",
        draftSaveEnabled: true,
      },
    },
    {
      id: lessonStepId("step-14"),
      type: "AI_FEEDBACK",
      order: 14,
      points: 5,
      required: true,
      content: {
        sourceStepId: lessonStepId("step-12"),
        feedbackPrompt: "능동태 변환의 자연스러움을 평가해주세요.",
        focusAreas: ["clarity", "expression"],
        showScore: true,
        scoreRange: [0, 100],
        allowRevision: true,
        maxRevisions: 2,
      },
    },
    {
      id: lessonStepId("step-15"),
      type: "REVISION",
      order: 15,
      points: 15,
      required: true,
      content: {
        instruction: "아래 글을 퇴고해보세요.",
        revisionTask: "수동태 표현을 모두 능동태로 전환하세요.",
        originalText:
          "이 보고서는 팀원들에 의해 작성되었다. 데이터는 시스템에 의해 자동으로 수집되었으며, 결과는 팀장에게 의해 최종적으로 검토되었다. 개선안은 전원 합의에 의해 채택되었다.",
        hints: [
          '"~에 의해 ~되었다" 구조를 찾아보세요.',
          "행위자를 주어로 올리고 동사를 능동형으로 바꾸세요.",
        ],
        revisionType: "targeted",
        referenceRevision:
          "팀원들이 이 보고서를 작성했다. 시스템이 데이터를 자동으로 수집했으며, 팀장이 결과를 최종적으로 검토했다. 전원이 합의하여 개선안을 채택했다.",
        aiEvaluationEnabled: false,
        evaluationCriteria: "수동태 완전 제거 여부, 자연스러운 문체 유지",
      },
    },
    {
      id: lessonStepId("step-16"),
      type: "CHECKLIST",
      order: 16,
      points: 5,
      required: true,
      content: {
        instruction: "내 글을 점검해보세요.",
        items: [
          {
            id: "c1",
            text: '수동태 표현("~에 의해 ~되었다")을 모두 제거했나요?',
            required: true,
            tip: '"~되었다", "~됩니다", "~씌어졌다" 등의 표현을 검색해보세요.',
          },
          {
            id: "c2",
            text: "각 문장에 행위자(주어)가 명확히 드러나나요?",
            required: true,
          },
          {
            id: "c3",
            text: "소리 내어 읽었을 때 자연스럽게 들리나요?",
            required: false,
            tip: "어색하게 들리는 부분이 있다면 다시 써보세요.",
          },
          {
            id: "c4",
            text: "문장 사이에 리듬감이 느껴지나요?",
            required: false,
          },
          {
            id: "c5",
            text: "수동태가 필요한 경우(격식, 행위자 불명)에만 제한적으로 사용했나요?",
            required: false,
          },
        ],
        completionMode: "minimum",
        minimumChecks: 3,
        saveResponses: true,
      },
    },
    {
      id: lessonStepId("step-17"),
      type: "REFLECTION",
      order: 17,
      points: 5,
      required: false,
      content: {
        question: "이번 레슨을 통해 무엇을 느꼈나요?",
        context:
          "능동태와 수동태를 연습하면서 어떤 점이 어려웠거나 새롭게 발견했나요?",
        promptStarters: [
          "가장 어려웠던 것은...",
          "앞으로 내 글에서 바꾸고 싶은 것은...",
          "새롭게 알게 된 점은...",
        ],
        minChars: 20,
        saveToJournal: true,
        category: "문장 구조",
        isSkippable: true,
      },
    },
    {
      id: lessonStepId("step-18"),
      type: "SUMMARY",
      order: 18,
      points: 5,
      required: true,
      content: {
        points: [
          {
            number: 1,
            text: "능동태는 문장에 생동감을 부여하고 책임을 명확히 합니다.",
            icon: "⚡",
          },
          {
            number: 2,
            text: "수동태는 행위자를 숨기거나 격식을 표현할 때만 의도적으로 씁니다.",
            icon: "🎯",
          },
          {
            number: 3,
            text: '"~에 의해 ~되었다" 구조를 발견하면 능동태로 바꿀 수 있는지 먼저 검토하세요.',
            icon: "🔍",
          },
        ],
        nextLesson: {
          title: "이중 주어 구문과 어색한 한국어 패턴",
          description: "한국어에서 자주 등장하는 이중 주어 구문을 배웁니다.",
        },
        shareableQuote: "능동태로 쓰면 문장이 살아난다. — 한국어 글쓰기 플랫폼",
      },
    },
    {
      id: lessonStepId("step-19"),
      type: "TRANSCRIBE",
      order: 19,
      points: 10,
      required: true,
      content: {
        instruction: "다음 문장을 그대로 받아써보세요.",
        sourceText:
          "팀장이 회의를 소집했고, 위원들이 안건을 검토했다. 모두가 만장일치로 결론을 채택했다.",
        source: "능동태 변환 연습 예문",
        showMatchRate: true,
        caseSensitive: false,
        punctuationSensitive: true,
        focusNote: "능동태의 리듬감을 느끼며 따라써보세요.",
      },
    },
    {
      id: lessonStepId("step-20"),
      type: "COMPLETE",
      order: 20,
      points: 0,
      required: true,
      content: {
        celebrationStyle: "confetti",
        xpEarned: 135,
        showStreak: true,
        lessonStats: {
          correctRate: 85,
          writingCount: 2,
          aiFeedbackCount: 1,
        },
        nextAction: "next-lesson",
      },
    },
  ],
}
