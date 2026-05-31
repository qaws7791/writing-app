import {
  courseDetails,
  type CourseChapter,
  type CourseDetail,
  type CourseLesson,
} from "@/features/courses/course-detail-data"
import {
  AI_FEEDBACK_MAX_REVISIONS,
  AI_FEEDBACK_SCORE_RANGE,
  CHECKLIST_MINIMUM_REQUIRED_CHECKS,
  DEFAULT_LESSON_ESTIMATE,
  EXTENDED_LESSON_ESTIMATE,
  FIRST_MIDDLE_STEP_ORDER,
  LESSON_BOUNDARY_STEP_COUNT,
  LESSON_STEP_DEFAULT_POINTS,
  LONG_WRITE_LENGTH_LIMIT,
  MEDIUM_LESSON_ESTIMATE,
  OPTIONAL_REFLECTION_POINTS,
  REFLECTION_LENGTH_LIMIT,
  SHORT_WRITE_LENGTH_LIMIT,
  SUMMARY_STEP_OFFSET_FROM_END,
} from "@/features/lessons/lesson-generation-rules"
import { lessonId, lessonStepId } from "@/features/lessons/lesson-ids"
import type {
  Lesson,
  LessonId,
  LessonStep,
  LessonStepId,
  LessonTone,
} from "@/features/lessons/lesson-types"

export { lessonId, lessonStepId } from "@/features/lessons/lesson-ids"

type LessonPattern =
  | "sentence"
  | "vocabulary"
  | "reading"
  | "grammar"
  | "expression"
  | "essay"
  | "business"
  | "creative"
  | "emotion"

interface CourseProfile {
  categoryId: string
  categoryLabel: string
  pattern: LessonPattern
  tone: LessonTone
  coreSkill: string
  goodLabel: string
  avoidLabel: string
  correctSpan: string
  incorrectSpan: string
  writingGoal: string
}

interface LessonBuildInput {
  course: CourseDetail
  chapter: CourseChapter
  lesson: CourseLesson
  profile: CourseProfile
  chapterIndex: number
  lessonIndexInChapter: number
  nextLesson?: CourseLesson
}

interface CourseLessonRef {
  course: CourseDetail
  chapter: CourseChapter
  lesson: CourseLesson
  chapterIndex: number
  lessonIndexInChapter: number
  nextLesson?: CourseLesson
}

const courseProfiles: Record<string, CourseProfile> = {
  "sentence-structure": {
    categoryId: "beginner",
    categoryLabel: "문장 구조",
    pattern: "sentence",
    tone: "info",
    coreSkill: "문장 성분의 관계",
    goodLabel: "구조가 보이는 문장",
    avoidLabel: "관계가 흐린 문장",
    correctSpan: "주어와 서술어가 서로 맞물리는 부분",
    incorrectSpan: "의미 없이 길어진 꾸밈말",
    writingGoal: "짧고 정확한 문장",
  },
  "vocabulary-basics": {
    categoryId: "beginner",
    categoryLabel: "어휘 감각",
    pattern: "vocabulary",
    tone: "primary",
    coreSkill: "문맥에 맞는 단어 선택",
    goodLabel: "문맥에 맞는 표현",
    avoidLabel: "막연한 표현",
    correctSpan: "문맥을 좁히는 단어",
    incorrectSpan: "뜻이 넓어 흐려진 단어",
    writingGoal: "정확한 어휘가 들어간 문장",
  },
  "reading-comprehension": {
    categoryId: "beginner",
    categoryLabel: "독해와 요약",
    pattern: "reading",
    tone: "info",
    coreSkill: "핵심과 세부의 구분",
    goodLabel: "중심이 남은 요약",
    avoidLabel: "세부에 끌려간 요약",
    correctSpan: "글의 중심을 알려 주는 문장",
    incorrectSpan: "예시를 반복하는 문장",
    writingGoal: "핵심만 남긴 요약문",
  },
  "grammar-complete": {
    categoryId: "grammar",
    categoryLabel: "문법 완성",
    pattern: "grammar",
    tone: "warning",
    coreSkill: "규칙을 문맥에 적용하는 힘",
    goodLabel: "규칙이 맞는 문장",
    avoidLabel: "습관적으로 틀린 문장",
    correctSpan: "규칙을 적용해야 하는 자리",
    incorrectSpan: "소리만 믿고 쓴 표기",
    writingGoal: "오류 없이 다듬은 문장",
  },
  expression: {
    categoryId: "grammar",
    categoryLabel: "표현력",
    pattern: "expression",
    tone: "primary",
    coreSkill: "장면과 어조를 살리는 표현",
    goodLabel: "살아 있는 표현",
    avoidLabel: "평면적인 표현",
    correctSpan: "독자가 장면을 떠올리게 하는 표현",
    incorrectSpan: "설명만 남은 표현",
    writingGoal: "생생하게 전달되는 문장",
  },
  "essay-writing": {
    categoryId: "practical",
    categoryLabel: "에세이",
    pattern: "essay",
    tone: "info",
    coreSkill: "관점과 구조의 일관성",
    goodLabel: "관점이 선명한 글",
    avoidLabel: "소재만 나열한 글",
    correctSpan: "글의 관점을 드러내는 문장",
    incorrectSpan: "방향 없이 붙은 사례",
    writingGoal: "읽고 남는 에세이 문단",
  },
  "business-writing": {
    categoryId: "practical",
    categoryLabel: "비즈니스 글쓰기",
    pattern: "business",
    tone: "neutral",
    coreSkill: "목적과 요청의 명확성",
    goodLabel: "바로 실행할 수 있는 문장",
    avoidLabel: "책임이 흐린 문장",
    correctSpan: "수신자가 할 일을 알려 주는 부분",
    incorrectSpan: "판단을 미루는 표현",
    writingGoal: "업무 행동이 분명한 문단",
  },
  "creative-writing": {
    categoryId: "practical",
    categoryLabel: "창의적 글쓰기",
    pattern: "creative",
    tone: "primary",
    coreSkill: "관찰과 장면화",
    goodLabel: "장면이 움직이는 문장",
    avoidLabel: "설명으로 끝난 문장",
    correctSpan: "이미지와 행동이 함께 있는 표현",
    incorrectSpan: "감정 이름만 붙인 표현",
    writingGoal: "한 장면이 보이는 글",
  },
  "basic-sentence-writing": {
    categoryId: "home",
    categoryLabel: "기초 문장",
    pattern: "sentence",
    tone: "info",
    coreSkill: "가장 작은 문장을 정확히 세우는 힘",
    goodLabel: "호응이 맞는 문장",
    avoidLabel: "성분이 빠진 문장",
    correctSpan: "누가 무엇을 하는지 보이는 부분",
    incorrectSpan: "주어 없이 떠 있는 서술어",
    writingGoal: "기본 성분이 갖춰진 문장",
  },
  "emotion-writing": {
    categoryId: "home",
    categoryLabel: "감정 표현",
    pattern: "emotion",
    tone: "primary",
    coreSkill: "감정을 장면과 몸의 반응으로 옮기는 힘",
    goodLabel: "감정이 드러나는 장면",
    avoidLabel: "감정 이름만 적은 문장",
    correctSpan: "몸의 반응으로 감정을 보여 주는 표현",
    incorrectSpan: "그냥 슬펐다고 말하는 표현",
    writingGoal: "감정을 직접 말하지 않는 장면",
  },
  "business-email": {
    categoryId: "home",
    categoryLabel: "비즈니스 이메일",
    pattern: "business",
    tone: "neutral",
    coreSkill: "수신자가 바로 이해하는 이메일 구조",
    goodLabel: "목적이 보이는 이메일",
    avoidLabel: "빙빙 도는 이메일",
    correctSpan: "요청과 기한이 함께 있는 문장",
    incorrectSpan: "확인이 어렵게 흐린 문장",
    writingGoal: "목적과 요청이 분명한 이메일",
  },
}

