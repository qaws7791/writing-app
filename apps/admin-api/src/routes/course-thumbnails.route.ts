import type { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"

import {
  adminCreateCourseThumbnailUploadDtoSchema,
  adminCreateCourseThumbnailUploadRequestDtoSchema,
  adminInvalidRequestErrorDtoSchema,
  adminStorageUnavailableErrorDtoSchema,
  type AdminCreateCourseThumbnailUploadDto,
  type AdminCreateCourseThumbnailUploadRequestDto,
  type AdminStorageUnavailableErrorDto,
} from "@workspace/core/admin"

import type { AdminAuthRuntime } from "@/auth/admin-session"
import { requireAdminSession } from "@/auth/admin-session"
import { jsonErrorResponse } from "@/routes/error-response"

export type CourseThumbnailUploadResult =
  | {
      status: "ok"
      value: AdminCreateCourseThumbnailUploadDto
    }
  | {
      status: "unavailable"
      error: AdminStorageUnavailableErrorDto
    }

export interface CourseThumbnailUploadService {
  create(
    input: AdminCreateCourseThumbnailUploadRequestDto
  ): Promise<CourseThumbnailUploadResult>
}

export function registerCourseThumbnailsRoute(
  app: Hono,
  input: {
    auth: AdminAuthRuntime
    courseThumbnailUploads: CourseThumbnailUploadService
  }
) {
  app.post(
    "/course-thumbnails/uploads",
    requireAdminSession(input.auth),
    describeRoute({
      responses: {
        201: {
          description: "코스 썸네일 업로드 signed URL입니다.",
          content: {
            "application/json": {
              schema: resolver(adminCreateCourseThumbnailUploadDtoSchema),
            },
          },
        },
        400: {
          description: "썸네일 업로드 요청이 올바르지 않습니다.",
          content: jsonErrorResponse(adminInvalidRequestErrorDtoSchema),
        },
        401: {
          description: "관리자 로그인이 필요합니다.",
        },
        503: {
          description: "스토리지를 사용할 수 없습니다.",
          content: jsonErrorResponse(adminStorageUnavailableErrorDtoSchema),
        },
      },
    }),
    async (context) => {
      const body = await readJsonBody(context.req.raw)
      const parsed =
        adminCreateCourseThumbnailUploadRequestDtoSchema.safeParse(body)

      if (!parsed.success) {
        return context.json(
          {
            code: "invalid-request",
            message: "썸네일 업로드 요청 본문이 올바르지 않습니다.",
          },
          400
        )
      }

      const result = await input.courseThumbnailUploads.create(parsed.data)

      switch (result.status) {
        case "ok":
          return context.json(result.value, 201)
        case "unavailable":
          return context.json(result.error, 503)
      }
    }
  )
}

async function readJsonBody(request: Request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}
