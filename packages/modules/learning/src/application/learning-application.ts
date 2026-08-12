import { err, ok, type Result } from "@workspace/kernel/result"
import type {
  CourseId,
  CurriculumVersionId,
  LearnerId,
  LessonId,
  LessonStepId,
} from "@workspace/types/ids"

import type {
  LearnerCourseDetail,
  LearnerCourseSummary,
  LearnerLesson,
  LearnerProgressCourse,
} from "#learning/application/learning-read-model"
import type {
  LearnerCourseReadQuery,
  LearnerProgressReadQuery,
  LearnerReadModelPage,
} from "#learning/application/ports/learner-read-model-repository"
import type {
  CompleteLearnerStepTransitionResult,
  LearnerTransitionError,
  SaveLearnerStepDraftResult,
  StartLearnerLessonResult,
} from "#learning/domain/learner-transition"
import type {
  LearnerStepDraftAnswer,
  LearnerStepSubmission,
} from "#learning/domain/learning-types"
import type { LearningApplicationDependencies } from "#learning/application/ports/learning-ports"

type StartLearningLessonCommand = Readonly<{
  expectedCurriculumVersionId: CurriculumVersionId
  learnerId: LearnerId
  lessonId: LessonId
}>

type SubmitLearningStepCommand = Readonly<{
  learnerId: LearnerId
  lessonId: LessonId
  stepId: LessonStepId
}> &
  (
    | Readonly<{
        completion: Readonly<{
          kind: "answer"
          submission: LearnerStepSubmission
        }>
      }>
    | Readonly<{
        completion: Readonly<{ kind: "acknowledge" }>
      }>
  )

type SaveLearningStepDraftCommand = Readonly<{
  answer: LearnerStepDraftAnswer
  expectedCurriculumVersionId: CurriculumVersionId
  expectedVersion: number | null
  learnerId: LearnerId
  lessonId: LessonId
  stepId: LessonStepId
}>

type LearningCollaboratorError =
  | Readonly<{ kind: "learner-inactive" }>
  | Readonly<{ kind: "learner-not-found" }>
  | Readonly<{ kind: "identity-query-failed" }>

export type LearningCommandError =
  | LearnerTransitionError
  | LearningCollaboratorError

export type LearningReadError =
  | Readonly<{ kind: "course-not-found" }>
  | Readonly<{ kind: "lesson-locked" }>
  | Readonly<{ kind: "lesson-not-found" }>

export type LearningApplication = Readonly<{
  readCourseCatalog: (
    query: LearnerCourseReadQuery
  ) => Promise<LearnerReadModelPage<LearnerCourseSummary>>
  readCourseCategories: () => Promise<readonly string[]>
  readCourseDetail: (input: {
    readonly courseId: CourseId
    readonly learnerId: LearnerId
  }) => Promise<Result<LearnerCourseDetail, LearningReadError>>
  readLearnerHome: (
    query: LearnerProgressReadQuery
  ) => Promise<LearnerReadModelPage<LearnerProgressCourse>>
  readLesson: (input: {
    readonly learnerId: LearnerId
    readonly lessonId: LessonId
  }) => Promise<Result<LearnerLesson, LearningReadError>>
  submitStep: (
    command: SubmitLearningStepCommand
  ) => Promise<
    Result<CompleteLearnerStepTransitionResult, LearningCommandError>
  >
  saveStepDraft: (
    command: SaveLearningStepDraftCommand
  ) => Promise<Result<SaveLearnerStepDraftResult, LearningCommandError>>
  startLesson: (
    command: StartLearningLessonCommand
  ) => Promise<Result<StartLearnerLessonResult, LearningCommandError>>
}>