const lessonCatalogSource = createLessonCatalog()

export const lessonCatalog: readonly Lesson[] = lessonCatalogSource

export const prototypeLesson: Lesson = lessonCatalog[0] ?? createEmptyFallback()

const lessonMap = new Map(lessonCatalog.map((lesson) => [lesson.id, lesson]))

validateLessonCatalog(lessonCatalog)

export function getLessonById(id: string): Lesson | undefined {
  return lessonMap.get(lessonId(id))
}

export function getDefaultLesson(): Lesson {
  return prototypeLesson
}

export function getNextLessonId(currentLessonId: LessonId): LessonId | null {
  return lessonMap.get(currentLessonId)?.nextLessonId ?? null
}

function createLessonCatalog(): readonly Lesson[] {
  return courseDetails.flatMap((course) => {
    const profile = getCourseProfile(course)
    const lessonRefs = getCourseLessonRefs(course)

    return lessonRefs.map((lessonRef) =>
      createLesson({
        ...lessonRef,
        profile,
      })
    )
  })
}

function getCourseProfile(course: CourseDetail): CourseProfile {
  const profile = courseProfiles[String(course.id)]

  if (!profile) {
    throw new Error(`Missing lesson course profile: ${course.id}`)
  }

  return profile
}

function getCourseLessonRefs(course: CourseDetail): readonly CourseLessonRef[] {
  const refs = course.chapters.flatMap((chapter, chapterIndex) =>
    chapter.lessons.map((lesson, lessonIndexInChapter) => ({
      course,
      chapter,
      lesson,
      chapterIndex,
      lessonIndexInChapter,
    }))
  )

  return refs.map((ref, index) => ({
    ...ref,
    nextLesson: refs[index + 1]?.lesson,
  }))
}

