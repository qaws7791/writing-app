import type { AdminApiDependencies, AdminApiServices } from "@/app"
import type {
  AdminAuthenticatedSession,
  AdminSessionResolver,
} from "@/auth/admin-session"
import type { ResourceCollaborationRooms } from "@/collaboration/resource-collaboration-rooms"
import type { ResourceEventsWorkspace } from "@/collaboration/resource-events-hub"
import { adminRoles } from "@workspace/core/admin"
import { readBearerToken } from "@workspace/core/auth"
import { localRuntimeDefaults } from "@workspace/env"

type TestAdminApiServicesOverrides = {
  readonly [TKey in Exclude<
    keyof AdminApiServices,
    "resourceLibrary"
  >]?: Partial<AdminApiServices[TKey]>
} & {
  readonly resourceLibrary?: {
    readonly documents?: Partial<
      AdminApiServices["resourceLibrary"]["documents"]
    >
    readonly search?: Partial<AdminApiServices["resourceLibrary"]["search"]>
    readonly tree?: Partial<AdminApiServices["resourceLibrary"]["tree"]>
  }
}

type TestAdminApiDependencyOverrides = {
  readonly adminOrigin?: string
  readonly adminServices?: TestAdminApiServicesOverrides
  readonly now?: () => Date
  readonly resourceCollaborationRooms?: ResourceCollaborationRooms
  readonly resourceEvents?: ResourceEventsWorkspace
  readonly sessionResolver?: AdminSessionResolver
}

export const testAdminNow = new Date("2026-06-14T03:00:00.000Z")

export const testAdminSession = {
  admin: {
    email: "admin@example.com",
    id: "admin-1",
    name: "관리자",
    role: adminRoles.owner,
  },
} as const satisfies AdminAuthenticatedSession

export function createTestAdminApiDependencies(
  overrides: TestAdminApiDependencyOverrides = {}
): AdminApiDependencies {
  const failingAdminServices = createFailingAdminApiServices()

  return {
    adminServices: {
      aiChat: {
        ...failingAdminServices.aiChat,
        ...overrides.adminServices?.aiChat,
      },
      analytics: {
        ...failingAdminServices.analytics,
        ...overrides.adminServices?.analytics,
      },
      contentReset: {
        ...failingAdminServices.contentReset,
        ...overrides.adminServices?.contentReset,
      },
      courses: {
        ...failingAdminServices.courses,
        ...overrides.adminServices?.courses,
      },
      dashboard: {
        ...failingAdminServices.dashboard,
        ...overrides.adminServices?.dashboard,
      },
      resourceLibrary: {
        documents: {
          ...failingAdminServices.resourceLibrary.documents,
          ...overrides.adminServices?.resourceLibrary?.documents,
        },
        search: {
          ...failingAdminServices.resourceLibrary.search,
          ...overrides.adminServices?.resourceLibrary?.search,
        },
        tree: {
          ...failingAdminServices.resourceLibrary.tree,
          ...overrides.adminServices?.resourceLibrary?.tree,
        },
      },
      settings: {
        ...failingAdminServices.settings,
        ...overrides.adminServices?.settings,
      },
      users: {
        ...failingAdminServices.users,
        ...overrides.adminServices?.users,
      },
    },
    adminOrigin: overrides.adminOrigin ?? localRuntimeDefaults.adminWebOrigin,
    now: overrides.now ?? (() => testAdminNow),
    resourceCollaborationRooms:
      overrides.resourceCollaborationRooms ??
      createTestResourceCollaborationRooms(),
    resourceEvents: overrides.resourceEvents ?? {
      countActiveEditors: () => 0,
      publish() {},
      publishDocumentInvalidated() {},
    },
    sessionResolver:
      overrides.sessionResolver ?? createTestAdminSessionResolver(),
  }
}

export function createTestAdminSessionResolver({
  activeToken = "admin-token",
  session = testAdminSession,
}: {
  readonly activeToken?: string
  readonly session?: AdminAuthenticatedSession
} = {}): AdminSessionResolver {
  return {
    async resolveSession(headers) {
      const token = readTestAdminSessionToken(headers)

      return token === activeToken ? session : null
    },
  }
}

function readTestAdminSessionToken(headers: Headers): string | null {
  const cookieToken = headers
    .get("Cookie")
    ?.split(";")
    .map((cookie) => cookie.trim().split("="))
    .find(([name]) => name === "admin_session_token")?.[1]

  if (cookieToken !== undefined) {
    return decodeURIComponent(cookieToken)
  }

  return readBearerToken(headers.get("Authorization"))
}

