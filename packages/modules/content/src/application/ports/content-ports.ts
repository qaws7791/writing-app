import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import type { Result } from "@workspace/kernel/result"
import type {
  AdminId,
  ContentAssetId,
  CourseId,
  CurriculumVersionId,
  LessonId,
} from "@workspace/types/ids"

import type {
  ContentAsset,
  ContentAssetKind,
  ContentAssetMimeType,
  ContentAssetValidationReason,
} from "#content/domain/content-asset"
import type { ContentError } from "#content/domain/content-error"
import type {
  Course,
  CurriculumDraft,
  PublishedCourseSummary,
  PublishedCurriculumRevision,
  PublishedLessonReference,
} from "#content/domain/content-model"

export type ResolvedContentAsset = Readonly<{
  altText: string
  byteSize: number
  contentType: ContentAssetMimeType
  courseId: CourseId
  curriculumVersionId: CurriculumVersionId
  id: ContentAssetId
  kind: ContentAssetKind
  url: string
}>

export type ContentAssetReference = Pick<
  ResolvedContentAsset,
  "altText" | "id" | "kind" | "url"
>

export type CourseEditorDocument = Omit<CurriculumDraft, "visualKey"> &
  Readonly<{ assets: readonly ResolvedContentAsset[] }>

type ContentCourseListItem = Readonly<{
  category: string
  id: CourseId
  lessonCount: number
  revision: number
  status: Course["status"]
  title: string
  unitCount: number
  visualKey: CurriculumDraft["visualKey"]
}>

export type ContentCoursePage = Readonly<{
  items: readonly ContentCourseListItem[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}>

export type ReadContentCoursesInput = Readonly<{
  category: string
  page: number
  pageSize: number
  status: "active" | "all" | "archived"
}>

export type ContentAssetImageProcessorPort = Readonly<{
  process: (input: {
    readonly bytes: Uint8Array
    readonly contentType: ContentAssetMimeType
    readonly kind: ContentAssetKind
  }) => Promise<
    Result<
      Readonly<{
        bytes: Uint8Array
        contentType: ContentAssetMimeType
      }>,
      Readonly<{ reason: ContentAssetValidationReason }>
    >
  >
}>

export type ContentAssetStoragePort = Readonly<{
  deleteObjects: (
    objectKeys: readonly string[]
  ) => Promise<Result<void, Readonly<{ retryable: boolean }>>>
  putObject: (input: {
    readonly body: Uint8Array
    readonly contentType: ContentAssetMimeType
    readonly objectKey: string
  }) => Promise<
    Result<Readonly<{ url: string }>, Readonly<{ retryable: boolean }>>
  >
  resolveUrl: (objectKey: string) => string
}>

export type ContentAssetOwner = Readonly<{
  courseId: CourseId
  curriculumVersionId: CurriculumVersionId
  versionStatus: "draft" | "published"
}>

export type OrphanedContentAssetCandidate = Readonly<{
  id: ContentAssetId
  objectKey: string
}>

export type ContentRepository = Readonly<{
  createAsset: (
    asset: ContentAsset
  ) => Promise<Result<ContentAsset, ContentError>>
  createCourse: (input: {
    readonly courseId: CourseId
    readonly now: Date
  }) => Promise<Result<CourseEditorDocument, ContentError>>
  findCourse: (courseId: CourseId) => Promise<Course | null>
  findDraft: (
    courseId: CourseId
  ) => Promise<Result<CurriculumDraft | null, ContentError>>
  listPublishedCourseSummaries: () => Promise<readonly PublishedCourseSummary[]>
  listActiveAssetsForCourse: (
    courseId: CourseId
  ) => Promise<readonly ContentAsset[]>
  listOrphanedAssetCandidates: (input: {
    readonly batchSize: number
    readonly cutoff: Date
  }) => Promise<Result<readonly OrphanedContentAssetCandidate[], ContentError>>
  deleteOrphanedAssetCandidates: (input: {
    readonly assetIds: readonly ContentAssetId[]
    readonly cutoff: Date
  }) => Promise<Result<number, ContentError>>
  readAssetOwner: (input: {
    readonly courseId: CourseId
    readonly curriculumVersionId: CurriculumVersionId
  }) => Promise<ContentAssetOwner | null>
  readActiveAssetsByIds: (
    assetIds: readonly ContentAssetId[]
  ) => Promise<readonly ContentAsset[]>
  publishDraft: (input: {
    readonly expectedEditVersion: number
    readonly nextDraftId: CurriculumVersionId
    readonly publishedRevision: PublishedCurriculumRevision
  }) => Promise<Result<PublishedCurriculumRevision, ContentError>>
  readCourseEditor: (courseId: CourseId) => Promise<CourseEditorDocument | null>
  readCourses: (input: ReadContentCoursesInput) => Promise<ContentCoursePage>
  readCurriculum: (input: {
    readonly courseId: CourseId
    readonly curriculumVersionId?: CurriculumVersionId
  }) => Promise<PublishedCurriculumRevision | null>
  findCurriculumByLesson: (input: {
    readonly curriculumVersionId?: CurriculumVersionId
    readonly lessonId: LessonId
  }) => Promise<PublishedLessonReference | null>
  saveCourse: (input: {
    readonly course: Course
    readonly expectedStatus: Course["status"]
  }) => Promise<Result<Course, ContentError>>
  saveDraft: (input: {
    readonly draft: CurriculumDraft
    readonly expectedEditVersion: number
    readonly now: Date
  }) => Promise<Result<CurriculumDraft, ContentError>>
}>

export type ContentAdminSessionPort = Readonly<{
  resolveAdminId: (headers: Headers) => Promise<AdminId | null>
}>

export type ContentApplicationDependencies = Readonly<{
  assetIdGenerator: IdGenerator<ContentAssetId>
  assetImageProcessor: ContentAssetImageProcessorPort
  assetStorage: ContentAssetStoragePort | null
  clock: Clock
  courseIdGenerator: IdGenerator<CourseId>
  repository: ContentRepository
}>
