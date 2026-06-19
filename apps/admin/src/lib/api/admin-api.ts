import type { AdminApiResult } from "@/lib/api/api-result"

export type AdminCourseStatus = "active" | "archived"
export type AdminCourseStatusFilter = "all" | AdminCourseStatus
export type AdminLessonAnalyticsSort =
  | "completionRate"
  | "course"
  | "dropOff"
  | "lesson"
export type AdminSortDirection = "asc" | "desc"
export type AdminUserOperationalStatus = "active" | "suspended"
export type AdminUserSort = "joined" | "lastActive" | "lessonsDone" | "streak"
export type AdminUserStatus = AdminUserOperationalStatus | "deleted"
export type AdminUserListStatusFilter = "all" | AdminUserStatus

export type AdminPagination = {
  readonly page: number
  readonly pageSize: number
  readonly totalItems: number
  readonly totalPages: number
}

export type AdminDashboard = {
  readonly metrics: {
    readonly activeCourses: number
    readonly activeLessons: number
    readonly activeUsersLast7Days: number
    readonly completedLessons: number
    readonly signupsLast7Days: number
    readonly signupsToday: number
    readonly totalUsers: number
  }
  readonly recentActivities: readonly {
    readonly currentStreakDays: number
    readonly email: string
    readonly lastActiveDate: string | null
    readonly name: string
    readonly userId: string
  }[]
}

export type AdminUserListItem = {
  readonly email: string
  readonly id: string
  readonly joined: string
  readonly lastActive: string | null
  readonly lessonsDone: number
  readonly name: string
  readonly status: AdminUserStatus
  readonly streak: number
}

export type AdminUserList = {
  readonly items: readonly AdminUserListItem[]
  readonly pagination: AdminPagination
}

export type AdminUserDetail = AdminUserListItem & {
  readonly progressPercent: number
  readonly totalLessons: number
}

export type AdminDeleteUserResult = {
  readonly deleted: true
}

export type AdminLessonAnalyticsItem = {
  readonly completed: number
  readonly completionRate: number
  readonly courseId: string
  readonly courseTitle: string
  readonly dropOffRate: number
  readonly lessonId: string
  readonly lessonTitle: string
  readonly started: number
}

export type AdminAnalytics = {
  readonly dailySeries: readonly {
    readonly completions: number
    readonly date: string
    readonly signups: number
  }[]
  readonly streakBuckets: readonly {
    readonly count: number
    readonly label: string
  }[]
  readonly worstLessons: readonly AdminLessonAnalyticsItem[]
}

export type AdminLessonAnalyticsPage = {
  readonly items: readonly AdminLessonAnalyticsItem[]
  readonly pagination: AdminPagination
}

export type AdminNoticeSettingsRequest = {
  readonly announce: string
  readonly banner: string
}

export type AdminLegalSettingsRequest = {
  readonly privacy: string
  readonly terms: string
}

export type AdminSettings = {
  readonly legal: AdminLegalSettingsRequest
  readonly notice: AdminNoticeSettingsRequest
}

export type AdminContentResetResult = {
  readonly changed: {
    readonly archived: number
    readonly courses: number
    readonly lessons: number
    readonly steps: number
    readonly units: number
  }
  readonly revision: number
}

export type AdminCourseStep = {
  readonly contentJson: string
  readonly id: string
  readonly sortOrder: number
  readonly status: AdminCourseStatus
  readonly type: string
}

export type AdminCourseLesson = {
  readonly category: string | null
  readonly description: string | null
  readonly estimatedMinutes: number
  readonly id: string
  readonly sortOrder: number
  readonly status: AdminCourseStatus
  readonly summary: readonly string[]
  readonly steps: readonly AdminCourseStep[]
  readonly title: string
}

export type AdminCourseUnit = {
  readonly id: string
  readonly lessons: readonly AdminCourseLesson[]
  readonly sortOrder: number
  readonly status: AdminCourseStatus
  readonly title: string
}

export type AdminCourseDetail = {
  readonly category: string
  readonly description: string
  readonly id: string
  readonly revision: number
  readonly status: AdminCourseStatus
  readonly title: string
  readonly units: readonly AdminCourseUnit[]
}

export type AdminArchiveCourseResult = {
  readonly archived: true
}

export type AdminCourseListItem = {
  readonly category: string
  readonly id: string
  readonly lessonCount: number
  readonly revision: number
  readonly status: AdminCourseStatus
  readonly title: string
  readonly unitCount: number
}

export type AdminCourseList = {
  readonly items: readonly AdminCourseListItem[]
  readonly pagination: AdminPagination
}

export type ReadAdminCoursesInput = {
  readonly category: string
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly status: AdminCourseStatusFilter
}

export type ReadAdminUsersInput = {
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly sort: AdminUserSort
  readonly status: AdminUserListStatusFilter
}

export type ReadAdminAnalyticsInput = {
  readonly days: number
}

export type ReadAdminLessonAnalyticsInput = {
  readonly direction: AdminSortDirection
  readonly page: number
  readonly pageSize: number
  readonly query: string
  readonly sort: AdminLessonAnalyticsSort
}

export type UpdateAdminUserStatusInput = {
  readonly status: AdminUserOperationalStatus
  readonly userId: string
}

export type AdminApi = {
  readonly archiveCourse: (
    courseId: string
  ) => Promise<AdminApiResult<AdminArchiveCourseResult>>
  readonly createCourse: () => Promise<AdminApiResult<AdminCourseDetail>>
  readonly deleteUser: (
    userId: string
  ) => Promise<AdminApiResult<AdminDeleteUserResult>>
  readonly getAnalytics: (
    input: ReadAdminAnalyticsInput
  ) => Promise<AdminApiResult<AdminAnalytics>>
  readonly getCourses: (
    input: ReadAdminCoursesInput
  ) => Promise<AdminApiResult<AdminCourseList>>
  readonly getCourseEditor: (
    courseId: string
  ) => Promise<AdminApiResult<AdminCourseDetail>>
  readonly getDashboard: () => Promise<AdminApiResult<AdminDashboard>>
  readonly getLessonAnalytics: (
    input: ReadAdminLessonAnalyticsInput
  ) => Promise<AdminApiResult<AdminLessonAnalyticsPage>>
  readonly getSettings: () => Promise<AdminApiResult<AdminSettings>>
  readonly getUser: (userId: string) => Promise<AdminApiResult<AdminUserDetail>>
  readonly getUsers: (
    input: ReadAdminUsersInput
  ) => Promise<AdminApiResult<AdminUserList>>
  readonly resetContent: () => Promise<AdminApiResult<AdminContentResetResult>>
  readonly saveLegalSettings: (
    input: AdminLegalSettingsRequest
  ) => Promise<AdminApiResult<AdminSettings>>
  readonly saveNoticeSettings: (
    input: AdminNoticeSettingsRequest
  ) => Promise<AdminApiResult<AdminSettings>>
  readonly updateUserStatus: (
    input: UpdateAdminUserStatusInput
  ) => Promise<AdminApiResult<AdminUserDetail>>
}
