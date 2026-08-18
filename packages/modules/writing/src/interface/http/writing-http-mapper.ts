import type { Result } from "@workspace/kernel/result"
import { AppError } from "@workspace/http-platform/errors"
import type { WritingApplicationError } from "#writing/application/ports/writing-ports"
import type { WritingSession } from "#writing/application/ports/writing-ports"
import type { WritingSummaryRecord } from "#writing/application/ports/writing-ports"
import type { WritingCatalogItem } from "#writing/application/ports/writing-ports"
import type { WritingTaskDraft } from "#writing/domain/writing-task"
import { countWritingChars, previewWritingBody } from "#writing/domain/writing"

export function presentWritingSession(session: WritingSession) {
  return {
    aiNoticeAcknowledged: session.aiNoticeAcknowledged,
    body: session.writing.body,
    brief: {
      audience: session.brief.audience,
      difficulty: session.brief.difficulty,
      domain: session.brief.domain,
      goalChars: session.brief.goalChars,
      minChars: session.brief.minChars,
      publicationId: session.brief.id,
      requiredElements: [...session.brief.requiredElements],
      situation: session.brief.situation,
      taskId: session.brief.taskId,
      title: session.brief.title,
      typeName: session.brief.typeName,
    },
    check: session.check,
    createdAt: session.writing.createdAt.toISOString(),
    dailyChecksRemaining: session.dailyChecksRemaining,
    id: session.writing.id,
    updatedAt: session.writing.updatedAt.toISOString(),
    version: session.writing.version,
  }
}

export function presentWritingSummary(record: WritingSummaryRecord) {
  return {
    charCount: countWritingChars(record.writing.body),
    createdAt: record.writing.createdAt.toISOString(),
    difficulty: record.brief.difficulty,
    domain: record.brief.domain,
    id: record.writing.id,
    preview: previewWritingBody(record.writing.body),
    taskId: record.brief.taskId,
    title: record.brief.title,
    typeName: record.brief.typeName,
    updatedAt: record.writing.updatedAt.toISOString(),
    version: record.writing.version,
  }
}

export function presentWritingCatalogItem(item: WritingCatalogItem) {
  return {
    audience: item.audience,
    difficulty: item.difficulty,
    domain: item.domain,
    goalChars: item.goalChars,
    publicationId: item.publicationId,
    situation: item.situation,
    taskId: item.taskId,
    title: item.title,
    typeName: item.typeName,
  }
}

export function presentWritingTask(draft: WritingTaskDraft) {
  return {
    audience: draft.audience,
    difficulty: draft.difficulty,
    domain: draft.domain,
    editVersion: draft.editVersion,
    goalChars: draft.goalChars,
    id: draft.id,
    latestPublicationId: draft.latestPublicationId,
    minChars: draft.minChars,
    requiredElements: [...draft.requiredElements],
    situation: draft.situation,
    status: draft.latestPublicationId === null ? "draft" : "published",
    title: draft.title,
    typeName: draft.typeName,
    updatedAt: draft.updatedAt.toISOString(),
  }
}

export function presentWritingTaskListItem(draft: WritingTaskDraft) {
  return {
    difficulty: draft.difficulty,
    domain: draft.domain,
    editVersion: draft.editVersion,
    id: draft.id,
    latestPublicationId: draft.latestPublicationId,
    status: draft.latestPublicationId === null ? "draft" : "published",
    title: draft.title,
    typeName: draft.typeName,
    updatedAt: draft.updatedAt.toISOString(),
  }
}

export function unwrapWritingResult<TValue>(
  result: Result<TValue, WritingApplicationError>
): TValue {
  if (result.isOk()) return result.value
  throw mapWritingError(result.error)
}

function mapWritingError(error: WritingApplicationError): AppError {
  switch (error.kind) {
    case "writing-not-found":
      return new AppError({
        code: "WRITING_NOT_FOUND",
        message: "글을 찾을 수 없습니다.",
        status: 404,
      })
    case "writing-task-not-found":
      return new AppError({
        code: "WRITING_TASK_NOT_FOUND",
        message: "과제를 찾을 수 없습니다.",
        status: 404,
      })
    case "writing-task-unpublished":
      return new AppError({
        code: "WRITING_TASK_UNPUBLISHED",
        message: "아직 발행되지 않은 과제입니다.",
        status: 409,
      })
    case "writing-version-conflict":
      return new AppError({
        code: "WRITING_VERSION_CONFLICT",
        message:
          "다른 곳에서 글이 변경되었습니다. 작성 중인 내용은 화면에 보관했습니다.",
        status: 409,
      })
    case "writing-task-version-conflict":
      return new AppError({
        code: "WRITING_TASK_VERSION_CONFLICT",
        message:
          "다른 곳에서 과제가 변경되었습니다. 최신 초안을 다시 불러 주세요.",
        status: 409,
      })
    case "writing-ai-notice-required":
      return new AppError({
        code: "WRITING_AI_NOTICE_REQUIRED",
        message:
          "점검을 위해 글을 외부 AI로 전달한다는 안내를 먼저 확인해 주세요.",
        status: 409,
      })
    case "writing-check-daily-limit":
      return new AppError({
        code: "WRITING_CHECK_DAILY_LIMIT",
        message:
          "오늘은 점검 횟수를 모두 사용했습니다. 내일 다시 시도해 주세요.",
        status: 429,
      })
    case "writing-check-min-chars":
      return new AppError({
        code: "WRITING_CHECK_MIN_CHARS",
        message: `최소 ${error.minChars}자 이상 쓴 뒤에 점검할 수 있습니다.`,
        status: 409,
      })
    case "writing-check-not-configured":
      return new AppError({
        code: "WRITING_CHECK_NOT_CONFIGURED",
        message: "점검 설정이 없어 지금은 점검할 수 없습니다.",
        status: 503,
      })
    case "writing-check-invalid-result":
    case "writing-check-provider-unavailable":
      return new AppError({
        code: "WRITING_CHECK_UNAVAILABLE",
        message:
          "점검을 준비하지 못했습니다. 본문은 그대로 있고, 잠시 뒤 다시 시도해 주세요.",
        status: 503,
      })
    case "writing-task-not-ready-to-publish":
      return new AppError({
        code: "WRITING_TASK_NOT_READY",
        message: error.reason,
        status: 409,
      })
  }
}