function createLesson(input: LessonBuildInput): Lesson {
  const currentLessonId = lessonId(String(input.lesson.lessonId))
  const middleSteps = createMiddleSteps(input, currentLessonId)
  const totalSteps = middleSteps.length + LESSON_BOUNDARY_STEP_COUNT
  const summaryOrder = totalSteps - SUMMARY_STEP_OFFSET_FROM_END

  const steps: readonly LessonStep[] = [
    lessonStep(currentLessonId, 1, "INTRO", {
      title: input.lesson.title,
      category: input.profile.categoryLabel,
      tagTone: input.profile.tone,
      bullets: [
        `${input.profile.coreSkill}을 ${input.lesson.title} 맥락에서 익힙니다.`,
        input.lesson.description,
        `마지막에는 ${input.profile.writingGoal}을 직접 작성합니다.`,
      ],
      estimatedMinutes: getEstimatedMinutes(input.profile.pattern, totalSteps),
      totalSteps,
    }),
    ...middleSteps,
    lessonStep(currentLessonId, summaryOrder, "SUMMARY", {
      points: [
        {
          number: 1,
          text: `${input.lesson.title}의 핵심은 ${input.profile.coreSkill}을 실제 문장 안에서 확인하는 것입니다.`,
          icon: "1",
        },
        {
          number: 2,
          text: `${input.profile.avoidLabel}은 줄이고 ${input.profile.goodLabel}을 남기면 글의 목적이 선명해집니다.`,
          icon: "2",
        },
        {
          number: 3,
          text: `다음 글을 쓸 때는 "${input.lesson.description}"라는 기준을 먼저 떠올려보세요.`,
          icon: "3",
        },
      ],
      nextLesson: input.nextLesson
        ? {
            title: input.nextLesson.title,
            description: input.nextLesson.description,
          }
        : undefined,
    }),
    lessonStep(currentLessonId, totalSteps, "COMPLETE", {
      nextAction: "next-lesson",
    }),
  ]

  return {
    id: currentLessonId,
    title: input.lesson.title,
    categoryId: input.profile.categoryId,
    courseId: String(input.course.id),
    unitNumber: input.chapterIndex + 1,
    nextLessonId: input.nextLesson
      ? lessonId(String(input.nextLesson.lessonId))
      : undefined,
    steps,
  }
}

function createMiddleSteps(
  input: LessonBuildInput,
  currentLessonId: LessonId
): readonly LessonStep[] {
  switch (input.profile.pattern) {
    case "sentence":
      return createSentenceSteps(input, currentLessonId)
    case "vocabulary":
      return createVocabularySteps(input, currentLessonId)
    case "reading":
      return createReadingSteps(input, currentLessonId)
    case "grammar":
      return createGrammarSteps(input, currentLessonId)
    case "expression":
      return createExpressionSteps(input, currentLessonId)
    case "essay":
      return createEssaySteps(input, currentLessonId)
    case "business":
      return createBusinessSteps(input, currentLessonId)
    case "creative":
      return createCreativeSteps(input, currentLessonId)
    case "emotion":
      return createEmotionSteps(input, currentLessonId)
  }
}

function createSentenceSteps(
  input: LessonBuildInput,
  currentLessonId: LessonId
): readonly LessonStep[] {
  const steps: LessonStep[] = []
  const add = createStepAdder(steps, currentLessonId)

  add(
    "CONCEPT",
    conceptContent(input, "문장은 성분이 아니라 관계로 읽어야 합니다.")
  )
  add("EXAMPLE_REVEAL", exampleRevealContent(input))
  add("MULTIPLE_CHOICE", multipleChoiceContent(input))
  add("FILL_BLANK", fillBlankContent(input))
  add("REORDER", reorderContent(input))
  const writeStep = add("SHORT_WRITE", shortWriteContent(input))
  add("AI_FEEDBACK", aiFeedbackContent(input, writeStep.id))
  add("CHECKLIST", checklistContent(input))

  return steps
}

function createVocabularySteps(
  input: LessonBuildInput,
  currentLessonId: LessonId
): readonly LessonStep[] {
  const steps: LessonStep[] = []
  const add = createStepAdder(steps, currentLessonId)

  add(
    "CONCEPT",
    conceptContent(input, "좋은 단어는 뜻보다 쓰이는 장면이 먼저 보입니다.")
  )
  add("COMPARE", compareContent(input))
  add("MATCH", matchContent(input))
  add("FILL_BLANK", fillBlankContent(input))
  add("CLASSIFY", classifyContent(input))
  const writeStep = add("SHORT_WRITE", shortWriteContent(input))
  add("AI_FEEDBACK", aiFeedbackContent(input, writeStep.id))
  add("REFLECTION", reflectionContent(input), {
    required: false,
    points: OPTIONAL_REFLECTION_POINTS,
  })

  return steps
}

function createReadingSteps(
  input: LessonBuildInput,
  currentLessonId: LessonId
): readonly LessonStep[] {
  const steps: LessonStep[] = []
  const add = createStepAdder(steps, currentLessonId)

  add("READING_PASSAGE", readingPassageContent(input))
  add("WORD_SELECT", wordSelectContent(input))
  add("MULTIPLE_CHOICE", multipleChoiceContent(input))
  add("COMPARE", compareContent(input))
  add("REORDER", reorderContent(input))
  const writeStep = add("SHORT_WRITE", shortWriteContent(input))
  add("AI_FEEDBACK", aiFeedbackContent(input, writeStep.id))

  return steps
}

function createGrammarSteps(
  input: LessonBuildInput,
  currentLessonId: LessonId
): readonly LessonStep[] {
  const steps: LessonStep[] = []
  const add = createStepAdder(steps, currentLessonId)

  add(
    "CONCEPT",
    conceptContent(input, "문법 규칙은 외운 뒤보다 적용할 때 더 분명해집니다.")
  )
  add("MULTIPLE_CHOICE", multipleChoiceContent(input))
  add("FILL_BLANK", fillBlankContent(input))
  add("WORD_SELECT", wordSelectContent(input))
  add("REVISION", revisionContent(input))
  add("CHECKLIST", checklistContent(input))
  add("TRANSCRIBE", transcribeContent(input))

  return steps
}

