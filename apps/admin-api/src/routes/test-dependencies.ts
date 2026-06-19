import type { AdminApiDependencies, AdminApiServices } from "@/app"
import type {
  AdminAuthenticatedSession,
  AdminSessionResolver,
} from "@/auth/admin-session"
import { adminRoles } from "@workspace/core/admin"
import { readBearerToken } from "@workspace/core/auth"
import { localRuntimeDefaults } from "@workspace/env"

type TestAdminApiServicesOverrides = {
  readonly [TKey in keyof AdminApiServices]?: Partial<AdminApiServices[TKey]>
}

type TestAdminApiDependencyOverrides = {
  readonly adminOrigin?: string
  readonly adminServices?: TestAdminApiServicesOverrides
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
  const failingAdminServices = createFailingAdminApiServices()

  return {
    adminServices: {
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

function throwUnexpectedAdminServiceCall(methodName: string): never {
  throw new Error(`Unexpected admin service call: ${methodName}`)
}
