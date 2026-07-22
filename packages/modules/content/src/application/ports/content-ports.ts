import type { Clock, IdGenerator } from "@workspace/kernel/clock"
import type { Result } from "@workspace/kernel/result"
import type { WorkspaceEventMap } from "@workspace/event-contracts/workspace-event"
import type {
  CourseId,
  CurriculumVersionId,
  LessonId,
} from "@workspace/types/ids"

import type { ContentActor } from "#content/domain/content-admin-policy"
import type { ContentError } from "#content/domain/content-error"
import type {
  Course,
  CurriculumDraft,
  PublishedCourseSummary,
  PublishedCurriculumRevision,
  PublishedLessonReference,
} from "#content/domain/content-model"
import type { ContentCurriculumPublishedEvent } from "#content/domain/curriculum"

export type CourseEditorDocument = Omit<CurriculumDraft, "visualKey">

export type ContentCourseListItem = Readonly<{
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

export type ContentResetResult = Readonly<{
  changed: Readonly<{
    archived: number
    courses: number
    lessons: number
    steps: number
    units: number
  }>
  revision: number
}>

export type ReadContentCoursesInput = Readonly<{
  category: string
  page: number
  pageSize: number
  query: string
  status: "active" | "all" | "archived"
}>

export type ContentRepository = Readonly<{
  createCourse: (input: {
    readonly courseId: CourseId
    readonly now: Date
  }) => Promise<Result<CourseEditorDocument, ContentError>>
  findCourse: (courseId: CourseId) => Promise<Course | null>
  findDraft: (
    courseId: CourseId
  ) => Promise<Result<CurriculumDraft | null, ContentError>>
  listPublishedCourseSummaries: () => Promise<readonly PublishedCourseSummary[]>
  publishDraft: (input: {
    readonly decision: Readonly<{
      aggregate: PublishedCurriculumRevision
      events: readonly ContentCurriculumPublishedEvent[]
    }>
    readonly expectedEditVersion: number
    readonly nextDraftId: CurriculumVersionId
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
  resetContent: (input: {
    readonly now: Date
  }) => Promise<Result<ContentResetResult, ContentError>>
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

export type ContentEventPublishError = Readonly<{
  kind: "content-event-publish-failed"
}>

export type ContentEventPublisher = Readonly<{
  publishCurriculumPublished: (
    event: WorkspaceEventMap["content.curriculum-published"]
  ) => Promise<Result<void, ContentEventPublishError>>
}>

export type ContentEventFailureObserver = (
  event: Readonly<{
    eventId: string
    eventName: "content.curriculum-published"
    kind: "content-event-publish-failed"
  }>
) => void

export type ContentResetGuardPort = Readonly<{
  authorize: () => Result<void, ContentError>
}>

export type ContentAdminSessionPort = Readonly<{
  resolveActor: (headers: Headers) => Promise<ContentActor | null>
}>

export type ContentApplicationDependencies = Readonly<{
  clock: Clock
  courseIdGenerator: IdGenerator<CourseId>
  eventFailureObserver: ContentEventFailureObserver
  eventIdGenerator: IdGenerator<string>
  eventPublisher: ContentEventPublisher
  repository: ContentRepository
  resetGuard: ContentResetGuardPort
}>