function createExpressionSteps(
  input: LessonBuildInput,
  currentLessonId: LessonId
): readonly LessonStep[] {
  const steps: LessonStep[] = []
  const add = createStepAdder(steps, currentLessonId)

  add(
    "CONCEPT",
    conceptContent(
      input,
      "표현력은 화려함이 아니라 장면을 정확히 전달하는 힘입니다."
    )
  )
  add("EXAMPLE_REVEAL", exampleRevealContent(input))
  add("COMPARE", compareContent(input))
  add("WORD_SELECT", wordSelectContent(input))
  add("CLASSIFY", classifyContent(input))
  const writeStep = add("LONG_WRITE", longWriteContent(input))
  add("AI_FEEDBACK", aiFeedbackContent(input, writeStep.id))
  add("REVISION", revisionContent(input))

  return steps
}

function createEssaySteps(
  input: LessonBuildInput,
  currentLessonId: LessonId
): readonly LessonStep[] {
  const steps: LessonStep[] = []
  const add = createStepAdder(steps, currentLessonId)

  add(
    "CONCEPT",
    conceptContent(input, "에세이는 소재보다 관점이 먼저 독자를 붙잡습니다.")
  )
  add("READING_PASSAGE", readingPassageContent(input))
  add("COMPARE", compareContent(input))
  add("REORDER", reorderContent(input))
  const writeStep = add("LONG_WRITE", longWriteContent(input))
  add("AI_FEEDBACK", aiFeedbackContent(input, writeStep.id))
  add("REVISION", revisionContent(input))
  add("REFLECTION", reflectionContent(input), {
    required: false,
    points: OPTIONAL_REFLECTION_POINTS,
  })

  return steps
}

function createBusinessSteps(
  input: LessonBuildInput,
  currentLessonId: LessonId
): readonly LessonStep[] {
  const steps: LessonStep[] = []
  const add = createStepAdder(steps, currentLessonId)

  add(
    "CONCEPT",
    conceptContent(
      input,
      "업무 글은 읽는 사람이 다음 행동을 정할 수 있어야 합니다."
    )
  )
  add("EXAMPLE_REVEAL", exampleRevealContent(input))
  add("MULTIPLE_CHOICE", multipleChoiceContent(input))
  add("REORDER", reorderContent(input))
  add("REVISION", revisionContent(input))
  const writeStep = add("LONG_WRITE", longWriteContent(input))
  add("AI_FEEDBACK", aiFeedbackContent(input, writeStep.id))
  add("CHECKLIST", checklistContent(input))

  return steps
}

function createCreativeSteps(
  input: LessonBuildInput,
  currentLessonId: LessonId
): readonly LessonStep[] {
  const steps: LessonStep[] = []
  const add = createStepAdder(steps, currentLessonId)

  add(
    "CONCEPT",
    conceptContent(
      input,
      "창작 글은 설명을 덜고 독자가 볼 수 있는 증거를 남길 때 힘이 생깁니다."
    )
  )
  add("READING_PASSAGE", readingPassageContent(input))
  add("EXAMPLE_REVEAL", exampleRevealContent(input))
  add("WORD_SELECT", wordSelectContent(input))
  add("CLASSIFY", classifyContent(input))
  const writeStep = add("LONG_WRITE", longWriteContent(input))
  add("AI_FEEDBACK", aiFeedbackContent(input, writeStep.id))
  add("REFLECTION", reflectionContent(input), {
    required: false,
    points: OPTIONAL_REFLECTION_POINTS,
  })

  return steps
}

function createEmotionSteps(
  input: LessonBuildInput,
  currentLessonId: LessonId
): readonly LessonStep[] {
  const steps: LessonStep[] = []
  const add = createStepAdder(steps, currentLessonId)

  add(
    "CONCEPT",
    conceptContent(input, "감정은 이름보다 흔적을 보여줄 때 더 오래 남습니다.")
  )
  add("EXAMPLE_REVEAL", exampleRevealContent(input))
  add("COMPARE", compareContent(input))
  add("CLASSIFY", classifyContent(input))
  const writeStep = add("LONG_WRITE", longWriteContent(input))
  add("AI_FEEDBACK", aiFeedbackContent(input, writeStep.id))
  add("REVISION", revisionContent(input))
  add("REFLECTION", reflectionContent(input), {
    required: false,
    points: OPTIONAL_REFLECTION_POINTS,
  })

  return steps
}

function createStepAdder(steps: LessonStep[], currentLessonId: LessonId) {
  return function add<TType extends LessonStep["type"]>(
    type: TType,
    content: Extract<LessonStep, { type: TType }>["content"],
    options?: {
      points?: number
      required?: boolean
    }
  ): Extract<LessonStep, { type: TType }> {
    const order = steps.length + FIRST_MIDDLE_STEP_ORDER
    const step = {
      id: lessonStepId(`${currentLessonId}-step-${order}`),
      type,
      order,
      points: options?.points ?? getDefaultPoints(type),
      required: options?.required ?? true,
      content,
    } as Extract<LessonStep, { type: TType }>

    steps.push(step)

    return step
  }
}