export function createLearningApplication(
  dependencies: LearningApplicationDependencies
): LearningApplication {
  return {
    async readCourseCatalog(query) {
      const page = await dependencies.readRepository.listCourses(query)
      return {
        items: page.items.map(presentCourseSummary),
        nextPosition: page.nextPosition,
      }
    },
    readCourseCategories() {
      return dependencies.readRepository.listCourseCategories()
    },
    async readCourseDetail(input) {
      const course = await dependencies.readRepository.findCourseDetail({
        courseId: input.courseId,
        userId: input.learnerId,
      })
      return course === null ? err({ kind: "course-not-found" }) : ok(course)
    },
    readLearnerHome(query) {
      return dependencies.readRepository.listProgress(query)
    },
    async readLesson(input) {
      const lesson = await dependencies.readRepository.findLesson({
        lessonId: input.lessonId,
        userId: input.learnerId,
      })
      switch (lesson.kind) {
        case "found":
          return ok(lesson.value)
        case "locked":
          return err({ kind: "lesson-locked" })
        case "not-found":
          return err({ kind: "lesson-not-found" })
      }
    },
    async saveStepDraft(command) {
      const authorization = await authorizeLearner(
        dependencies,
        command.learnerId
      )
      if (authorization.isErr()) return err(authorization.error)
      const curriculum = await readLessonCurriculum(dependencies, command)
      if (curriculum === null) {
        return err({ kind: "lesson-not-found", lessonId: command.lessonId })
      }
      const saved = await dependencies.transitionRepository.saveStepDraft(
        {
          answer: command.answer,
          expectedCurriculumVersionId: command.expectedCurriculumVersionId,
          expectedVersion: command.expectedVersion,
          lessonId: command.lessonId,
          occurredAt: dependencies.clock.now(),
          stepId: command.stepId,
          userId: command.learnerId,
        },
        curriculum
      )
      return saved.isErr() ? err(saved.error) : ok(saved.value)
    },
    async startLesson(command) {
      const authorization = await authorizeLearner(
        dependencies,
        command.learnerId
      )
      if (authorization.isErr()) return err(authorization.error)
      const curriculum = await readLessonCurriculum(dependencies, command)
      if (curriculum === null) {
        return err({ kind: "lesson-not-found", lessonId: command.lessonId })
      }
      const committed = await dependencies.transitionRepository.startLesson(
        {
          expectedCurriculumVersionId: command.expectedCurriculumVersionId,
          lessonId: command.lessonId,
          occurredAt: dependencies.clock.now(),
          userId: command.learnerId,
        },
        curriculum
      )
      if (committed.isErr()) return err(committed.error)
      return ok(committed.value)
    },
    async submitStep(command) {
      const authorization = await authorizeLearner(
        dependencies,
        command.learnerId
      )
      if (authorization.isErr()) return err(authorization.error)
      const curriculum = await readLessonCurriculum(dependencies, command)
      if (curriculum === null) {
        return err({ kind: "lesson-not-found", lessonId: command.lessonId })
      }
      const committed = await dependencies.transitionRepository.completeStep(
        {
          completion: command.completion,
          lessonId: command.lessonId,
          occurredAt: dependencies.clock.now(),
          stepId: command.stepId,
          userId: command.learnerId,
        },
        curriculum
      )
      return committed.isErr() ? err(committed.error) : ok(committed.value)
    },
  }
}

function presentCourseSummary(
  course: LearnerCourseSummary
): LearnerCourseSummary {
  return {
    category: course.category,
    contentStatus: course.contentStatus,
    cover: course.cover,
    description: course.description,
    id: course.id,
    lessonCount: course.lessonCount,
    title: course.title,
    version: {
      curriculumVersionId: course.version.curriculumVersionId,
      revision: course.version.revision,
    },
    visualKey: course.visualKey,
  }
}

async function authorizeLearner(
  dependencies: LearningApplicationDependencies,
  learnerId: LearnerId
): Promise<Result<void, LearningCollaboratorError>> {
  const status = await dependencies.identity.readLearnerStatus(learnerId)
  if (status.isErr()) {
    return err(
      status.error.kind === "identity-not-found"
        ? { kind: "learner-not-found" }
        : { kind: "identity-query-failed" }
    )
  }
  return status.value === "active"
    ? ok(undefined)
    : err({ kind: "learner-inactive" })
}

async function readLessonCurriculum(
  dependencies: LearningApplicationDependencies,
  input: Readonly<{ learnerId: LearnerId; lessonId: LessonId }>
) {
  const lessonPinned =
    await dependencies.transitionRepository.findPinnedScope(input)
  if (lessonPinned !== null) {
    return dependencies.content.readCurriculum({
      courseId: lessonPinned.courseId,
      curriculumVersionId: lessonPinned.curriculumVersionId,
    })
  }

  const published = await dependencies.content.findCurriculumByLesson({
    lessonId: input.lessonId,
  })
  if (published === null) return null

  const coursePinned = await dependencies.transitionRepository.findPinnedScope({
    courseId: published.courseId,
    ...input,
  })
  return coursePinned === null
    ? published
    : dependencies.content.readCurriculum({
        courseId: coursePinned.courseId,
        curriculumVersionId: coursePinned.curriculumVersionId,
      })
}
