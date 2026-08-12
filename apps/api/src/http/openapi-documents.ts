import { createLearnerCursorCodec } from "@workspace/learning/http"

import {
  registerAdminContractRoutes,
  registerLearnerContractRoutes,
  type AdminContractRouteDependencies,
  type LearnerContractRouteDependencies,
} from "@/composition/create-app"
import { createAdminApp } from "@/http/admin-app"
import { createLearnerApp } from "@/http/learner-app"
import { createAdminOpenApiDocument } from "@/http/admin-openapi"
import type { AdminOpenApiDocument } from "@/http/admin-openapi"
import { createOpenApiDocument } from "@/http/openapi"
import type { ApiOpenApiDocument } from "@/http/openapi"

const contractOnly = (): never => {
  throw new Error("OpenAPI contract dependencies cannot handle requests.")
}

const learnerDependencies = {
  health: { isDatabaseReady: contractOnly },
  identity: {
    application: { changeLearnerDisplayName: contractOnly },
    profileStatsQuery: { readProfileStats: contractOnly },
    sessionResolver: { resolveSession: contractOnly },
  },
  learning: {
    application: {
      readCourseCatalog: contractOnly,
      readCourseCategories: contractOnly,
      readCourseDetail: contractOnly,
      readLearnerHome: contractOnly,
      readLesson: contractOnly,
      saveStepDraft: contractOnly,
      startLesson: contractOnly,
      submitStep: contractOnly,
    },
    cursor: createLearnerCursorCodec("openapi-cursor-signing-secret-32-bytes"),
    session: { resolveLearner: contractOnly },
  },
  writing: {
    application: {
      completeSelfCheck: contractOnly,
      create: contractOnly,
      delete: contractOnly,
      get: contractOnly,
      list: contractOnly,
      save: contractOnly,
      startSelfCheck: contractOnly,
    },
    session: { resolveLearner: contractOnly },
  },
} satisfies LearnerContractRouteDependencies

const adminSessionResolver = { resolveSession: contractOnly }

const adminDependencies = {
  content: {
    application: {
      archiveCourse: contractOnly,
      cleanupOrphanedAssets: contractOnly,
      createCourse: contractOnly,
      executeApprovedMcpChange: contractOnly,
      executeAutomaticMcpChange: contractOnly,
      findCurriculumByLesson: contractOnly,
      getCourseAssets: contractOnly,
      getCourseEditor: contractOnly,
      getCourseChangeTarget: contractOnly,
      getCourses: contractOnly,
      listPublishedCourses: contractOnly,
      publishCourse: contractOnly,
      readCurriculum: contractOnly,
      readApprovedMcpChangeReceipt: contractOnly,
      readAutomaticMcpChangeReceipt: contractOnly,
      resolveAssetReferences: contractOnly,
      restoreCourse: contractOnly,
      saveCourseEditor: contractOnly,
      uploadAsset: contractOnly,
    },
    sessionPort: { resolveAdminId: contractOnly },
  },
  foundation: {
    health: { isDatabaseReady: contractOnly },
    sessionResolver: adminSessionResolver,
  },
  identity: {
    sessionResolver: adminSessionResolver,
    userMutationService: {
      deleteUser: contractOnly,
      updateUserStatus: contractOnly,
    },
    userReader: {
      readUser: contractOnly,
      readUsers: contractOnly,
    },
  },
  operations: {
    adminMcpApprovals: {
      claim: contractOnly,
      complete: contractOnly,
      decide: contractOnly,
      readForOwner: contractOnly,
      request: contractOnly,
    },
    auditTrail: {
      begin: contractOnly,
      beginMcp: contractOnly,
      complete: contractOnly,
      ensureMcpStarted: contractOnly,
      inspectExpired: contractOnly,
      purgeExpired: contractOnly,
      readEvents: contractOnly,
    },
    now: contractOnly,
    reporting: {
      readAnalytics: contractOnly,
      readDashboard: contractOnly,
      readLessonAnalytics: contractOnly,
    },
    session: { resolveActor: contractOnly },
  },
} satisfies AdminContractRouteDependencies

export type OpenApiDocuments = Readonly<{
  admin: AdminOpenApiDocument
  learner: ApiOpenApiDocument
}>

export function createOpenApiDocuments(): OpenApiDocuments {
  const learner = createLearnerApp({})
  registerLearnerContractRoutes(learner, learnerDependencies)

  const admin = createAdminApp({})
  registerAdminContractRoutes(admin, adminDependencies)

  return {
    admin: createAdminOpenApiDocument(admin),
    learner: createOpenApiDocument(learner),
  }
}

export function serializeOpenApiDocument(document: unknown): string {
  return `${JSON.stringify(sortJsonValue(document), null, 2)}\n`
}

function sortJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJsonValue)
  if (value === null || typeof value !== "object") return value

  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, nested]) => [key, sortJsonValue(nested)])
  )
}