function lessonStep<TType extends LessonStep["type"]>(
  currentLessonId: LessonId,
  order: number,
  type: TType,
  content: Extract<LessonStep, { type: TType }>["content"],
  options?: {
    points?: number
    required?: boolean
  }
): Extract<LessonStep, { type: TType }> {
  return {
    id: lessonStepId(`${currentLessonId}-step-${order}`),
    type,
    order,
    points: options?.points ?? getDefaultPoints(type),
    required: options?.required ?? true,
    content,
  } as Extract<LessonStep, { type: TType }>
}

function conceptContent(input: LessonBuildInput, principle: string) {
  return {
    subtitle: `${input.lesson.title}의 기준`,
    body: `${input.lesson.description}\n\n${principle} 이번 레슨에서는 "${input.lesson.title}"을/를 기준으로 문장을 읽고, 고르고, 직접 고쳐 씁니다.`,
    highlight: {
      icon: "!",
      text: `${input.profile.goodLabel}을 만들려면 ${input.profile.avoidLabel}을 먼저 찾아야 합니다.`,
      tone: input.profile.tone,
    },
    keyTerms: [
      {
        term: input.profile.coreSkill,
        definition: `${input.chapter.title} 단원에서 반복해서 쓰는 판단 기준입니다.`,
      },
      {
        term: input.profile.writingGoal,
        definition: `이번 레슨의 마지막 쓰기 과제에서 완성할 결과물입니다.`,
      },
    ],
  } satisfies Extract<LessonStep, { type: "CONCEPT" }>["content"]
}

function exampleRevealContent(input: LessonBuildInput) {
  return {
    instruction: `"${input.lesson.title}" 관점에서 두 문장을 비교해보세요.`,
    bad: {
      label: input.profile.avoidLabel,
      text: `${input.lesson.title}은 중요하다고 볼 수 있으며 여러모로 신경 써야 하는 부분이다.`,
    },
    good: {
      label: input.profile.goodLabel,
      text: `${input.lesson.description} 그래서 문장을 쓰기 전 ${input.profile.coreSkill}을 먼저 확인한다.`,
    },
    analysis: `${input.profile.avoidLabel}은 판단 기준이 흐립니다. 반면 좋은 예시는 "${input.lesson.title}"에서 해야 할 행동을 바로 보여 줍니다.`,
    revealTrigger: "button",
  } satisfies Extract<LessonStep, { type: "EXAMPLE_REVEAL" }>["content"]
}

function readingPassageContent(input: LessonBuildInput) {
  return {
    instruction: "다음 짧은 지문을 읽고 핵심 문장을 표시해보세요.",
    title: `${input.lesson.title} 연습 지문`,
    source: "한글쓰기 레슨 자체 제작 지문",
    text: `${input.chapter.title}을 배울 때 가장 먼저 해야 할 일은 글의 목적을 좁히는 것이다. ${input.lesson.description} 이 기준이 없으면 문장은 길어지지만 남는 내용은 줄어든다.\n\n좋은 글은 한 번에 완성되지 않는다. 먼저 ${input.profile.coreSkill}을 확인하고, 그 다음 ${input.profile.avoidLabel}을 덜어낸다. 마지막으로 독자가 실제로 기억할 한 문장을 남긴다.\n\n오늘의 과제는 거창한 글을 쓰는 것이 아니다. "${input.lesson.title}"이라는 한 가지 기준으로 문장을 읽고 고치는 것이다.`,
    estimatedReadMinutes: 1,
    highlightEnabled: true,
    focusQuestion: `${input.profile.goodLabel}을 보여 주는 문장은 어디인가요?`,
  } satisfies Extract<LessonStep, { type: "READING_PASSAGE" }>["content"]
}

function compareContent(input: LessonBuildInput) {
  return {
    instruction: `${input.lesson.title}을/를 적용한 버전과 적용하지 않은 버전을 비교하세요.`,
    versions: [
      {
        label: "초안",
        text: `${input.lesson.title}에 대해 여러 가지를 생각해 보았고, 전반적으로 좋은 방향으로 써야 한다.`,
        tone: "danger",
      },
      {
        label: "개선안",
        text: `${input.lesson.description} 이를 위해 첫 문장부터 ${input.profile.coreSkill}을 드러낸다.`,
        tone: input.profile.tone,
      },
      {
        label: "응용안",
        text: `${input.chapter.title}의 흐름에 맞춰 ${input.profile.writingGoal}을 한 문단 안에서 완성한다.`,
        tone: "info",
      },
    ],
    analysis: `초안은 의도만 있고 판단 기준이 없습니다. 개선안과 응용안은 ${input.profile.goodLabel}을 중심으로 독자가 확인할 수 있는 행동을 남깁니다.`,
    discussionQuestion: `내 글에서 ${input.profile.avoidLabel}이 자주 나타나는 위치는 어디일까요?`,
  } satisfies Extract<LessonStep, { type: "COMPARE" }>["content"]
}

