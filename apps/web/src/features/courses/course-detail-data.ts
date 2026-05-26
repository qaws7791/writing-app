import {
  courseId,
  type Brand,
  type CourseId,
} from "@/features/courses/course-ids"

export type CourseChapterId = Brand<string, "course-chapter-id">
export type CourseLessonId = Brand<string, "course-lesson-id">

export interface CourseLesson {
  id: CourseLessonId
  lessonId: CourseLessonId
  title: string
  description: string
  completed: boolean
}

export interface CourseChapter {
  id: CourseChapterId
  label: string
  title: string
  lessons: readonly CourseLesson[]
}

export interface CourseProgress {
  completedLessons: number
  totalLessons: number
  percentage: number
}

export interface CourseNextLesson {
  chapterLabel: string
  title: string
  description: string
  lessonId: CourseLessonId
}

export interface CourseDetail {
  id: CourseId
  title: string
  description: string
  thumbnail: string
  progress: CourseProgress
  nextLesson: CourseNextLesson
  chapters: readonly CourseChapter[]
}

interface CourseDetailInput {
  id: CourseId
  title: string
  description: string
  thumbnail: string
  chapters: readonly CourseChapter[]
}

function chapterId(value: string): CourseChapterId {
  return value as CourseChapterId
}

function lessonId(value: string): CourseLessonId {
  return value as CourseLessonId
}

function lesson(
  id: string,
  title: string,
  description: string,
  completed = false
): CourseLesson {
  return {
    id: lessonId(id),
    lessonId: lessonId(id),
    title,
    description,
    completed,
  }
}

function chapter(
  id: string,
  label: string,
  title: string,
  lessons: readonly CourseLesson[]
): CourseChapter {
  return {
    id: chapterId(id),
    label,
    title,
    lessons,
  }
}

function createCourseDetail(input: CourseDetailInput): CourseDetail {
  const lessonsWithChapter = input.chapters.flatMap((courseChapter) =>
    courseChapter.lessons.map((courseLesson) => ({
      chapterLabel: courseChapter.label,
      lesson: courseLesson,
    }))
  )
  const totalLessons = lessonsWithChapter.length
  const completedLessons = lessonsWithChapter.filter(
    ({ lesson: courseLesson }) => courseLesson.completed
  ).length
  const nextLessonSource =
    lessonsWithChapter.find(
      ({ lesson: courseLesson }) => !courseLesson.completed
    ) ?? lessonsWithChapter[0]

  if (!nextLessonSource) {
    throw new Error(
      `Course detail must include at least one lesson: ${input.id}`
    )
  }

  return {
    ...input,
    progress: {
      completedLessons,
      totalLessons,
      percentage: Math.round((completedLessons / totalLessons) * 100),
    },
    nextLesson: {
      chapterLabel: nextLessonSource.chapterLabel,
      title: nextLessonSource.lesson.title,
      description: nextLessonSource.lesson.description,
      lessonId: nextLessonSource.lesson.lessonId,
    },
  }
}

