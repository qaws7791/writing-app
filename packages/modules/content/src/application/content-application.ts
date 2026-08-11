import type {
  AdminMcpAutomaticContentChangeBinding,
  AdminMcpAutomaticContentChangeExecution,
  AdminMcpAutomaticContentChangeReceipt,
  AdminMcpContentChangeBinding,
  AdminMcpContentChangeExecution,
  AdminMcpContentChangeReceipt,
} from "#content/domain/admin-mcp-content-change"
import type {
  ContentAssetId,
  CourseId,
  CurriculumVersionId,
  LessonId,
} from "@workspace/types/ids"
import { err, ok, type Result } from "@workspace/kernel/result"

import type {
  ContentApplicationDependencies,
  ContentAssetReference,
  ContentCoursePage,
  CourseChangeTarget,
  CourseContentAsset,
  CourseEditorDocument,
  ReadContentCoursesInput,
  ResolvedContentAsset,
} from "#content/application/ports/content-ports"
import {
  createCleanupOrphanedAssets,
  type CleanupOrphanedAssets,
} from "#content/application/cleanup-orphaned-content-assets"
import {
  createUploadContentAsset,
  type UploadContentAsset,
} from "#content/application/upload-content-asset"
import {
  createArchiveCourseUseCase,
  type ArchiveCourseUseCase,
} from "#content/application/use-cases/archive-course"
import {
  createRestoreCourseUseCase,
  type RestoreCourseUseCase,
} from "#content/application/use-cases/restore-course"
import {
  createCreateCourseUseCase,
  type CreateCourseUseCase,
} from "#content/application/use-cases/create-course"
import {
  createPublishCourseUseCase,
  type PublishCourseUseCase,
} from "#content/application/use-cases/publish-course"
import {
  createSaveCourseEditorUseCase,
  type SaveCourseEditorUseCase,
} from "#content/application/use-cases/save-course-editor"
import type {
  PublishedCourseSummary,
  PublishedCurriculumRevision,
  PublishedLessonReference,
} from "#content/domain/content-model"
import type { ContentError } from "#content/domain/content-error"
import { createCurriculumVersionId } from "#content/domain/content-model"
import {
  createCurriculumDraft,
  decidePublishCurriculum,
} from "#content/domain/curriculum"

type AdminMcpApprovedContentApplicationCommand = AdminMcpContentChangeBinding &
  (
    | Readonly<{ courseId: CourseId; kind: "create-course" }>
    | Readonly<{
        courseId: CourseId
        expectedEditVersion: number
        expectedStatus: "active"
        kind: "archive-course"
      }>
    | Readonly<{
        courseId: CourseId
        expectedEditVersion: number
        kind: "publish-course"
      }>
    | Readonly<{
        courseId: CourseId
        expectedEditVersion: number
        expectedStatus: "archived"
        kind: "restore-course"
      }>
  )

type AdminMcpAutomaticContentApplicationCommand =
  AdminMcpAutomaticContentChangeBinding &
    (
      | Readonly<{ courseId: CourseId; kind: "create-course" }>
      | Readonly<{
          document: CourseEditorDocument
          expectedEditVersion: number
          kind: "save-course-draft"
        }>
      | Readonly<{
          courseId: CourseId
          expectedEditVersion: number
          expectedStatus: "archived"
          kind: "restore-course"
        }>
    )