function multipleChoiceContent(input: LessonBuildInput) {
  return {
    context: `${input.lesson.title}: ${input.lesson.description}`,
    question: "이번 레슨의 핵심 기준에 가장 가까운 설명은 무엇인가요?",
    options: [
      {
        id: "A",
        text: `${input.profile.coreSkill}을 확인하고 ${input.profile.writingGoal}으로 옮긴다.`,
        isCorrect: true,
      },
      {
        id: "B",
        text: "문장을 길게 늘려 더 성실해 보이게 만든다.",
        isCorrect: false,
      },
      {
        id: "C",
        text: "익숙한 표현을 그대로 두고 맞춤법만 확인한다.",
        isCorrect: false,
      },
      {
        id: "D",
        text: "독자가 알아서 맥락을 추측하도록 여지를 많이 남긴다.",
        isCorrect: false,
      },
    ],
    explanation: `정답은 A입니다. "${input.lesson.title}"에서는 ${input.lesson.description} 그래서 ${input.profile.coreSkill}을 문장 안에서 확인해야 합니다.`,
    allowMultiple: false,
    shuffleOptions: false,
  } satisfies Extract<LessonStep, { type: "MULTIPLE_CHOICE" }>["content"]
}

function fillBlankContent(input: LessonBuildInput) {
  return {
    instruction: "빈칸에 들어갈 핵심 표현을 고르세요.",
    template: `${input.lesson.title}에서는 {{blank_1}}을/를 먼저 확인하고, 초안에서 {{blank_2}}을/를 덜어냅니다.`,
    blanks: [
      {
        id: "blank_1",
        correctAnswers: [input.profile.coreSkill],
        hint: "이번 코스에서 반복하는 판단 기준",
      },
      {
        id: "blank_2",
        correctAnswers: [input.profile.avoidLabel],
        hint: "초안에서 줄여야 할 표현",
      },
    ],
    inputMode: "word-bank",
    wordBank: [
      input.profile.coreSkill,
      input.profile.goodLabel,
      input.profile.avoidLabel,
      input.profile.writingGoal,
      "글자 수",
      "장식적인 표현",
    ],
    explanation: `${input.profile.coreSkill}을 먼저 세우면 ${input.profile.avoidLabel}을 더 쉽게 발견할 수 있습니다.`,
    caseSensitive: false,
  } satisfies Extract<LessonStep, { type: "FILL_BLANK" }>["content"]
}

function wordSelectContent(input: LessonBuildInput) {
  return {
    instruction: `${input.profile.goodLabel}에 해당하는 부분을 모두 선택하세요.`,
    markedText: `{{${input.profile.correctSpan}:s1:correct}}은 "${input.lesson.title}"의 기준을 보여 줍니다. {{${input.profile.incorrectSpan}:s2:incorrect}}은 초안에서 줄여야 합니다. {{${input.lesson.description}:s3:correct}}`,
    globalExplanation: `${input.profile.correctSpan}처럼 기준을 드러내는 표현을 남기고, ${input.profile.incorrectSpan}처럼 흐린 표현은 고칩니다.`,
    spanExplanations: {
      s1: "이번 레슨의 핵심 판단 기준입니다.",
      s2: "의미가 흐려져 개선이 필요한 표현입니다.",
      s3: "레슨 설명 자체가 오늘의 적용 방향을 알려 줍니다.",
    },
  } satisfies Extract<LessonStep, { type: "WORD_SELECT" }>["content"]
}

function reorderContent(input: LessonBuildInput) {
  return {
    instruction: `${input.lesson.title}을 적용하는 순서로 문장을 배열하세요.`,
    items: [
      {
        id: "r1",
        text: `${input.profile.avoidLabel}을 초안에서 찾는다.`,
        correctOrder: 2,
      },
      {
        id: "r2",
        text: `${input.profile.writingGoal}으로 한 문장을 다시 쓴다.`,
        correctOrder: 4,
      },
      {
        id: "r3",
        text: `${input.profile.coreSkill}을 오늘의 기준으로 정한다.`,
        correctOrder: 1,
      },
      {
        id: "r4",
        text: `${input.profile.goodLabel}이 남도록 표현을 고른다.`,
        correctOrder: 3,
      },
    ],
    itemType: "sentence",
    explanation: `기준 설정 → 문제 발견 → 개선 표현 선택 → 재작성 순서가 가장 안정적입니다.`,
    showNumberHint: true,
  } satisfies Extract<LessonStep, { type: "REORDER" }>["content"]
}

function matchContent(input: LessonBuildInput) {
  return {
    instruction: "왼쪽 개념과 오른쪽 설명을 연결하세요.",
    pairs: [
      {
        id: "p1",
        left: input.profile.coreSkill,
        right: `${input.lesson.title}의 판단 기준`,
      },
      {
        id: "p2",
        left: input.profile.goodLabel,
        right: "초안에 남겨야 할 방향",
      },
      {
        id: "p3",
        left: input.profile.avoidLabel,
        right: "퇴고 때 먼저 줄일 표현",
      },
      {
        id: "p4",
        left: input.profile.writingGoal,
        right: "레슨 마지막에 직접 만들 결과물",
      },
    ],
    shuffleRight: true,
    displayMode: "tap-connect",
    explanation: `네 개념은 ${input.lesson.title} 레슨 전체를 관통하는 작은 지도입니다.`,
  } satisfies Extract<LessonStep, { type: "MATCH" }>["content"]
}