export const courseDetails: readonly CourseDetail[] = [
  createCourseDetail({
    id: courseId("sentence-structure"),
    title: "문장 구조의 기본",
    description:
      "한국어 문장의 뼈대를 이해하고 주어, 서술어, 목적어의 관계를 파악해 올바른 문장을 작성하는 방법을 배웁니다.",
    thumbnail: "/course-thumbnails/sentence-structure.png",
    chapters: [
      chapter("sentence-structure-chapter-1", "1단원", "문장의 뼈대", [
        lesson(
          "sentence-structure-01",
          "주어와 서술어 찾기",
          "문장의 중심 성분을 구분하고 기본 의미 관계를 확인합니다."
        ),
        lesson(
          "sentence-structure-02",
          "목적어와 보어의 자리",
          "서술어가 요구하는 성분을 보고 문장 구조를 완성합니다."
        ),
        lesson(
          "sentence-structure-03",
          "꾸밈말이 놓이는 위치",
          "관형어와 부사어가 문장의 의미를 어떻게 좁히는지 배웁니다."
        ),
        lesson(
          "sentence-structure-04",
          "문장 성분 점검표",
          "짧은 문장을 분석하며 빠진 성분과 불필요한 성분을 찾습니다."
        ),
      ]),
      chapter("sentence-structure-chapter-2", "2단원", "문장의 연결", [
        lesson(
          "sentence-structure-05",
          "이어진 문장의 기본",
          "대등하게 이어진 절과 종속적으로 이어진 절을 구분합니다."
        ),
        lesson(
          "sentence-structure-06",
          "접속 표현 고르기",
          "원인, 조건, 전환의 관계에 맞는 연결 표현을 선택합니다."
        ),
        lesson(
          "sentence-structure-07",
          "문장 길이 조절하기",
          "긴 문장을 나누고 짧은 문장을 묶어 읽기 쉬운 흐름을 만듭니다."
        ),
        lesson(
          "sentence-structure-08",
          "중복 구조 줄이기",
          "반복되는 주어와 서술어를 정리해 문장을 간결하게 다듬습니다."
        ),
      ]),
      chapter("sentence-structure-chapter-3", "3단원", "문단으로 확장", [
        lesson(
          "sentence-structure-09",
          "중심 문장 세우기",
          "문단의 핵심 문장을 먼저 정하고 뒷문장을 연결합니다."
        ),
        lesson(
          "sentence-structure-10",
          "근거 문장 배치",
          "예시와 설명을 중심 문장 뒤에 자연스럽게 놓습니다."
        ),
        lesson(
          "sentence-structure-11",
          "전환 문장 만들기",
          "다음 문단으로 넘어가는 연결 문장을 작성합니다."
        ),
        lesson(
          "sentence-structure-12",
          "구조 중심 퇴고",
          "문장 성분과 문단 흐름을 함께 점검하며 글을 고칩니다."
        ),
      ]),
    ],
  }),
  createCourseDetail({
    id: courseId("vocabulary-basics"),
    title: "어휘 확장 입문",
    description:
      "일상적인 글쓰기에 필요한 핵심 어휘를 익히고, 다양한 상황에서 정확한 단어를 선택하는 감각을 기릅니다.",
    thumbnail: "/course-thumbnails/vocabulary-basics.png",
    chapters: [
      chapter("vocabulary-basics-chapter-1", "1단원", "정확한 단어 선택", [
        lesson(
          "vocabulary-basics-01",
          "비슷한 말의 차이",
          "의미가 가까운 단어들의 뉘앙스와 사용 장면을 구분합니다."
        ),
        lesson(
          "vocabulary-basics-02",
          "막연한 표현 바꾸기",
          "좋다, 많다, 크다처럼 넓은 표현을 구체적인 단어로 고칩니다."
        ),
        lesson(
          "vocabulary-basics-03",
          "감각어 늘리기",
          "시각, 청각, 촉각을 활용해 묘사의 해상도를 높입니다."
        ),
        lesson(
          "vocabulary-basics-04",
          "상황에 맞는 높임 어휘",
          "격식과 관계에 따라 어휘의 높낮이를 조절합니다."
        ),
        lesson(
          "vocabulary-basics-05",
          "단어장 작성법",
          "외운 단어가 아니라 실제 문장에 쓸 수 있는 단어장을 만듭니다."
        ),
      ]),
      chapter("vocabulary-basics-chapter-2", "2단원", "문맥 안에서 쓰기", [
        lesson(
          "vocabulary-basics-06",
          "문맥 단서 읽기",
          "앞뒤 문장을 보고 가장 어울리는 단어를 추론합니다."
        ),
        lesson(
          "vocabulary-basics-07",
          "관용 표현 익히기",
          "자주 쓰이는 관용 표현의 의미와 자연스러운 활용을 배웁니다."
        ),
        lesson(
          "vocabulary-basics-08",
          "군더더기 어휘 줄이기",
          "의미가 겹치는 단어를 정리해 문장을 선명하게 만듭니다."
        ),
        lesson(
          "vocabulary-basics-09",
          "주제별 어휘 묶기",
          "감정, 관계, 일상 주제에 맞춰 어휘를 분류합니다."
        ),
        lesson(
          "vocabulary-basics-10",
          "새 단어로 짧은 글 쓰기",
          "새로 익힌 단어를 활용해 짧은 단락을 완성합니다."
        ),
      ]),
    ],
  }),
  createCourseDetail({
    id: courseId("reading-comprehension"),
    title: "독해와 요약",
    description:
      "글의 핵심 내용을 파악하고 간결하게 요약하는 능력을 키웁니다. 다양한 장르의 텍스트를 읽고 분석합니다.",
    thumbnail: "/course-thumbnails/reading-comprehension.png",
    chapters: [
      chapter("reading-comprehension-chapter-1", "1단원", "정독의 기술", [
        lesson(
          "reading-comprehension-01",
          "빠르게 읽기와 깊이 읽기",
          "읽기 목적에 따라 속도와 집중 지점을 달리하는 법을 배웁니다."
        ),
        lesson(
          "reading-comprehension-02",
          "밑줄 긋기의 기준",
          "핵심 주장, 근거, 전환 표현을 표시하는 기준을 세웁니다."
        ),
        lesson(
          "reading-comprehension-03",
          "한 문단 세 번 읽기",
          "표면 의미, 구조, 의도를 차례로 파악합니다."
        ),
        lesson(
          "reading-comprehension-04",
          "작가의 선택에 주목하기",
          "왜 이 단어와 순서를 선택했는지 질문하며 읽습니다."
        ),
      ]),
      chapter("reading-comprehension-chapter-2", "2단원", "요약의 구조", [
        lesson(
          "reading-comprehension-05",
          "중심 문장 찾기",
          "문단마다 반드시 남겨야 할 핵심 정보를 구분합니다."
        ),
        lesson(
          "reading-comprehension-06",
          "세부 정보 덜어내기",
          "예시, 반복, 부연 설명을 요약문에서 정리합니다."
        ),
        lesson(
          "reading-comprehension-07",
          "한 문장 요약하기",
          "글 전체의 주장과 근거를 하나의 문장으로 압축합니다."
        ),
        lesson(
          "reading-comprehension-08",
          "요약문 퇴고",
          "원문의 의미를 유지하면서 더 짧고 정확하게 고칩니다."
        ),
      ]),
    ],
  }),
  createCourseDetail({
    id: courseId("grammar-complete"),
    title: "문법 완성",
    description:
      "맞춤법, 띄어쓰기, 문장 부호 등 한국어 표기법의 핵심 규칙을 체계적으로 정리하고 실습합니다.",
    thumbnail: "/course-thumbnails/grammar-complete.png",
    chapters: [
      chapter("grammar-complete-chapter-1", "1단원", "맞춤법의 기본", [
        lesson(
          "grammar-complete-01",
          "자주 틀리는 받침",
          "발음과 표기가 달라지는 대표 사례를 익힙니다."
        ),
        lesson(
          "grammar-complete-02",
          "되와 돼 구분",
          "문장 속 활용 형태를 보고 올바른 표기를 선택합니다."
        ),
        lesson(
          "grammar-complete-03",
          "안과 않",
          "부정 표현의 구조를 분석해 혼동을 줄입니다."
        ),
        lesson(
          "grammar-complete-04",
          "로서와 로써",
          "자격과 수단의 차이를 문맥 안에서 구분합니다."
        ),
        lesson(
          "grammar-complete-05",
          "맞춤법 점검 루틴",
          "글을 제출하기 전 확인할 맞춤법 체크리스트를 만듭니다."
        ),
      ]),
      chapter("grammar-complete-chapter-2", "2단원", "띄어쓰기", [
        lesson(
          "grammar-complete-06",
          "조사와 어미",
          "붙여 쓰는 요소와 띄어 쓰는 요소를 구분합니다."
        ),
        lesson(
          "grammar-complete-07",
          "의존 명사",
          "것, 수, 만큼처럼 자주 쓰는 의존 명사의 띄어쓰기를 연습합니다."
        ),
        lesson(
          "grammar-complete-08",
          "보조 용언",
          "해 보다, 먹어 버리다처럼 헷갈리는 보조 용언을 다룹니다."
        ),
        lesson(
          "grammar-complete-09",
          "단위와 수 표현",
          "숫자, 단위, 순서를 문장 안에서 바르게 씁니다."
        ),
        lesson(
          "grammar-complete-10",
          "띄어쓰기 퇴고",
          "짧은 글의 띄어쓰기 오류를 찾아 수정합니다."
        ),
      ]),
      chapter("grammar-complete-chapter-3", "3단원", "문장 부호와 문체", [
        lesson(
          "grammar-complete-11",
          "쉼표의 역할",
          "나열, 삽입, 호흡 조절에 맞게 쉼표를 씁니다."
        ),
        lesson(
          "grammar-complete-12",
          "따옴표와 인용",
          "직접 인용과 간접 인용의 표기 방식을 익힙니다."
        ),
        lesson(
          "grammar-complete-13",
          "문장 끝맺음",
          "평서, 의문, 청유의 끝맺음을 문체에 맞춥니다."
        ),
        lesson(
          "grammar-complete-14",
          "문체 일관성",
          "높임과 어조가 섞이지 않도록 한 글 안의 문체를 통일합니다."
        ),
        lesson(
          "grammar-complete-15",
          "최종 교정 실습",
          "맞춤법, 띄어쓰기, 부호를 한 번에 점검합니다."
        ),
      ]),
    ],
  }),
  createCourseDetail({
    id: courseId("expression"),
    title: "표현력 향상",
    description:
      "같은 내용을 더 풍부하고 생동감 있게 전달하는 표현 방법을 연습합니다. 피동문, 사동문, 비유 표현을 다룹니다.",
    thumbnail: "/course-thumbnails/expression.png",
    chapters: [
      chapter("expression-chapter-1", "1단원", "선명한 묘사", [
        lesson(
          "expression-01",
          "구체적인 명사 고르기",
          "대상을 흐리게 만드는 단어를 더 정확한 명사로 바꿉니다."
        ),
        lesson(
          "expression-02",
          "움직임이 보이는 동사",
          "정적인 문장을 생동감 있는 동사 중심 문장으로 바꿉니다."
        ),
        lesson(
          "expression-03",
          "감각 묘사 확장",
          "시각 중심 묘사를 소리, 냄새, 촉감으로 넓힙니다."
        ),
        lesson(
          "expression-04",
          "묘사와 설명 구분",
          "독자가 장면을 상상하게 만드는 문장과 정보를 주는 문장을 나눕니다."
        ),
      ]),
      chapter("expression-chapter-2", "2단원", "문장의 힘 조절", [
        lesson(
          "expression-05",
          "피동 표현 다듬기",
          "불필요한 피동문을 능동적인 문장으로 고칩니다."
        ),
        lesson(
          "expression-06",
          "사동 표현 쓰기",
          "원인과 작용을 자연스럽게 드러내는 사동 표현을 연습합니다."
        ),
        lesson(
          "expression-07",
          "강조의 위치",
          "중요한 정보를 문장 앞뒤 어디에 놓을지 판단합니다."
        ),
        lesson(
          "expression-08",
          "리듬 있는 문장",
          "문장 길이와 반복을 조절해 읽는 맛을 만듭니다."
        ),
      ]),
      chapter("expression-chapter-3", "3단원", "비유와 어조", [
        lesson(
          "expression-09",
          "좋은 비유의 조건",
          "익숙하지만 새롭게 느껴지는 비유를 만드는 기준을 배웁니다."
        ),
        lesson(
          "expression-10",
          "상투적 표현 피하기",
          "습관적으로 쓰는 표현을 글의 맥락에 맞게 새로 씁니다."
        ),
        lesson(
          "expression-11",
          "어조 통일하기",
          "문장마다 다른 온도를 하나의 글 흐름으로 정리합니다."
        ),
      ]),
    ],
  }),
  createCourseDetail({
    id: courseId("essay-writing"),
    title: "에세이 쓰기",
    description:
      "주제 선정부터 개요 작성, 본문 전개, 마무리까지 설득력 있는 에세이를 완성하는 전 과정을 익힙니다.",
    thumbnail: "/course-thumbnails/essay-writing.png",
    chapters: [
      chapter("essay-writing-chapter-1", "1단원", "주제와 관점", [
        lesson(
          "essay-writing-01",
          "쓸 만한 질문 찾기",
          "개인 경험에서 독자가 함께 생각할 질문을 뽑습니다."
        ),
        lesson(
          "essay-writing-02",
          "주제 좁히기",
          "넓은 소재를 한 편의 글에 맞는 범위로 줄입니다."
        ),
        lesson(
          "essay-writing-03",
          "관점 문장 쓰기",
          "글 전체를 이끄는 관점 문장을 선명하게 만듭니다."
        ),
        lesson(
          "essay-writing-04",
          "독자 설정",
          "누구에게 말하는 글인지 정하고 설명의 깊이를 조절합니다."
        ),
        lesson(
          "essay-writing-05",
          "핵심 메시지 점검",
          "글을 읽고 남아야 할 한 문장을 정합니다."
        ),
      ]),
      chapter("essay-writing-chapter-2", "2단원", "구성과 전개", [
        lesson(
          "essay-writing-06",
          "도입부 설계",
          "독자의 관심을 여는 장면, 질문, 진술을 비교합니다."
        ),
        lesson(
          "essay-writing-07",
          "본문 단락 배열",
          "경험, 해석, 주장 단락을 설득력 있게 배치합니다."
        ),
        lesson(
          "essay-writing-08",
          "사례와 근거",
          "개인적 경험을 보편적 의미로 확장하는 근거를 씁니다."
        ),
        lesson(
          "essay-writing-09",
          "전환 문장",
          "단락 사이의 논리적 이동을 자연스럽게 만듭니다."
        ),
        lesson(
          "essay-writing-10",
          "결론의 여운",
          "반복이 아니라 확장으로 끝나는 마무리를 연습합니다."
        ),
      ]),
      chapter("essay-writing-chapter-3", "3단원", "퇴고와 완성", [
        lesson(
          "essay-writing-11",
          "초고 읽기",
          "쓴 사람의 의도와 독자의 이해 사이의 차이를 찾습니다."
        ),
        lesson(
          "essay-writing-12",
          "문단 순서 바꾸기",
          "글의 흐름이 더 잘 살아나는 배열을 비교합니다."
        ),
        lesson(
          "essay-writing-13",
          "제목 붙이기",
          "주제를 드러내면서도 읽고 싶게 만드는 제목을 만듭니다."
        ),
        lesson(
          "essay-writing-14",
          "최종 원고 다듬기",
          "불필요한 문장을 덜어내고 완성 원고를 정리합니다."
        ),
      ]),
    ],
  }),
  createCourseDetail({
    id: courseId("business-writing"),
    title: "비즈니스 글쓰기",
    description:
      "이메일, 보고서, 제안서 등 업무 환경에서 요구되는 명확하고 전문적인 문서 작성 스킬을 기릅니다.",
    thumbnail: "/course-thumbnails/business-writing.png",
    chapters: [
      chapter("business-writing-chapter-1", "1단원", "업무 문장의 기본", [
        lesson(
          "business-writing-01",
          "목적 먼저 쓰기",
          "문서의 목적을 첫 문장에 분명하게 드러냅니다."
        ),
        lesson(
          "business-writing-02",
          "요청과 공유 구분",
          "상대가 해야 할 일과 알아야 할 일을 분리합니다."
        ),
        lesson(
          "business-writing-03",
          "모호한 표현 줄이기",
          "가능한 빨리, 적절히 같은 표현을 구체적인 조건으로 바꿉니다."
        ),
        lesson(
          "business-writing-04",
          "격식 있는 어조",
          "딱딱하지 않지만 신뢰를 주는 업무 문체를 연습합니다."
        ),
      ]),
      chapter("business-writing-chapter-2", "2단원", "보고와 제안", [
        lesson(
          "business-writing-05",
          "핵심 요약 만들기",
          "긴 내용을 의사 결정에 필요한 정보로 압축합니다."
        ),
        lesson(
          "business-writing-06",
          "현황과 이슈 분리",
          "사실, 문제, 원인을 구분해 보고서 구조를 세웁니다."
        ),
        lesson(
          "business-writing-07",
          "대안 제시",
          "선택지를 비교하고 추천안을 명확히 씁니다."
        ),
        lesson(
          "business-writing-08",
          "근거 자료 연결",
          "숫자와 사례를 문장 안에서 설득력 있게 설명합니다."
        ),
        lesson(
          "business-writing-09",
          "실행 계획 정리",
          "담당자, 일정, 다음 행동을 빠짐없이 적습니다."
        ),
      ]),
      chapter("business-writing-chapter-3", "3단원", "실무 문서 퇴고", [
        lesson(
          "business-writing-10",
          "읽는 순서 점검",
          "상사가 빠르게 읽어도 핵심이 남는 구조를 만듭니다."
        ),
        lesson(
          "business-writing-11",
          "리스크 표현",
          "문제를 숨기지 않으면서도 대응 방향을 함께 제시합니다."
        ),
        lesson(
          "business-writing-12",
          "문서 제목 개선",
          "목적과 결론이 보이는 제목으로 바꿉니다."
        ),
        lesson(
          "business-writing-13",
          "최종 검토 체크",
          "수신자, 근거, 요청, 일정이 모두 드러나는지 확인합니다."
        ),
      ]),
    ],
  }),
  createCourseDetail({
    id: courseId("creative-writing"),
    title: "창의적 글쓰기",
    description:
      "상상력을 자극하는 글쓰기 기법을 배웁니다. 단편 소설, 시, 수필 등 다양한 창작 형식을 탐구합니다.",
    thumbnail: "/course-thumbnails/creative-writing.png",
    chapters: [
      chapter("creative-writing-chapter-1", "1단원", "발상과 관찰", [
        lesson(
          "creative-writing-01",
          "낯설게 보기",
          "익숙한 사물을 새로운 관점으로 묘사합니다."
        ),
        lesson(
          "creative-writing-02",
          "질문에서 시작하기",
          "이야기를 밀고 가는 질문을 만들고 확장합니다."
        ),
        lesson(
          "creative-writing-03",
          "장면 수집",
          "일상의 장면을 기록해 글감으로 바꿉니다."
        ),
        lesson(
          "creative-writing-04",
          "감정의 씨앗",
          "작은 감정을 이야기의 출발점으로 삼습니다."
        ),
      ]),
      chapter("creative-writing-chapter-2", "2단원", "인물과 장면", [
        lesson(
          "creative-writing-05",
          "인물의 욕망",
          "인물이 원하는 것과 두려워하는 것을 설정합니다."
        ),
        lesson(
          "creative-writing-06",
          "행동으로 보여주기",
          "설명 대신 행동과 대화로 성격을 드러냅니다."
        ),
        lesson(
          "creative-writing-07",
          "장소의 분위기",
          "공간 묘사를 통해 이야기의 정서를 만듭니다."
        ),
        lesson(
          "creative-writing-08",
          "대화의 리듬",
          "인물마다 다른 말투와 침묵을 설계합니다."
        ),
      ]),
      chapter("creative-writing-chapter-3", "3단원", "플롯과 전개", [
        lesson(
          "creative-writing-09",
          "사건의 압력",
          "인물이 변할 수밖에 없는 사건을 만듭니다."
        ),
        lesson(
          "creative-writing-10",
          "갈등의 단계",
          "긴장감이 높아지는 순서로 장면을 배열합니다."
        ),
        lesson(
          "creative-writing-11",
          "반전과 발견",
          "뜬금없는 반전이 아니라 필연적인 발견을 설계합니다."
        ),
        lesson(
          "creative-writing-12",
          "끝맺음 선택",
          "해결, 여운, 열린 결말의 효과를 비교합니다."
        ),
      ]),
      chapter("creative-writing-chapter-4", "4단원", "형식 실험", [
        lesson(
          "creative-writing-13",
          "짧은 소설 쓰기",
          "한 장면 안에서 인물과 변화를 담습니다."
        ),
        lesson(
          "creative-writing-14",
          "시적 문장",
          "이미지와 리듬을 중심으로 짧은 글을 씁니다."
        ),
        lesson(
          "creative-writing-15",
          "수필의 목소리",
          "개인적 경험을 사유로 확장하는 목소리를 찾습니다."
        ),
        lesson(
          "creative-writing-16",
          "작품 퇴고",
          "의도, 장면, 문장을 차례로 점검해 작품을 완성합니다."
        ),
      ]),
    ],
  }),
  createCourseDetail({
    id: courseId("basic-sentence-writing"),
    title: "기초 문장 만들기",
    description: "주어, 서술어, 목적어의 긴밀한 관계 탐구",
    thumbnail: "/course-thumbnails/basic-sentence-writing.png",
    chapters: [
      chapter("basic-sentence-writing-chapter-1", "1단원", "문장 성분 익히기", [
        lesson(
          "basic-sentence-writing-01",
          "누가 무엇을 하는가",
          "주어와 서술어를 중심으로 가장 작은 문장을 만듭니다.",
          true
        ),
        lesson(
          "basic-sentence-writing-02",
          "목적어 붙이기",
          "행동의 대상을 더해 문장의 의미를 완성합니다.",
          true
        ),
        lesson(
          "basic-sentence-writing-03",
          "필수 성분과 선택 성분",
          "문장에서 꼭 필요한 말과 덧붙이는 말을 구분합니다.",
          true
        ),
        lesson(
          "basic-sentence-writing-04",
          "짧은 문장 10개 쓰기",
          "기본 구조를 반복해 안정적인 문장 감각을 만듭니다.",
          true
        ),
      ]),
      chapter("basic-sentence-writing-chapter-2", "2단원", "꾸밈과 확장", [
        lesson(
          "basic-sentence-writing-05",
          "형용사 꾸밈과 명사의 배치",
          "명사를 꾸미는 말의 위치와 범위를 확인합니다.",
          true
        ),
        lesson(
          "basic-sentence-writing-06",
          "부사어로 상황 더하기",
          "시간, 장소, 방법 정보를 자연스럽게 붙입니다."
        ),
        lesson(
          "basic-sentence-writing-07",
          "중복 꾸밈 줄이기",
          "같은 의미가 반복되는 꾸밈말을 덜어냅니다."
        ),
        lesson(
          "basic-sentence-writing-08",
          "한 문장 확장 실습",
          "짧은 문장을 목적에 맞게 길게 확장합니다."
        ),
      ]),
      chapter("basic-sentence-writing-chapter-3", "3단원", "문장 다듬기", [
        lesson(
          "basic-sentence-writing-09",
          "어색한 호응 찾기",
          "주어와 서술어, 목적어와 서술어의 호응을 점검합니다."
        ),
        lesson(
          "basic-sentence-writing-10",
          "문장 순서 바꾸기",
          "정보의 우선순위에 따라 문장 성분을 재배치합니다."
        ),
        lesson(
          "basic-sentence-writing-11",
          "간결하게 고치기",
          "불필요한 반복과 군더더기를 삭제합니다."
        ),
        lesson(
          "basic-sentence-writing-12",
          "문장 묶어 문단 만들기",
          "완성한 문장을 연결해 짧은 문단을 씁니다."
        ),
      ]),
    ],
  }),
  createCourseDetail({
    id: courseId("emotion-writing"),
    title: "감정 표현 글쓰기",
    description: "추상적 상태를 정확한 서술어로 기술하는 법",
    thumbnail: "/course-thumbnails/emotion-writing.png",
    chapters: [
      chapter("emotion-writing-chapter-1", "1단원", "감정의 이름", [
        lesson(
          "emotion-writing-01",
          "기본 감정 나누기",
          "기쁨, 분노, 슬픔, 불안을 더 작은 감정으로 분류합니다.",
          true
        ),
        lesson(
          "emotion-writing-02",
          "감정 강도 표현",
          "약한 감정과 강한 감정을 정확한 단어로 구분합니다.",
          true
        ),
        lesson(
          "emotion-writing-03",
          "미묘한 감정 변화",
          "시간이 지나며 달라지는 감정을 문장으로 기록합니다."
        ),
        lesson(
          "emotion-writing-04",
          "몸의 반응 쓰기",
          "감정을 직접 말하지 않고 신체 반응으로 보여줍니다."
        ),
        lesson(
          "emotion-writing-05",
          "감정 어휘 사전",
          "자주 쓰는 감정 단어를 상황별로 정리합니다."
        ),
      ]),
      chapter("emotion-writing-chapter-2", "2단원", "장면으로 표현하기", [
        lesson(
          "emotion-writing-06",
          "대상을 통해 감정 이입하기",
          "사물과 공간을 활용해 감정의 방향을 드러냅니다."
        ),
        lesson(
          "emotion-writing-07",
          "대화 속 감정",
          "말의 내용보다 말투와 간격으로 감정을 표현합니다."
        ),
        lesson(
          "emotion-writing-08",
          "감정 과잉 덜어내기",
          "직접 설명을 줄이고 장면의 증거를 남깁니다."
        ),
        lesson(
          "emotion-writing-09",
          "반대 감정 함께 쓰기",
          "기쁨 속 불안처럼 섞인 감정을 자연스럽게 씁니다."
        ),
        lesson(
          "emotion-writing-10",
          "감정 장면 완성",
          "인물, 행동, 배경을 묶어 짧은 감정 장면을 씁니다."
        ),
      ]),
    ],
  }),
  createCourseDetail({
    id: courseId("business-email"),
    title: "비즈니스 이메일 작성법",
    description: "업무 격식과 명확한 전개로 신뢰감 구축",
    thumbnail: "/course-thumbnails/business-email.png",
    chapters: [
      chapter("business-email-chapter-1", "1단원", "이메일의 첫인상", [
        lesson(
          "business-email-01",
          "제목의 핵심 표현",
          "목적, 요청, 기한이 보이는 이메일 제목을 씁니다."
        ),
        lesson(
          "business-email-02",
          "첫 문장 목적 정리",
          "수신자가 바로 상황을 이해하는 시작 문장을 만듭니다."
        ),
        lesson(
          "business-email-03",
          "수신자에 맞는 호칭",
          "관계와 조직 문화에 맞게 인사와 호칭을 정합니다."
        ),
        lesson(
          "business-email-04",
          "배경 설명의 양",
          "너무 길거나 부족하지 않은 배경 설명을 연습합니다."
        ),
        lesson(
          "business-email-05",
          "핵심 요약 블록",
          "긴 이메일 앞에 핵심 요약을 배치합니다."
        ),
        lesson(
          "business-email-06",
          "읽기 쉬운 단락",
          "한 단락에 하나의 목적만 담도록 정리합니다."
        ),
      ]),
      chapter("business-email-chapter-2", "2단원", "요청과 회신", [
        lesson(
          "business-email-07",
          "명확한 요청 문장",
          "상대가 해야 할 행동을 한 문장으로 씁니다."
        ),
        lesson(
          "business-email-08",
          "기한과 조건 쓰기",
          "언제까지 무엇을 해야 하는지 오해 없이 전달합니다."
        ),
        lesson(
          "business-email-09",
          "자료 첨부 안내",
          "첨부 자료의 목적과 확인 지점을 함께 씁니다."
        ),
        lesson(
          "business-email-10",
          "거절과 조율",
          "단호하지만 관계를 해치지 않는 조율 문장을 연습합니다."
        ),
        lesson(
          "business-email-11",
          "회신 지연 안내",
          "늦어진 상황과 다음 회신 시점을 신뢰 있게 전달합니다."
        ),
        lesson(
          "business-email-12",
          "확인 요청 정리",
          "상대의 확인이 필요한 항목을 빠짐없이 묶습니다."
        ),
      ]),
      chapter("business-email-chapter-3", "3단원", "상황별 이메일", [
        lesson(
          "business-email-13",
          "회의 일정 조율",
          "후보 시간과 목적을 간결하게 제안합니다."
        ),
        lesson(
          "business-email-14",
          "업무 공유 메일",
          "진행 상황, 이슈, 다음 행동을 한눈에 보이게 씁니다."
        ),
        lesson(
          "business-email-15",
          "고객 응대 메일",
          "공감, 설명, 해결안을 균형 있게 담습니다."
        ),
        lesson(
          "business-email-16",
          "상급자 보고 메일",
          "결론과 판단 근거를 먼저 제시합니다."
        ),
        lesson(
          "business-email-17",
          "감사와 후속 안내",
          "협업 이후의 감사와 다음 절차를 자연스럽게 씁니다."
        ),
        lesson(
          "business-email-18",
          "최종 이메일 퇴고",
          "제목, 목적, 요청, 어조를 한 번에 점검합니다."
        ),
      ]),
    ],
  }),
]

const courseDetailMap = new Map(
  courseDetails.map((courseDetail) => [courseDetail.id, courseDetail])
)

export function getCourseDetailById(id: string): CourseDetail | undefined {
  return courseDetailMap.get(courseId(id))
}

export function getCourseDetailStaticParams(): Array<{ id: string }> {
  return courseDetails.map(({ id }) => ({ id }))
}
