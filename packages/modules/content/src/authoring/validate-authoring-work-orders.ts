import { resolve } from "node:path"

import { findForbiddenBrandTerms } from "@workspace/contracts/content/authoring"

import {
  parseAuthoringWorkOrders,
  type AuthoringWorkOrder,
} from "#content/authoring/authoring-work-order"
import {
  validateAuthoringLessonSteps,
  type AuthoringValidationIssue,
} from "#content/authoring/validate-authoring-lesson"

export async function validateAuthoringWorkOrdersFromFiles(input: {
  readonly lessonIds?: readonly string[]
  readonly lessonsRoot: string
  readonly workOrdersPath: string
}): Promise<readonly AuthoringValidationIssue[]> {
  const workOrdersFile = Bun.file(input.workOrdersPath)
  if (!(await workOrdersFile.exists())) {
    return [
      {
        message: "작업 지시서 파일이 없습니다.",
        path: input.workOrdersPath,
        severity: "error",
      },
    ]
  }

  let workOrders: unknown
  try {
    workOrders = await workOrdersFile.json()
  } catch (cause) {
    return [
      {
        message: `작업 지시서 JSON 파싱 실패: ${String(cause)}`,
        path: input.workOrdersPath,
        severity: "error",
      },
    ]
  }

  return validateAuthoringWorkOrders({
    lessonIds: input.lessonIds,
    lessonsRoot: input.lessonsRoot,
    workOrders,
  })
}

async function validateAuthoringWorkOrders(input: {
  readonly lessonIds?: readonly string[]
  readonly lessonsRoot: string
  readonly workOrders: unknown
}): Promise<readonly AuthoringValidationIssue[]> {
  const parsed = parseAuthoringWorkOrders(input.workOrders)
  const requestedLessonIds =
    input.lessonIds === undefined ? null : new Set(input.lessonIds)
  const issues: AuthoringValidationIssue[] = []

  for (const order of parsed.orders) {
    if (
      requestedLessonIds !== null &&
      !requestedLessonIds.has(order.lessonId)
    ) {
      continue
    }

    const brandTerms = findForbiddenBrandTerms(JSON.stringify(order))
    if (brandTerms.length > 0) {
      issues.push({
        message: `브리프에 브랜드·서비스 이름이 있습니다: ${brandTerms.join(", ")}`,
        path: order.lessonId,
        severity: "error",
      })
    }

    const lessonPath = resolveLessonPath({
      defaultCourseId: parsed.defaultCourseId,
      defaultLessonsDirectory: parsed.defaultLessonsDirectory,
      lessonsRoot: input.lessonsRoot,
      order,
    })

    issues.push(
      ...(await validateAuthoringWorkOrder({
        lessonPath,
        order,
      }))
    )
  }

  if (
    requestedLessonIds !== null &&
    parsed.orders.every((order) => !requestedLessonIds.has(order.lessonId))
  ) {
    issues.push({
      message: `작업 지시서에 없는 레슨 ID: ${input.lessonIds?.join(", ")}`,
      path: input.lessonsRoot,
      severity: "error",
    })
  }

  return issues
}

async function validateAuthoringWorkOrder(input: {
  readonly lessonPath: string
  readonly order: AuthoringWorkOrder
}): Promise<readonly AuthoringValidationIssue[]> {
  const file = Bun.file(input.lessonPath)
  if (!(await file.exists())) {
    return [
      {
        message: `레슨 파일이 없습니다: ${input.lessonPath}`,
        path: input.order.lessonId,
        severity: "error",
      },
    ]
  }

  let steps: unknown
  try {
    steps = await file.json()
  } catch (cause) {
    return [
      {
        message: `JSON 파싱 실패: ${String(cause)}`,
        path: input.order.lessonId,
        severity: "error",
      },
    ]
  }

  return validateAuthoringLessonSteps({
    lessonId: input.order.lessonId,
    steps,
  })
}

function resolveLessonPath(input: {
  readonly defaultCourseId?: string
  readonly defaultLessonsDirectory?: string
  readonly lessonsRoot: string
  readonly order: AuthoringWorkOrder
}): string {
  const courseId = input.order.courseId ?? input.defaultCourseId
  const lessonsDirectory =
    input.order.lessonsDirectory ??
    input.defaultLessonsDirectory ??
    (courseId === undefined ? undefined : `courses/${courseId}`)

  if (lessonsDirectory === undefined) {
    return resolve(input.lessonsRoot, `${input.order.lessonId}.json`)
  }

  return resolve(
    input.lessonsRoot,
    lessonsDirectory,
    `${input.order.lessonId}.json`
  )
}
