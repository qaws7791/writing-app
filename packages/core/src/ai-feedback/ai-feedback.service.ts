import type {
  ContentService,
  InvalidContentSeedErrorDto,
  LessonId,
  LessonNotFoundErrorDto,
  LessonStepDto,
} from "../content"
import { lessonId } from "../content"
import type {
  AiFeedbackRequestDto,
  AiFeedbackResultDto,
} from "./ai-feedback.dto"
import type {
  AiFeedbackUnavailableErrorDto,
  AnswerNotFoundErrorDto,
  FeedbackRetryLimitExceededErrorDto,
  FeedbackStepNotFoundErrorDto,
} from "./ai-feedback.errors"
import type { AiFeedbackProvider } from "./ai-feedback.provider"
import type { AiFeedbackRepository } from "./ai-feedback.repository"
import type { LearningDatabaseUnavailableErrorDto } from "../learning"
import type { LearningRepository, UserId } from "../learning"

type OkResult = {
  status: "ok"
  value: AiFeedbackResultDto
}

type AnswerNotFoundResult = {
  status: "answer-not-found"
  error: AnswerNotFoundErrorDto
}

type FeedbackStepNotFoundResult = {
  status: "feedback-step-not-found"
  error: FeedbackStepNotFoundErrorDto
}

type RetryLimitExceededResult = {
  status: "retry-limit-exceeded"
  error: FeedbackRetryLimitExceededErrorDto
}

type UnavailableResult = {
  status: "unavailable"
  error: AiFeedbackUnavailableErrorDto | LearningDatabaseUnavailableErrorDto
}

type LessonNotFoundResult = {
  status: "not-found"
  error: LessonNotFoundErrorDto
}

type InvalidContentResult = {
  status: "invalid-content"
  error: InvalidContentSeedErrorDto
}

export type AiFeedbackServiceResult =
  | OkResult
  | AnswerNotFoundResult
  | FeedbackStepNotFoundResult
  | RetryLimitExceededResult
  | UnavailableResult
  | LessonNotFoundResult
  | InvalidContentResult

export interface AiFeedbackService {
  createFeedback(
    userId: UserId,
    request: AiFeedbackRequestDto
  ): Promise<AiFeedbackServiceResult>
}

interface AiFeedbackServiceDependencies {
  contentService: ContentService
  feedbackRepository: AiFeedbackRepository
  learningRepository: LearningRepository
  provider: AiFeedbackProvider
}

const aiFeedbackUnavailableResult: UnavailableResult = {
  status: "unavailable",
  error: {
    code: "ai-feedback-unavailable",
    message: "인공지능 피드백을 사용할 수 없습니다.",
  },
}

const databaseUnavailableResult: UnavailableResult = {
  status: "unavailable",
  error: {
    code: "database-unavailable",
    message: "데이터베이스를 사용할 수 없습니다.",
  },
}

const feedbackRetryLimitExceededResult: RetryLimitExceededResult = {
  status: "retry-limit-exceeded",
  error: {
    code: "feedback-retry-limit-exceeded",
    message: "피드백 재시도 한도를 초과했습니다.",
  },
}

export function createAiFeedbackService({
  contentService,
  feedbackRepository,
  learningRepository,
  provider,
}: AiFeedbackServiceDependencies): AiFeedbackService {
  return {
    async createFeedback(userId, request) {
      const lessonResult = await contentService.getLesson(
        lessonId(request.lessonId)
      )

      if (lessonResult.status === "not-found") {
        return {
          status: "not-found",
          error: {
            code: "lesson-not-found",
            message: "레슨을 찾을 수 없습니다.",
            lessonId: request.lessonId,
          },
        }
      }
      if (lessonResult.status === "invalid-content") {
        return lessonResult
      }
      if (lessonResult.status !== "ok") {
        return databaseUnavailableResult
      }

      const feedbackStep = findFeedbackStep(
        lessonResult.value.steps,
        request.feedbackStepId
      )
      if (!feedbackStep) {
        return {
          status: "feedback-step-not-found",
          error: {
            code: "feedback-step-not-found",
            message: "피드백 스텝을 찾을 수 없습니다.",
          },
        }
      }

      let attemptCount
      try {
        attemptCount = await feedbackRepository.countCompletedAttempts(
          userId,
          lessonId(request.lessonId),
          request.feedbackStepId
        )
      } catch {
        return databaseUnavailableResult
      }

      if (attemptCount >= 3) {
        return feedbackRetryLimitExceededResult
      }

      const answer = await resolveAnswer({
        explicitAnswer: request.answer,
        learningRepository,
        lessonId: lessonId(request.lessonId),
        sourceStepId: feedbackStep.content.sourceStepId,
        userId,
      })
      if (answer.status === "unavailable") {
        return databaseUnavailableResult
      }
      if (answer.status === "not-found") {
        return {
          status: "answer-not-found",
          error: {
            code: "answer-not-found",
            message: "답변을 찾을 수 없습니다.",
          },
        }
      }

      let feedbackResult
      try {
        feedbackResult = await provider.createFeedback({
          answer: answer.value,
          criteria: feedbackStep.content.focusAreas.join(", "),
          focusAreas: feedbackStep.content.focusAreas,
          prompt: feedbackStep.content.feedbackPrompt,
          scoreRange: feedbackStep.content.scoreRange,
        })
      } catch {
        return aiFeedbackUnavailableResult
      }

      if (feedbackResult.status !== "ok") {
        return aiFeedbackUnavailableResult
      }

      try {
        const attempt = await feedbackRepository.createNextCompletedAttempt({
          answerSnapshot: answer.value,
          feedbackStepId: feedbackStep.id,
          lessonId: lessonId(request.lessonId),
          maxAttempts: 3,
          result: feedbackResult.value,
          sourceStepId: feedbackStep.content.sourceStepId,
          userId,
        })

        if (attempt.status === "retry-limit-exceeded") {
          return feedbackRetryLimitExceededResult
        }
      } catch {
        return databaseUnavailableResult
      }

      return {
        status: "ok",
        value: feedbackResult.value,
      }
    },
  }
}

function findFeedbackStep(steps: LessonStepDto[], feedbackStepId: string) {
  return steps.find(
    (step): step is Extract<LessonStepDto, { type: "AI_FEEDBACK" }> =>
      step.id === feedbackStepId && step.type === "AI_FEEDBACK"
  )
}

async function resolveAnswer({
  explicitAnswer,
  learningRepository,
  lessonId,
  sourceStepId,
  userId,
}: {
  explicitAnswer?: string
  learningRepository: LearningRepository
  lessonId: LessonId
  sourceStepId: string
  userId: UserId
}): Promise<
  | {
      status: "ok"
      value: string
    }
  | {
      status: "not-found"
    }
  | {
      status: "unavailable"
    }
> {
  if (explicitAnswer) {
    return {
      status: "ok",
      value: explicitAnswer,
    }
  }

  try {
    const answers = await learningRepository.listLessonAnswers(userId, lessonId)
    const sourceAnswer = answers.find(
      (answer) => answer.stepId === sourceStepId
    )

    if (!sourceAnswer) {
      return { status: "not-found" }
    }

    return {
      status: "ok",
      value: sourceAnswer.answer,
    }
  } catch {
    return { status: "unavailable" }
  }
}