export type ContentApplication = Readonly<{
  archiveCourse: ArchiveCourseUseCase
  cleanupOrphanedAssets: CleanupOrphanedAssets
  createCourse: CreateCourseUseCase
  executeApprovedMcpChange: (
    command: AdminMcpApprovedContentApplicationCommand
  ) => Promise<Result<AdminMcpContentChangeExecution, ContentError>>
  executeAutomaticMcpChange: (
    command: AdminMcpAutomaticContentApplicationCommand
  ) => Promise<Result<AdminMcpAutomaticContentChangeExecution, ContentError>>
  findCurriculumByLesson: (input: {
    readonly curriculumVersionId?: CurriculumVersionId
    readonly lessonId: LessonId
  }) => Promise<PublishedLessonReference | null>
  getCourseAssets: (
    courseId: CourseId
  ) => Promise<readonly CourseContentAsset[] | null>
  getCourseEditor: (courseId: CourseId) => Promise<CourseEditorDocument | null>
  getCourseChangeTarget: (
    courseId: CourseId
  ) => Promise<CourseChangeTarget | null>
  getCourses: (query: ReadContentCoursesInput) => Promise<ContentCoursePage>
  listPublishedCourses: () => Promise<readonly PublishedCourseSummary[]>
  publishCourse: PublishCourseUseCase
  readCurriculum: (input: {
    readonly courseId: CourseId
    readonly curriculumVersionId?: CurriculumVersionId
  }) => Promise<PublishedCurriculumRevision | null>
  readApprovedMcpChangeReceipt: (
    binding: AdminMcpContentChangeBinding
  ) => Promise<Result<AdminMcpContentChangeReceipt | null, ContentError>>
  readAutomaticMcpChangeReceipt: (
    binding: AdminMcpAutomaticContentChangeBinding
  ) => Promise<
    Result<AdminMcpAutomaticContentChangeReceipt | null, ContentError>
  >
  resolveAssetReferences: (
    assetIds: readonly ContentAssetId[]
  ) => Promise<readonly ContentAssetReference[]>
  restoreCourse: RestoreCourseUseCase
  saveCourseEditor: SaveCourseEditorUseCase
  uploadAsset: UploadContentAsset
}>

