import type { Result } from "@workspace/kernel/result"
import { AppError } from "@workspace/http-platform/errors"
import type { WritingApplicationError } from "#writing/application/ports/writing-ports"
import type { Writing } from "#writing/domain/writing"

export function presentWriting(writing: Writing) {
  return {
    body: writing.body,
    checkedAt: writing.checkedAt?.toISOString() ?? null,
    createdAt: writing.createdAt.toISOString(),
    id: writing.id,
    mode: writing.mode,
    selfCheckStartedAt: writing.selfCheckStartedAt?.toISOString() ?? null,
    status: writing.status,
    title: writing.title,
    updatedAt: writing.updatedAt.toISOString(),
    version: writing.version,
  }
}

export function presentWritingSummary(writing: Writing) {
  const detail = presentWriting(writing)
  return {
    id: detail.id,
    mode: detail.mode,
    status: detail.status,
    title: detail.title,
    updatedAt: detail.updatedAt,
    version: detail.version,
  }
}

export function unwrapWritingResult<TValue>(
  result: Result<TValue, WritingApplicationError>
): TValue {
  if (result.isOk()) return result.value

  switch (result.error.kind) {
    case "writing-not-found":
      throw new AppError({
        code: "WRITING_NOT_FOUND",
        message: "글을 찾을 수 없습니다.",
        status: 404,
      })
    case "writing-self-check-not-started":
      throw new AppError({
        code: "WRITING_SELF_CHECK_NOT_STARTED",
        message: "글 점검을 먼저 시작해 주세요.",
        status: 409,
      })
    case "writing-version-conflict":
      throw new AppError({
        code: "WRITING_VERSION_CONFLICT",
        message:
          "다른 곳에서 글이 변경되었습니다. 작성 중인 내용은 화면에 보관했습니다.",
        status: 409,
      })
  }
}