function classifyContent(input: LessonBuildInput) {
  return {
    instruction: "각 문장을 알맞은 묶음으로 분류하세요.",
    categories: [
      {
        id: "good",
        label: input.profile.goodLabel,
        tone: input.profile.tone,
      },
      {
        id: "avoid",
        label: input.profile.avoidLabel,
        tone: "danger",
      },
    ],
    items: [
      {
        id: "i1",
        text: `${input.lesson.description}`,
        correctCategoryId: "good",
      },
      {
        id: "i2",
        text: `${input.lesson.title}은 여러모로 중요하므로 잘해야 한다.`,
        correctCategoryId: "avoid",
      },
      {
        id: "i3",
        text: `${input.profile.coreSkill}을 기준으로 첫 문장을 고친다.`,
        correctCategoryId: "good",
      },
      {
        id: "i4",
        text: "독자가 알아서 의미를 파악할 수 있을 것이다.",
        correctCategoryId: "avoid",
      },
    ],
    globalExplanation: `${input.profile.goodLabel}은 행동과 기준이 보입니다. ${input.profile.avoidLabel}은 의도만 있고 확인 가능한 변화가 없습니다.`,
  } satisfies Extract<LessonStep, { type: "CLASSIFY" }>["content"]
}

function shortWriteContent(input: LessonBuildInput) {
  return {
    instruction: `${input.lesson.title} 짧은 쓰기`,
    prompt: `${input.lesson.description} 이 기준을 반영해 한 문장을 새로 써보세요.`,
    sourceText: `${input.profile.avoidLabel}: ${input.lesson.title}은 중요해서 잘 써야 한다.`,
    maxChars: SHORT_WRITE_LENGTH_LIMIT.maxChars,
    minChars: SHORT_WRITE_LENGTH_LIMIT.minChars,
    referenceAnswer: `${input.profile.coreSkill}을 먼저 확인한 뒤, ${input.profile.writingGoal}으로 문장을 다듬는다.`,
    aiEvaluationEnabled: false,
    showReferenceAfterSubmit: true,
  } satisfies Extract<LessonStep, { type: "SHORT_WRITE" }>["content"]
}

function longWriteContent(input: LessonBuildInput) {
  return {
    instruction: `${input.lesson.title} 글쓰기 과제`,
    topic: `${input.lesson.description} 이 목표가 드러나도록 ${LONG_WRITE_LENGTH_LIMIT.targetChars}자 안팎의 문단을 작성하세요.`,
    context: `"${input.chapter.title}" 단원의 흐름을 떠올리며 ${input.profile.goodLabel}을 남겨보세요.`,
    structureGuide: [
      `첫 문장: ${input.profile.coreSkill}을 드러내기`,
      `중간 문장: ${input.profile.avoidLabel}을 피하고 구체화하기`,
      `마지막 문장: ${input.profile.writingGoal}으로 마무리하기`,
    ],
    minChars: LONG_WRITE_LENGTH_LIMIT.minChars,
    targetChars: LONG_WRITE_LENGTH_LIMIT.targetChars,
    maxChars: LONG_WRITE_LENGTH_LIMIT.maxChars,
    aiEvaluationEnabled: false,
    evaluationCriteria: `${input.profile.coreSkill}, ${input.profile.goodLabel}, 문장 흐름`,
    draftSaveEnabled: true,
  } satisfies Extract<LessonStep, { type: "LONG_WRITE" }>["content"]
}

function aiFeedbackContent(
  input: LessonBuildInput,
  sourceStepId: LessonStepId
) {
  return {
    sourceStepId,
    feedbackPrompt: `${input.lesson.title} 과제에서 ${input.profile.coreSkill}이 드러나는지 평가합니다.`,
    focusAreas: ["clarity", "expression"],
    showScore: true,
    scoreRange: AI_FEEDBACK_SCORE_RANGE,
    allowRevision: true,
    maxRevisions: AI_FEEDBACK_MAX_REVISIONS,
  } satisfies Extract<LessonStep, { type: "AI_FEEDBACK" }>["content"]
}

function revisionContent(input: LessonBuildInput) {
  return {
    instruction: "아래 초안을 퇴고해보세요.",
    revisionTask: `${input.profile.avoidLabel}을 줄이고 ${input.profile.goodLabel}으로 바꾸세요.`,
    originalText: `${input.lesson.title}은 중요한 내용이다. 여러 가지 점에서 신경 써야 하며, 좋은 글이 되도록 잘 정리하는 것이 필요하다.`,
    hints: [
      `${input.profile.coreSkill}이 보이는 문장으로 바꿔보세요.`,
      `${input.lesson.description}라는 목표가 직접 드러나는지 확인하세요.`,
    ],
    revisionType: "targeted",
    referenceRevision: `${input.lesson.description} 그래서 초안의 흐린 표현을 덜고 ${input.profile.writingGoal}으로 다시 쓴다.`,
    aiEvaluationEnabled: false,
    evaluationCriteria: `${input.profile.avoidLabel} 제거, ${input.profile.goodLabel} 강화`,
  } satisfies Extract<LessonStep, { type: "REVISION" }>["content"]
}

function checklistContent(input: LessonBuildInput) {
  return {
    instruction: `${input.lesson.title} 점검표`,
    items: [
      {
        id: "c1",
        text: `${input.profile.coreSkill}이 문장에 드러나나요?`,
        required: true,
        tip: "문장을 읽고 판단 기준을 한 단어로 말할 수 있어야 합니다.",
      },
      {
        id: "c2",
        text: `${input.profile.avoidLabel}을 줄였나요?`,
        required: true,
      },
      {
        id: "c3",
        text: `${input.profile.goodLabel}이 독자에게 바로 보이나요?`,
        required: false,
      },
      {
        id: "c4",
        text: `${input.profile.writingGoal}로 마무리됐나요?`,
        required: false,
      },
    ],
    completionMode: "minimum",
    minimumChecks: CHECKLIST_MINIMUM_REQUIRED_CHECKS,
    saveResponses: true,
  } satisfies Extract<LessonStep, { type: "CHECKLIST" }>["content"]
}

