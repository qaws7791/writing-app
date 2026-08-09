import {
  adminCourseEditorWriteDocumentSchema,
  type AdminCourseEditorDocument,
  type AdminCourseEditorWriteDocument,
} from "@workspace/contracts/content/admin-courses"

const e2eAdminContentCourseTitle = "E2E 이미지 발행 코스"
export const e2eAdminContentReadingTitle = "리비전 1 이미지 읽기"
export const e2eAdminContentActivityTypes = [
  "READING",
  "COMPARE",
  "MULTIPLE_CHOICE",
  "SELECT",
  "FILL_BLANK",
  "ORDER",
  "WRITE",
  "AI_FEEDBACK",
  "MATCH",
  "CATEGORIZE",
] as const
const e2eAdminContentOrderItems = [
  { id: "e2e-order-1", text: "주장을 쓴다" },
  { id: "e2e-order-2", text: "근거를 덧붙인다" },
] as const

export function createE2eAdminContentFixture(
  editor: AdminCourseEditorDocument,
  idNamespace = ""
): AdminCourseEditorWriteDocument {
  const { assets: _assets, ...writeDocument } = editor
  const id = (value: string) =>
    idNamespace === "" ? value : `${idNamespace}-${value}`

  return adminCourseEditorWriteDocumentSchema.parse({
    ...writeDocument,
    category: "구성과 표현",
    coverAssetId: null,
    description: "실제 콘텐츠 이미지 작성과 revision 고정을 검증합니다.",
    title: e2eAdminContentCourseTitle,
    units: [
      {
        id: id("e2e-image-unit"),
        lessons: [
          {
            category: "구성과 표현",
            description: "10개 활동 유형을 실제 계약으로 검증합니다.",
            estimatedMinutes: 10,
            id: id("e2e-image-lesson"),
            sortOrder: 1,
            status: "active",
            summary: ["콘텐츠 이미지와 revision 고정을 확인했다"],
            title: "이미지와 활동 유형 확인하기",
            steps: [
              {
                body: "발행된 읽기 본문은 기존 학습자에게 고정됩니다.",
                guide: "삽화와 대체 텍스트를 함께 확인하세요.",
                id: id("e2e-image-reading"),
                sortOrder: 1,
                status: "active",
                title: e2eAdminContentReadingTitle,
                type: "READING",
              },
              {
                analysis: "두 문장의 차이를 비교합니다.",
                id: id("e2e-image-compare"),
                sortOrder: 2,
                status: "active",
                title: "문장 비교",
                type: "COMPARE",
                versions: [
                  { label: "초안", text: "모호한 문장입니다." },
                  { label: "수정본", text: "명확한 문장입니다." },
                ],
              },
              {
                correct: id("e2e-choice-correct"),
                explanation: "서버 계약이 정답을 보존합니다.",
                id: id("e2e-image-multiple-choice"),
                options: [
                  { id: id("e2e-choice-correct"), text: "명확한 문장" },
                  { id: id("e2e-choice-wrong"), text: "모호한 문장" },
                ],
                question: "더 명확한 문장을 고르세요.",
                sortOrder: 3,
                status: "active",
                type: "MULTIPLE_CHOICE",
              },
              {
                correct: [id("e2e-segment-2")],
                explanation: "핵심 표현을 선택합니다.",
                id: id("e2e-image-select"),
                layout: "inline",
                question: "핵심 표현을 선택하세요.",
                segmentIds: [id("e2e-segment-1"), id("e2e-segment-2")],
                segments: ["문장은", "명확해야 합니다"],
                sortOrder: 4,
                status: "active",
                type: "SELECT",
              },
              {
                answer: [id("e2e-word-clear")],
                explanation: "명확한 표현이 정답입니다.",
                id: id("e2e-image-fill-blank"),
                sortOrder: 5,
                status: "active",
                template: "문장은 ___ 해야 합니다.",
                type: "FILL_BLANK",
                wordIds: [id("e2e-word-clear"), id("e2e-word-vague")],
                words: ["명확", "모호"],
              },
              {
                correct: e2eAdminContentOrderItems.map((item) => id(item.id)),
                explanation: "주장 뒤에 근거를 둡니다.",
                id: id("e2e-image-order"),
                itemIds: e2eAdminContentOrderItems.map((item) => id(item.id)),
                items: e2eAdminContentOrderItems.map((item) => item.text),
                showNumbers: true,
                sortOrder: 6,
                status: "active",
                title: "문장 순서",
                type: "ORDER",
              },
              {
                goal: 80,
                id: id("e2e-image-write"),
                min: 5,
                prompt: "명확한 문장을 한 줄 작성하세요.",
                sortOrder: 7,
                status: "active",
                title: "문장 쓰기",
                type: "WRITE",
              },
              {
                allowRetry: true,
                feedback: "명확성을 기준으로 살펴봅니다.",
                focus: "명확성",
                id: id("e2e-image-ai-feedback"),
                sortOrder: 8,
                status: "active",
                target: id("e2e-image-write"),
                type: "AI_FEEDBACK",
              },
              {
                explanation: "접속사와 역할을 연결합니다.",
                guide: "서로 맞는 항목을 연결하세요.",
                id: id("e2e-image-match"),
                pairs: [
                  {
                    left: "따라서",
                    leftId: id("e2e-match-left"),
                    right: "인과",
                    rightId: id("e2e-match-right"),
                  },
                ],
                sortOrder: 9,
                status: "active",
                title: "표현 연결",
                type: "MATCH",
              },
              {
                categories: [
                  { id: id("e2e-category-claim"), label: "주장" },
                  { id: id("e2e-category-evidence"), label: "근거" },
                ],
                explanation: "문장의 역할을 분류합니다.",
                guide: "각 문장을 알맞은 역할로 옮기세요.",
                id: id("e2e-image-categorize"),
                items: [
                  {
                    categoryId: id("e2e-category-claim"),
                    id: id("e2e-category-item-1"),
                    text: "명확한 문장이 좋다.",
                  },
                  {
                    categoryId: id("e2e-category-evidence"),
                    id: id("e2e-category-item-2"),
                    text: "독자가 한 번에 이해한다.",
                  },
                ],
                sortOrder: 10,
                status: "active",
                title: "문장 역할 분류",
                type: "CATEGORIZE",
              },
            ],
          },
        ],
        sortOrder: 1,
        status: "active",
        title: "콘텐츠 이미지",
      },
    ],
  })
}
