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
import type {
  LearningAiFeedbackError,
  LearningAiFeedbackResult,
  LearningApplicationDependencies,
} from "#learning/application/ports/learning-ports"

export type StartLearningLessonCommand = Readonly<{
  expectedCurriculumVersionId: CurriculumVersionId
  learnerId: LearnerId
  lessonId: LessonId
}>

export type SubmitLearningStepCommand = Readonly<{
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
        completion: Readonly<{ kind: "acknowledge" | "skip-ai-feedback" }>
      }>
  )

export type SaveLearningStepDraftCommand = Readonly<{
  answer: LearnerStepDraftAnswer
  expectedCurriculumVersionId: CurriculumVersionId
  expectedVersion: number | null
  learnerId: LearnerId
  lessonId: LessonId
  stepId: LessonStepId
}>

export type RequestLearningAiFeedbackCommand = Readonly<{
  idempotencyKey: string
  learnerId: LearnerId
  lessonId: LessonId
  stepId: LessonStepId
}>

export type LearningCollaboratorError =
  | Readonly<{ kind: "learner-inactive" }>
  | Readonly<{ kind: "learner-not-found" }>
  | Readonly<{ kind: "identity-query-failed" }>

export type LearningCommandError =
  | LearnerTransitionError
  | LearningCollaboratorError
  | LearningAiFeedbackError

export type LearningReadError =
  | Readonly<{ kind: "course-not-found" }>
  | Readonly<{ kind: "lesson-locked" }>
  | Readonly<{ kind: "lesson-not-found" }>

export type LearningAiFeedbackTransition = Readonly<{
  feedback: LearningAiFeedbackResult
  transition: CompleteLearnerStepTransitionResult
}>

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
  requestAiFeedback: (
    command: RequestLearningAiFeedbackCommand,
    options?: Readonly<{ signal?: AbortSignal }>
  ) => Promise<Result<LearningAiFeedbackTransition, LearningCommandError>>
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
    async requestAiFeedback(command, options) {
      const authorization = await authorizeLearner(
        dependencies,
        command.learnerId
      )
      if (authorization.isErr()) return err(authorization.error)
      const curriculum = await readLessonCurriculum(dependencies, command)
      if (curriculum === null) {
        return err({ kind: "lesson-not-found", lessonId: command.lessonId })
      }
      const prepared =
        await dependencies.transitionRepository.prepareAiFeedback(
          {
            lessonId: command.lessonId,
            stepId: command.stepId,
            userId: command.learnerId,
          },
          curriculum
        )
      if (prepared.isErr()) return err(prepared.error)

      const feedback = await dependencies.aiFeedback.requestFeedback(
        {
          ...prepared.value,
          idempotencyKey: command.idempotencyKey,
          learnerId: command.learnerId,
          lessonId: command.lessonId,
          stepId: command.stepId,
        },
        options ?? {}
      )
      if (feedback.isErr()) return err(feedback.error)

      const committed =
        await dependencies.transitionRepository.completeAiFeedbackStep(
          {
            lessonId: command.lessonId,
            occurredAt: dependencies.clock.now(),
            stepId: command.stepId,
            userId: command.learnerId,
          },
          curriculum
        )
      if (committed.isErr()) return err(committed.error)
      return ok({ feedback: feedback.value, transition: committed.value })
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
  const pinned = await dependencies.transitionRepository.findPinnedScope(input)
  return pinned === null
    ? dependencies.content.findCurriculumByLesson({ lessonId: input.lessonId })
    : dependencies.content.readCurriculum({
        courseId: pinned.courseId,
        curriculumVersionId: pinned.curriculumVersionId,
      })
}