function reflectionContent(input: LessonBuildInput) {
  return {
    question: `${input.lesson.title}을 내 글에 적용한다면 어디부터 고치고 싶나요?`,
    context: `${input.lesson.description} 오늘 배운 기준을 실제 글쓰기 습관과 연결해봅니다.`,
    promptStarters: [
      "내가 자주 쓰는 흐린 표현은...",
      "다음 글에서 먼저 확인할 것은...",
      "오늘 가장 도움이 된 기준은...",
    ],
    minChars: REFLECTION_LENGTH_LIMIT.minChars,
    saveToJournal: true,
    category: input.profile.categoryLabel,
    isSkippable: true,
  } satisfies Extract<LessonStep, { type: "REFLECTION" }>["content"]
}

function transcribeContent(input: LessonBuildInput) {
  return {
    instruction: "핵심 문장을 그대로 따라 써보세요.",
    sourceText: `${input.lesson.description} ${input.profile.coreSkill}을 기준으로 ${input.profile.writingGoal}을 완성한다.`,
    source: `${input.lesson.title} 핵심 문장`,
    showMatchRate: true,
    caseSensitive: false,
    punctuationSensitive: true,
    focusNote: "표기와 띄어쓰기를 함께 확인하세요.",
  } satisfies Extract<LessonStep, { type: "TRANSCRIBE" }>["content"]
}

function getDefaultPoints(type: LessonStep["type"]) {
  return LESSON_STEP_DEFAULT_POINTS[type]
}

function getEstimatedMinutes(pattern: LessonPattern, totalSteps: number) {
  if (EXTENDED_LESSON_ESTIMATE.patterns.some((value) => value === pattern)) {
    return Math.max(
      EXTENDED_LESSON_ESTIMATE.minimumMinutes,
      totalSteps + EXTENDED_LESSON_ESTIMATE.extraMinutes
    )
  }

  if (MEDIUM_LESSON_ESTIMATE.patterns.some((value) => value === pattern)) {
    return Math.max(
      MEDIUM_LESSON_ESTIMATE.minimumMinutes,
      totalSteps + MEDIUM_LESSON_ESTIMATE.extraMinutes
    )
  }

  return Math.max(
    DEFAULT_LESSON_ESTIMATE.minimumMinutes,
    totalSteps + DEFAULT_LESSON_ESTIMATE.extraMinutes
  )
}

function validateLessonCatalog(catalog: readonly Lesson[]) {
  const courseLessonIds = new Set(
    courseDetails.flatMap((course) =>
      course.chapters.flatMap((chapter) =>
        chapter.lessons.map((lesson) => String(lesson.lessonId))
      )
    )
  )
  const catalogIds = new Set(catalog.map((lesson) => String(lesson.id)))

  for (const courseLessonId of courseLessonIds) {
    if (!catalogIds.has(courseLessonId)) {
      throw new Error(
        `Missing lesson data for course lesson: ${courseLessonId}`
      )
    }
  }

  for (const catalogId of catalogIds) {
    if (!courseLessonIds.has(catalogId)) {
      throw new Error(
        `Lesson data has no course curriculum match: ${catalogId}`
      )
    }
  }

  if (catalogIds.size !== catalog.length) {
    throw new Error("Lesson data contains duplicated lesson IDs")
  }

  for (const lesson of catalog) {
    validateLessonSteps(lesson)
  }
}

function validateLessonSteps(lesson: Lesson) {
  const stepIds = new Set(lesson.steps.map((step) => String(step.id)))

  if (stepIds.size !== lesson.steps.length) {
    throw new Error(`Lesson has duplicated step IDs: ${lesson.id}`)
  }

  lesson.steps.forEach((step, index) => {
    const expectedOrder = index + 1

    if (step.order !== expectedOrder) {
      throw new Error(
        `Lesson step order mismatch: ${lesson.id} expected ${expectedOrder}`
      )
    }
  })

  const introStep = lesson.steps[0]

  if (introStep?.type !== "INTRO") {
    throw new Error(`Lesson must start with INTRO: ${lesson.id}`)
  }

  if (introStep.content.totalSteps !== lesson.steps.length) {
    throw new Error(`Lesson intro totalSteps mismatch: ${lesson.id}`)
  }

  const completeStep = lesson.steps[lesson.steps.length - 1]

  if (completeStep?.type !== "COMPLETE") {
    throw new Error(`Lesson must end with COMPLETE: ${lesson.id}`)
  }

  for (const step of lesson.steps) {
    if (step.type !== "AI_FEEDBACK") {
      continue
    }

    if (!stepIds.has(String(step.content.sourceStepId))) {
      throw new Error(
        `AI feedback references a missing source step: ${lesson.id}`
      )
    }
  }
}

function createEmptyFallback(): Lesson {
  throw new Error("Lesson catalog must include at least one lesson")
}
