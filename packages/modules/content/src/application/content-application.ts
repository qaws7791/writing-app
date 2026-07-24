import type {
  ContentAssetId,
  CourseId,
  CurriculumVersionId,
  LessonId,
} from "@workspace/types/ids"
import { ok } from "@workspace/kernel/result"

import type {
  ContentApplicationDependencies,
  ContentAssetReference,
  ContentCoursePage,
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

export type ContentApplication = Readonly<{
  archiveCourse: ArchiveCourseUseCase
  cleanupOrphanedAssets: CleanupOrphanedAssets
  createCourse: CreateCourseUseCase
  findCurriculumByLesson: (input: {
    readonly curriculumVersionId?: CurriculumVersionId
    readonly lessonId: LessonId
  }) => Promise<PublishedLessonReference | null>
  getCourseEditor: (courseId: CourseId) => Promise<CourseEditorDocument | null>
  getCourses: (query: ReadContentCoursesInput) => Promise<ContentCoursePage>
  listPublishedCourses: () => Promise<readonly PublishedCourseSummary[]>
  publishCourse: PublishCourseUseCase
  readCurriculum: (input: {
    readonly courseId: CourseId
    readonly curriculumVersionId?: CurriculumVersionId
  }) => Promise<PublishedCurriculumRevision | null>
  resolveAssetReferences: (
    assetIds: readonly ContentAssetId[]
  ) => Promise<readonly ContentAssetReference[]>
  saveCourseEditor: SaveCourseEditorUseCase
  uploadAsset: UploadContentAsset
}>

export function createContentApplication(
  dependencies: ContentApplicationDependencies
): ContentApplication {
  const createCourse = createCreateCourseUseCase(dependencies)
  const saveCourseEditor = createSaveCourseEditorUseCase(dependencies)

  return {
    archiveCourse: createArchiveCourseUseCase(dependencies),
    cleanupOrphanedAssets: createCleanupOrphanedAssets(dependencies),
    createCourse: async (adminId) => {
      const result = await createCourse(adminId)
      return result.isErr()
        ? result
        : ok(await attachResolvedEditorAssets(dependencies, result.value))
    },
    findCurriculumByLesson: (input) =>
      dependencies.repository.findCurriculumByLesson(input),
    async getCourseEditor(courseId) {
      const document = await dependencies.repository.readCourseEditor(courseId)
      return document === null
        ? null
        : attachResolvedEditorAssets(dependencies, document)
    },
    getCourses: (query) => dependencies.repository.readCourses(query),
    listPublishedCourses: () =>
      dependencies.repository.listPublishedCourseSummaries(),
    publishCourse: createPublishCourseUseCase(dependencies),
    readCurriculum: (input) => dependencies.repository.readCurriculum(input),
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
    saveCourseEditor: async (command) => {
      const result = await saveCourseEditor(command)
      return result.isErr()
        ? result
        : ok(await attachResolvedEditorAssets(dependencies, result.value))
    },
    uploadAsset: createUploadContentAsset(dependencies),
  }
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

export type { ContentError } from "#content/domain/content-error"