function createFailingAdminApiServices(): AdminApiServices {
  return {
    aiChat: {
      async createAiChatUserMessage() {
        throwUnexpectedAdminServiceCall("aiChat.createAiChatUserMessage")
      },
      async getAiChatConversation() {
        throwUnexpectedAdminServiceCall("aiChat.getAiChatConversation")
      },
      async getAiChatConversations() {
        throwUnexpectedAdminServiceCall("aiChat.getAiChatConversations")
      },
      async saveAiChatAssistantMessage() {
        throwUnexpectedAdminServiceCall("aiChat.saveAiChatAssistantMessage")
      },
    },
    analytics: {
      async getAnalytics() {
        throwUnexpectedAdminServiceCall("analytics.getAnalytics")
      },
      async getLessonAnalytics() {
        throwUnexpectedAdminServiceCall("analytics.getLessonAnalytics")
      },
    },
    contentReset: {
      async resetContent() {
        throwUnexpectedAdminServiceCall("contentReset.resetContent")
      },
    },
    courses: {
      async archiveCourse() {
        throwUnexpectedAdminServiceCall("courses.archiveCourse")
      },
      async createCourse() {
        throwUnexpectedAdminServiceCall("courses.createCourse")
      },
      async getCourseEditor() {
        throwUnexpectedAdminServiceCall("courses.getCourseEditor")
      },
      async getCourses() {
        throwUnexpectedAdminServiceCall("courses.getCourses")
      },
    },
    dashboard: {
      async getDashboard() {
        throwUnexpectedAdminServiceCall("dashboard.getDashboard")
      },
    },
    resourceLibrary: {
      documents: {
        async exportDocument() {
          throwUnexpectedAdminServiceCall(
            "resourceLibrary.documents.exportDocument"
          )
        },
        async getDocument() {
          throwUnexpectedAdminServiceCall(
            "resourceLibrary.documents.getDocument"
          )
        },
        async importDocument() {
          throwUnexpectedAdminServiceCall(
            "resourceLibrary.documents.importDocument"
          )
        },
      },
      search: {
        async search() {
          throwUnexpectedAdminServiceCall("resourceLibrary.search.search")
        },
      },
      tree: {
        async createDocument() {
          throwUnexpectedAdminServiceCall("resourceLibrary.tree.createDocument")
        },
        async createFolder() {
          throwUnexpectedAdminServiceCall("resourceLibrary.tree.createFolder")
        },
        async getTree() {
          throwUnexpectedAdminServiceCall("resourceLibrary.tree.getTree")
        },
        async getSubtreeDocumentIds() {
          throwUnexpectedAdminServiceCall(
            "resourceLibrary.tree.getSubtreeDocumentIds"
          )
        },
        async moveNode() {
          throwUnexpectedAdminServiceCall("resourceLibrary.tree.moveNode")
        },
        async renameNode() {
          throwUnexpectedAdminServiceCall("resourceLibrary.tree.renameNode")
        },
        async restoreNode() {
          throwUnexpectedAdminServiceCall("resourceLibrary.tree.restoreNode")
        },
        async trashNode() {
          throwUnexpectedAdminServiceCall("resourceLibrary.tree.trashNode")
        },
      },
    },
    settings: {
      async getSettings() {
        throwUnexpectedAdminServiceCall("settings.getSettings")
      },
      async updateLegalSettings() {
        throwUnexpectedAdminServiceCall("settings.updateLegalSettings")
      },
      async updateNoticeSettings() {
        throwUnexpectedAdminServiceCall("settings.updateNoticeSettings")
      },
    },
    users: {
      async deleteUser() {
        throwUnexpectedAdminServiceCall("users.deleteUser")
      },
      async getUser() {
        throwUnexpectedAdminServiceCall("users.getUser")
      },
      async getUsers() {
        throwUnexpectedAdminServiceCall("users.getUsers")
      },
      async updateUserStatus() {
        throwUnexpectedAdminServiceCall("users.updateUserStatus")
      },
    },
  }
}

function createTestResourceCollaborationRooms(): ResourceCollaborationRooms {
  return {
    close() {
      return 0
    },
    countActiveEditors() {
      return 0
    },
    async flushDocument() {
      return "ok"
    },
    async lockDocuments() {
      return { kind: "ok", lock: { documentIds: [] } }
    },
    release() {},
  }
}

function throwUnexpectedAdminServiceCall(methodName: string): never {
  throw new Error(`Unexpected admin service call: ${methodName}`)
}
