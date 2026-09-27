import {
  adminCourseEditorWriteDocumentSchema,
  type AdminCourseEditorDocument,
  type AdminCourseEditorWriteDocument,
} from "@workspace/contracts/content/admin-courses"

export const e2eAdminContentCourseTitle = "E2E 발행 코스"
export const e2eAdminContentReadingTitle = "발행 결과 읽기"

export function createE2eAdminContentFixture(
  editor: AdminCourseEditorDocument,
  idNamespace = ""
): AdminCourseEditorWriteDocument {
  const { assets: _assets, ...writeDocument } = editor
  const id = (value: string) =>
    idNamespace === "" ? value : `${idNamespace}-${value}`

  return adminCourseEditorWriteDocumentSchema.parse({
    ...writeDocument,
    category: "문장·교정",
    coverAssetId: null,
    description: "관리자 발행 결과를 학습자 화면에서 검증합니다.",
    title: e2eAdminContentCourseTitle,
    units: [
      {
        id: id("e2e-publish-unit"),
        lessons: [
          {
            category: "문장·교정",
            description: "발행된 revision이 학습자에게 노출되는지 검증합니다.",
            estimatedMinutes: 2,
            id: id("e2e-publish-lesson"),
            sortOrder: 1,
            status: "active",
            summary: ["관리자 발행 결과를 확인했다"],
            title: "발행 결과 확인하기",
            steps: [
              {
                body: "관리자가 발행한 본문입니다. 학습자 화면에서 확인합니다.",
                id: id("e2e-publish-reading"),
                sortOrder: 1,
                status: "active",
                title: e2eAdminContentReadingTitle,
                type: "READING",
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
