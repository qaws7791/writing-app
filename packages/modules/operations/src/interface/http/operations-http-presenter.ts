import {
  adminAnalyticsDtoSchema,
  adminLessonAnalyticsPageDtoSchema,
} from "@workspace/contracts/operations/admin-analytics"
import { adminAuditEventsDtoSchema } from "@workspace/contracts/operations/admin-audit"
import { adminDashboardDtoSchema } from "@workspace/contracts/operations/admin-dashboard"

import type { AuditEventPage } from "#operations/application/audit-trail"
import type {
  OperationsAnalytics,
  OperationsDashboard,
  OperationsLessonAnalyticsPage,
} from "#operations/application/ports/operations-reporting-repository"

export function toAdminDashboardDto(value: OperationsDashboard) {
  return adminDashboardDtoSchema.parse(value)
}

export function toAdminAnalyticsDto(value: OperationsAnalytics) {
  return adminAnalyticsDtoSchema.parse(value)
}

export function toAdminLessonAnalyticsPageDto(
  value: OperationsLessonAnalyticsPage
) {
  return adminLessonAnalyticsPageDtoSchema.parse({
    items: value.items,
    pagination: toLessonAnalyticsPagination(value),
  })
}

export function toAdminAuditEventsDto(value: AuditEventPage) {
  return adminAuditEventsDtoSchema.parse({
    items: value.items.map((event) => ({
      action: event.action,
      actorId: event.actorId,
      category: event.category,
      clientIp: event.clientIp,
      createdAt: event.createdAt.toISOString(),
      id: event.id,
      outcome: event.outcome,
      requestId: event.requestId,
      retentionUntil: event.retentionUntil.toISOString(),
      target: event.target,
    })),
    pagination: toAuditPagination(value),
  })
}

function toLessonAnalyticsPagination(value: OperationsLessonAnalyticsPage) {
  return {
    hasNextPage: value.hasNextPage ?? false,
    hasPreviousPage: value.hasPreviousPage ?? value.page > 1,
    nextCursor: value.nextCursor ?? null,
    page: value.page,
    pageSize: value.pageSize,
    previousCursor: value.previousCursor ?? null,
    ...(value.totalItems === undefined ? {} : { totalItems: value.totalItems }),
    ...(value.totalPages === undefined ? {} : { totalPages: value.totalPages }),
  }
}

function toAuditPagination(value: AuditEventPage) {
  return {
    hasNextPage:
      value.hasNextPage ??
      (value.totalPages !== undefined && value.page < value.totalPages),
    hasPreviousPage: value.hasPreviousPage ?? value.page > 1,
    nextCursor: value.nextCursor ?? null,
    page: value.page,
    pageSize: value.pageSize,
    previousCursor: value.previousCursor ?? null,
    ...(value.totalItems === undefined ? {} : { totalItems: value.totalItems }),
    ...(value.totalPages === undefined ? {} : { totalPages: value.totalPages }),
  }
}