export function createContentApplication(
  dependencies: ContentApplicationDependencies
): ContentApplication {
  const createCourse = createCreateCourseUseCase(dependencies)
  const saveCourseEditor = createSaveCourseEditorUseCase(dependencies)

  const application: ContentApplication = {
    archiveCourse: createArchiveCourseUseCase(dependencies),
    cleanupOrphanedAssets: createCleanupOrphanedAssets(dependencies),
    createCourse: async (adminId, input) => {
      const result = await createCourse(adminId, input)
      return result.isErr()
        ? result
        : ok(await attachResolvedEditorAssets(dependencies, result.value))
    },
    async executeApprovedMcpChange(command) {
      const now = dependencies.clock.now()
      if (command.kind !== "publish-course") {
        return dependencies.repository.executeApprovedMcpChange({
          ...command,
          now,
        })
      }

      const draftResult = await dependencies.repository.findDraft(
        command.courseId
      )
      if (draftResult.isErr()) return err(draftResult.error)
      const draft = draftResult.value
      if (draft === null) return err({ kind: "content-not-found" })
      if (draft.editVersion !== command.expectedEditVersion) {
        return err({ kind: "content-conflict" })
      }
      const decision = decidePublishCurriculum({ draft, now })
      if (decision.isErr()) return err(decision.error)

      return dependencies.repository.executeApprovedMcpChange({
        ...command,
        nextDraftId: createCurriculumVersionId(
          command.courseId,
          draft.revision + 1
        ),
        now,
        publishedRevision: decision.value,
      })
    },
    async executeAutomaticMcpChange(command) {
      const now = dependencies.clock.now()
      if (command.kind !== "save-course-draft") {
        return dependencies.repository.executeAutomaticMcpChange({
          ...command,
          now,
        })
      }

      const currentResult = await dependencies.repository.findDraft(
        command.document.courseId
      )
      if (currentResult.isErr()) return err(currentResult.error)
      const current = currentResult.value
      if (current === null) return err({ kind: "content-not-found" })
      if (
        current.curriculumVersionId !== command.document.curriculumVersionId ||
        current.revision !== command.document.revision
      ) {
        return err({
          kind: "content-validation-failed",
          reason: "invalid-course-reference",
        })
      }
      if (
        current.editVersion !== command.expectedEditVersion ||
        command.document.editVersion !== command.expectedEditVersion
      ) {
        return err({ kind: "content-conflict" })
      }
      const draft = createCurriculumDraft({
        ...command.document,
        visualKey: current.visualKey,
      })
      if (draft.isErr()) return err(draft.error)

      const { document: _document, ...binding } = command
      return dependencies.repository.executeAutomaticMcpChange({
        ...binding,
        draft: draft.value,
        now,
      })
    },
    findCurriculumByLesson: (input) =>
      dependencies.repository.findCurriculumByLesson(input),
    async getCourseAssets(courseId) {
      const course = await dependencies.repository.findCourse(courseId)
      if (course === null) return null

      const storage = dependencies.assetStorage
      if (storage === null) return []

      const assets = await dependencies.repository.listAssetsForCourse(courseId)
      return assets.map(
        (asset): CourseContentAsset => ({
          altText: asset.altText,
          byteSize: asset.byteSize,
          contentType: asset.contentType,
          courseId: asset.courseId,
          curriculumVersionId: asset.curriculumVersionId,
          id: asset.id,
          kind: asset.kind,
          status: asset.status,
          url: storage.resolveUrl(asset.objectKey),
        })
      )
    },
    async getCourseEditor(courseId) {
      const document = await dependencies.repository.readCourseEditor(courseId)
      return document === null
        ? null
        : attachResolvedEditorAssets(dependencies, document)
    },
    getCourseChangeTarget: (courseId) =>
      dependencies.repository.readCourseChangeTarget(courseId),
    async getCourses(query) {
      const page = await dependencies.repository.readCourses(query)
      const covers = await application.resolveAssetReferences(
        page.items.flatMap((item) =>
          item.coverAssetId === null ? [] : [item.coverAssetId]
        )
      )
      const coverById = new Map(covers.map((cover) => [cover.id, cover]))

      return {
        ...page,
        items: page.items.map(({ coverAssetId, ...item }) => ({
          ...item,
          cover:
            coverAssetId === null
              ? null
              : (coverById.get(coverAssetId) ?? null),
        })),
      }
    },
    listPublishedCourses: () =>
      dependencies.repository.listPublishedCourseSummaries(),
    publishCourse: createPublishCourseUseCase(dependencies),
    readCurriculum: (input) => dependencies.repository.readCurriculum(input),
    readApprovedMcpChangeReceipt: (binding) =>
      dependencies.repository.readApprovedMcpChangeReceipt(binding),
    readAutomaticMcpChangeReceipt: (binding) =>
      dependencies.repository.readAutomaticMcpChangeReceipt(binding),
    async resolveAssetReferences(assetIds) {
      if (dependencies.assetStorage === null || assetIds.length === 0) {
        return []
      }
      const storage = dependencies.assetStorage
      const assets =
        await dependencies.repository.readActiveAssetsByIds(assetIds)
      const assetsById = new Map(assets.map((asset) => [asset.id, asset]))
      return [...new Set(assetIds)].flatMap((assetId) => {
        const asset = assetsById.get(assetId)
        return asset === undefined
          ? []
          : [
              {
                altText: asset.altText,
                id: asset.id,
                kind: asset.kind,
                url: storage.resolveUrl(asset.objectKey),
              },
            ]
      })
    },
    restoreCourse: createRestoreCourseUseCase(dependencies),
    saveCourseEditor: async (command) => {
      const result = await saveCourseEditor(command)
      return result.isErr()
        ? result
        : ok(await attachResolvedEditorAssets(dependencies, result.value))
    },
    uploadAsset: createUploadContentAsset(dependencies),
  }

  return application
}

async function attachResolvedEditorAssets(
  dependencies: ContentApplicationDependencies,
  document: CourseEditorDocument
): Promise<CourseEditorDocument> {
  if (dependencies.assetStorage === null) {
    return { ...document, assets: [] }
  }
  const storage = dependencies.assetStorage
  const assets = await dependencies.repository.listActiveAssetsForCourse(
    document.courseId
  )
  return {
    ...document,
    assets: assets.map(
      (asset): ResolvedContentAsset => ({
        altText: asset.altText,
        byteSize: asset.byteSize,
        contentType: asset.contentType,
        courseId: asset.courseId,
        curriculumVersionId: asset.curriculumVersionId,
        id: asset.id,
        kind: asset.kind,
        url: storage.resolveUrl(asset.objectKey),
      })
    ),
  }
}
