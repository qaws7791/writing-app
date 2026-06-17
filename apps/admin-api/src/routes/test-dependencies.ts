import type { AdminApiDependencies } from "@/app"
import type {
  AdminAuthenticatedSession,
  AdminSessionResolver,
} from "@/auth/admin-session"
import { adminRoles, type AdminService } from "@workspace/core/admin"
import { readBearerToken } from "@workspace/core/auth"
import { localRuntimeDefaults } from "@workspace/env"

type TestAdminApiDependencyOverrides = {
  readonly adminOrigin?: string
  readonly dashboardService?: Partial<AdminService>
  readonly now?: () => Date
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
  return {
    adminOrigin: overrides.adminOrigin ?? localRuntimeDefaults.adminWebOrigin,
    dashboardService: {
      ...createFailingAdminService(),
      ...overrides.dashboardService,
    },
    now: overrides.now ?? (() => testAdminNow),
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

function createFailingAdminService(): AdminService {
  return {
    async archiveCourse() {
      throwUnexpectedAdminServiceCall("archiveCourse")
    },
    async createCourse() {
      throwUnexpectedAdminServiceCall("createCourse")
    },
    async deleteUser() {
      throwUnexpectedAdminServiceCall("deleteUser")
    },
    async getAnalytics() {
      throwUnexpectedAdminServiceCall("getAnalytics")
    },
    async getCourseEditor() {
      throwUnexpectedAdminServiceCall("getCourseEditor")
    },
    async getCourses() {
      throwUnexpectedAdminServiceCall("getCourses")
    },
    async getDashboard() {
      throwUnexpectedAdminServiceCall("getDashboard")
    },
    async getLessonAnalytics() {
      throwUnexpectedAdminServiceCall("getLessonAnalytics")
    },
    async getSettings() {
      throwUnexpectedAdminServiceCall("getSettings")
    },
    async getUser() {
      throwUnexpectedAdminServiceCall("getUser")
    },
    async getUsers() {
      throwUnexpectedAdminServiceCall("getUsers")
    },
    async resetContent() {
      throwUnexpectedAdminServiceCall("resetContent")
    },
    async updateLegalSettings() {
      throwUnexpectedAdminServiceCall("updateLegalSettings")
    },
    async updateNoticeSettings() {
      throwUnexpectedAdminServiceCall("updateNoticeSettings")
    },
    async updateUserStatus() {
      throwUnexpectedAdminServiceCall("updateUserStatus")
    },
  }
}

function throwUnexpectedAdminServiceCall(
  methodName: keyof AdminService
): never {
  throw new Error(`Unexpected admin service call: ${methodName}`)
}
