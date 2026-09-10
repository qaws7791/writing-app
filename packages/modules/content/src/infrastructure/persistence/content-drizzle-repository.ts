import type { WritingAppDatabase } from "@workspace/db/client"

import type { ContentRepository } from "#content/application/ports/content-ports"
import {
  createAsset,
  deleteOrphanedAssetCandidates,
  listActiveAssetsForCourse,
  listAssetsForCourse,
  listOrphanedAssetCandidates,
  readActiveAssetsByIds,
  readAssetOwner,
} from "#content/infrastructure/persistence/content-asset-drizzle"
import {
  createCourse,
  findCourse,
  readCourseChangeTarget,
  readCourses,
  saveCourse,
  toCourseEditorDocument,
} from "#content/infrastructure/persistence/content-course-drizzle"
import {
  publishDraft,
  readDraft,
  saveDraft,
} from "#content/infrastructure/persistence/content-draft-publish-drizzle"
import {
  executeApprovedMcpChange,
  executeAutomaticMcpChange,
  readApprovedMcpChangeReceipt,
  readAutomaticMcpChangeReceipt,
} from "#content/infrastructure/persistence/content-mcp-receipt-drizzle"
import {
  findCurriculumByLesson,
  listPublishedCourseSummaries,
  readCurriculum,
} from "#content/infrastructure/persistence/content-published-query-drizzle"

export function createDrizzleContentRepository(
  database: WritingAppDatabase
): ContentRepository {
  return {
    async createAsset(asset) {
      return createAsset(database, asset)
    },
    async createCourse(input) {
      return createCourse(database, input)
    },
    async executeApprovedMcpChange(input) {
      return executeApprovedMcpChange(database, input)
    },
    async executeAutomaticMcpChange(input) {
      return executeAutomaticMcpChange(database, input)
    },
    async findCourse(courseId) {
      return findCourse(database, courseId)
    },
    async findCurriculumByLesson(input) {
      return findCurriculumByLesson(database, input)
    },
    async findDraft(courseId) {
      return readDraft(database, courseId)
    },
    async listPublishedCourseSummaries(query) {
      return listPublishedCourseSummaries(database, query)
    },
    async listActiveAssetsForCourse(courseId) {
      return listActiveAssetsForCourse(database, courseId)
    },
    async listAssetsForCourse(courseId) {
      return listAssetsForCourse(database, courseId)
    },
    async listOrphanedAssetCandidates(input) {
      return listOrphanedAssetCandidates(database, input)
    },
    async deleteOrphanedAssetCandidates(input) {
      return deleteOrphanedAssetCandidates(database, input)
    },
    async readAssetOwner(input) {
      return readAssetOwner(database, input)
    },
    async readActiveAssetsByIds(assetIds) {
      return readActiveAssetsByIds(database, assetIds)
    },
    async publishDraft(input) {
      return publishDraft(database, input)
    },
    async readCourseEditor(courseId) {
      const draft = readDraft(database, courseId)
      if (draft.isErr()) {
        throw new Error(`Content draft invariant failed: ${draft.error.kind}`)
      }
      return draft.value === null ? null : toCourseEditorDocument(draft.value)
    },
    async readCourseChangeTarget(courseId) {
      return readCourseChangeTarget(database, courseId)
    },
    async readCourses(input) {
      return readCourses(database, input)
    },
    async readCurriculum(input) {
      return readCurriculum(database, input)
    },
    async readApprovedMcpChangeReceipt(binding) {
      return readApprovedMcpChangeReceipt(database, binding)
    },
    async readAutomaticMcpChangeReceipt(binding) {
      return readAutomaticMcpChangeReceipt(database, binding)
    },
    async saveCourse(input) {
      return saveCourse(database, input)
    },
    async saveDraft(input) {
      return saveDraft(database, input)
    },
  }
}
