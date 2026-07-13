import { describe, expect, it } from "vitest"

import type {
  AdminAiChatConversationDetailDto,
  AdminAiChatConversationListDto,
  AdminAiChatMessageDto,
  AdminAnalyticsDto,
  AdminArchiveCourseResultDto,
  AdminCourseListDto,
  AdminCourseDetailDto,
  AdminCourseEditorDocument,
  AdminContentResetResultDto,
  AdminDashboardDto,
  AdminLessonAnalyticsPageDto,
  AdminSettingsDto,
  AdminUserDetailDto,
  AdminUserListDto,
} from "#core/modules/admin/domain/admin.dto"
import {
  createAdminService,
  type AdminServicePorts,
} from "#core/modules/admin/application/use-cases/admin.service"
import {
  adminIdSchema,
  conversationIdSchema,
  userIdSchema,
} from "@workspace/contracts/admin"
import { adminCourseEditorDocumentSchema } from "@workspace/contracts/admin"

const adminId = adminIdSchema.parse("admin-1")
const chatId = conversationIdSchema.parse("chat-1")
const userId = userIdSchema.parse("user-1")

const dashboard: AdminDashboardDto = {
  metrics: {
    activeCourses: 5,
    activeLessons: 44,
    activeUsersLast7Days: 2,
    completedLessons: 3,
    signupsLast7Days: 2,
    signupsToday: 1,
    totalUsers: 3,
  },
  recentActivities: [
    {
      currentStreakDays: 3,
      email: "learner@example.com",
      lastActiveDate: "2026-06-14",
      name: "학습자",
      userId,
    },
  ],
}

const userList: AdminUserListDto = {
  items: [
    {
      email: "learner@example.com",
      id: userId,
      joined: "2026-06-01",
      lastActive: "2026-06-14",
      lessonsDone: 3,
      name: "학습자",
      status: "active",
      streak: 2,
    },
  ],
  pagination: {
    page: 1,
    pageSize: 20,
    totalItems: 1,
    totalPages: 1,
  },
}

const userDetail: AdminUserDetailDto = {
  email: "learner@example.com",
  id: userId,
  joined: "2026-06-01",
  lastActive: "2026-06-14",
  lessonsDone: 3,
  name: "학습자",
  progressPercent: 30,
  status: "active",
  streak: 2,
  totalLessons: 10,
}

const analytics: AdminAnalyticsDto = {
  dailySeries: [
    {
      completions: 1,
      date: "2026-06-13",
      signups: 0,
    },
    {
      completions: 2,
      date: "2026-06-14",
      signups: 1,
    },
  ],
  streakBuckets: [
    {
      count: 1,
      label: "0일",
    },
    {
      count: 2,
      label: "1-3일",
    },
    {
      count: 0,
      label: "4-7일",
    },
    {
      count: 0,
      label: "8-14일",
    },
    {
      count: 0,
      label: "15일+",
    },
  ],
  worstLessons: [
    {
      completed: 1,
      completionRate: 50,
      courseId: "course-1",
      courseTitle: "활성 코스",
      dropOffRate: 50,
      lessonId: "lesson-2",
      lessonTitle: "둘째 레슨",
      started: 2,
    },
  ],
}

const lessonAnalytics: AdminLessonAnalyticsPageDto = {
  items: [
    {
      completed: 1,
      completionRate: 50,
      courseId: "course-1",
      courseTitle: "활성 코스",
      dropOffRate: 50,
      lessonId: "lesson-2",
      lessonTitle: "둘째 레슨",
      started: 2,
    },
  ],
  pagination: {
    page: 1,
    pageSize: 10,
    totalItems: 1,
    totalPages: 1,
  },
}

const settings: AdminSettingsDto = {
  legal: {
    privacy: "개인정보처리방침",
    terms: "이용약관",
  },
  notice: {
    announce: "공지 내용",
    banner: "새 강의가 추가되었어요!",
  },
}

const contentResetResult: AdminContentResetResultDto = {
  changed: {
    archived: 0,
    courses: 5,
    lessons: 44,
    steps: 136,
    units: 15,
  },
  revision: 1,
}

const aiChatUserMessage: AdminAiChatMessageDto = {
  content: "강의 소개 문구를 써줘",
  createdAt: "2026-06-14T03:00:00.000Z",
  id: "message-1",
  role: "user",
}

const aiChatAssistantMessage: AdminAiChatMessageDto = {
  content: "학습자의 목표를 먼저 보여주는 문구를 제안합니다.",
  createdAt: "2026-06-14T03:01:00.000Z",
  id: "message-2",
  role: "assistant",
}

const aiChatConversationDetail: AdminAiChatConversationDetailDto = {
  conversation: {
    createdAt: "2026-06-14T03:00:00.000Z",
    id: chatId,
    messageCount: 2,
    title: "강의 소개 문구",
    updatedAt: "2026-06-14T03:01:00.000Z",
  },
  messages: [aiChatUserMessage, aiChatAssistantMessage],
}

const aiChatConversationList: AdminAiChatConversationListDto = {
  items: [aiChatConversationDetail.conversation],
}

const courseDetail: AdminCourseDetailDto = {
  category: "미분류",
  description: "강의 설명을 입력하세요.",
  id: "cmock",
  revision: 1,
  status: "active",
  title: "새 강의",
  units: [
    {
      id: "cmock-u1",
      lessons: [
        {
          category: "미분류",
          description: "레슨 설명을 입력하세요.",
          estimatedMinutes: 5,
          id: "cmock-l1",
          sortOrder: 1,
          status: "active",
          summary: [],
          steps: [
            {
              contentJson: JSON.stringify({
                body: "본문을 입력하세요.",
                title: "새 읽기 스텝",
                type: "reading",
              }),
              id: "cmock-l1-s1",
              sortOrder: 1,
              status: "active",
              type: "READING",
            },
            {
              contentJson: JSON.stringify({
                goal: 150,
                max: 500,
                min: 50,
                prompt: "주제를 입력하세요.",
                title: "글쓰기",
                type: "write",
              }),
              id: "cmock-l1-s2",
              sortOrder: 2,
              status: "active",
              type: "WRITE",
            },
          ],
          title: "새 레슨",
        },
      ],
      sortOrder: 1,
      status: "active",
      title: "새 유닛",
    },
  ],
}

const courseEditor: AdminCourseEditorDocument =
  adminCourseEditorDocumentSchema.parse({
    ...courseDetail,
    units: courseDetail.units.map((unit) => ({
      ...unit,
      lessons: unit.lessons.map((lesson) => ({
        ...lesson,
        steps: [
          {
            body: "본문을 입력하세요.",
            guide: "",
            id: "cmock-l1-s1",
            sortOrder: 1,
            status: "active",
            title: "새 읽기 스텝",
            type: "READING",
          },
          {
            goal: 150,
            id: "cmock-l1-s2",
            max: 500,
            min: 50,
            prompt: "주제를 입력하세요.",
            sortOrder: 2,
            status: "active",
            title: "글쓰기",
            type: "WRITE",
          },
        ],
      })),
    })),
  })

const archiveCourseResult: AdminArchiveCourseResultDto = {
  archived: true,
}

const courseList: AdminCourseListDto = {
  items: [
    {
      category: "입문자를 위한 코스",
      id: "c1",
      lessonCount: 10,
      revision: 2,
      status: "active",
      title: "글쓰기 첫걸음 30일",
      unitCount: 3,
      visualKey: "basic-sentence-writing",
    },
  ],
  pagination: {
    page: 1,
    pageSize: 20,
    totalItems: 1,
    totalPages: 1,
  },
}

describe("어드민 서비스", () => {
  const ownerActor = {
    id: adminIdSchema.parse("owner-1"),
    role: "owner",
  } as const
  const operatorActor = {
    id: adminIdSchema.parse("operator-1"),
    role: "operator",
  } as const

  it("repository 대시보드 스냅샷을 관리자 dashboard DTO로 반환한다", async () => {
    const service = createService({
      dashboardReader: {
        async readDashboard(input) {
          expect(input.now.toISOString()).toBe("2026-06-14T03:00:00.000Z")
          return dashboard
        },
      },
    })

    await expect(
      service.getDashboard({
        now: new Date("2026-06-14T03:00:00.000Z"),
      })
    ).resolves.toEqual(dashboard)
  })

  it("repository 사용자 목록과 상세, 상태 변경, 삭제 결과를 관리자 DTO로 반환한다", async () => {
    const service = createService({
      userRepository: {
        async deleteUser(input) {
          expect(input.userId).toBe("user-1")
          return { deleted: true }
        },
        async readUser(input) {
          expect(input.userId).toBe("user-1")
          return userDetail
        },
        async readUsers(input) {
          expect(input).toEqual({
            page: 1,
            pageSize: 20,
            query: "학습",
            sort: "lastActive",
            status: "all",
          })
          return userList
        },
        async updateUserStatus(input) {
          expect(input.status).toBe("suspended")
          expect(input.userId).toBe("user-1")
          return {
            ...userDetail,
            status: "suspended",
          }
        },
      },
    })

    await expect(
      service.getUsers({
        page: 1,
        pageSize: 20,
        query: "학습",
        sort: "lastActive",
        status: "all",
      })
    ).resolves.toEqual(userList)
    await expect(service.getUser({ userId })).resolves.toEqual(userDetail)
    await expect(
      service.updateUserStatus({
        actor: ownerActor,
        now: new Date("2026-06-14T03:00:00.000Z"),
        status: "suspended",
        userId,
      })
    ).resolves.toEqual({
      kind: "ok",
      value: { ...userDetail, status: "suspended" },
    })
    await expect(
      service.deleteUser({
        actor: ownerActor,
        now: new Date("2026-06-14T03:00:00.000Z"),
        userId,
      })
    ).resolves.toEqual({ kind: "ok", value: { deleted: true } })
  })

  it("repository 분석 스냅샷과 레슨 분석 페이지를 관리자 DTO로 반환한다", async () => {
    const service = createService({
      analyticsReader: {
        async readAnalytics(input) {
          expect(input).toEqual({
            days: 2,
            now: new Date("2026-06-14T03:00:00.000Z"),
          })
          return analytics
        },
        async readLessonAnalytics(input) {
          expect(input).toEqual({
            direction: "asc",
            page: 1,
            pageSize: 10,
            query: "둘째",
            sort: "completionRate",
          })
          return lessonAnalytics
        },
      },
    })

    await expect(
      service.getAnalytics({
        days: 2,
        now: new Date("2026-06-14T03:00:00.000Z"),
      })
    ).resolves.toEqual(analytics)
    await expect(
      service.getLessonAnalytics({
        direction: "asc",
        page: 1,
        pageSize: 10,
        query: "둘째",
        sort: "completionRate",
      })
    ).resolves.toEqual(lessonAnalytics)
  })

  it("repository AI 채팅 대화와 메시지 저장 결과를 관리자 DTO로 반환한다", async () => {
    const service = createService({
      aiChatRepository: {
        async createAiChatUserMessage(input) {
          expect(input).toEqual({
            adminId,
            conversationId: null,
            message: "강의 소개 문구를 써줘",
            now: new Date("2026-06-14T03:00:00.000Z"),
          })
          return aiChatConversationDetail
        },
        async readAiChatConversation(input) {
          expect(input).toEqual({
            adminId,
            conversationId: chatId,
            messagePage: 1,
            messagePageSize: 100,
          })
          return aiChatConversationDetail
        },
        async readAiChatConversations(input) {
          expect(input).toEqual({
            adminId,
            page: 1,
            pageSize: 50,
          })
          return aiChatConversationList
        },
        async saveAiChatAssistantMessage(input) {
          expect(input).toEqual({
            content: "학습자의 목표를 먼저 보여주는 문구를 제안합니다.",
            conversationId: chatId,
            now: new Date("2026-06-14T03:01:00.000Z"),
          })
          return aiChatAssistantMessage
        },
      },
    })

    await expect(
      service.getAiChatConversations({
        adminId,
        page: 1,
        pageSize: 50,
      })
    ).resolves.toEqual(aiChatConversationList)
    await expect(
      service.getAiChatConversation({
        adminId,
        conversationId: chatId,
        messagePage: 1,
        messagePageSize: 100,
      })
    ).resolves.toEqual(aiChatConversationDetail)
    await expect(
      service.createAiChatUserMessage({
        adminId,
        conversationId: null,
        message: "강의 소개 문구를 써줘",
        now: new Date("2026-06-14T03:00:00.000Z"),
      })
    ).resolves.toEqual(aiChatConversationDetail)
    await expect(
      service.saveAiChatAssistantMessage({
        content: "학습자의 목표를 먼저 보여주는 문구를 제안합니다.",
        conversationId: chatId,
        now: new Date("2026-06-14T03:01:00.000Z"),
      })
    ).resolves.toEqual(aiChatAssistantMessage)
  })

  it("repository 운영 설정 저장과 콘텐츠 초기화 결과를 관리자 DTO로 반환한다", async () => {
    const service = createService({
      contentResetRepository: {
        async resetContent(input) {
          expect(input.now.toISOString()).toBe("2026-06-14T03:00:00.000Z")
          return contentResetResult
        },
      },
      settingsRepository: {
        async readSettings() {
          return settings
        },
        async saveLegalSettings(input) {
          expect(input).toEqual({
            now: new Date("2026-06-14T03:00:00.000Z"),
            privacy: "개인정보처리방침",
            terms: "이용약관",
          })
          return settings
        },
        async saveNoticeSettings(input) {
          expect(input).toEqual({
            announce: "공지 내용",
            banner: "새 강의가 추가되었어요!",
            now: new Date("2026-06-14T03:00:00.000Z"),
          })
          return settings
        },
      },
    })

    await expect(service.getSettings()).resolves.toEqual(settings)
    await expect(
      service.updateNoticeSettings({
        actor: ownerActor,
        announce: "공지 내용",
        banner: "새 강의가 추가되었어요!",
        now: new Date("2026-06-14T03:00:00.000Z"),
      })
    ).resolves.toEqual({ kind: "ok", value: settings })
    await expect(
      service.updateLegalSettings({
        actor: ownerActor,
        now: new Date("2026-06-14T03:00:00.000Z"),
        privacy: "개인정보처리방침",
        terms: "이용약관",
      })
    ).resolves.toEqual({ kind: "ok", value: settings })
    await expect(
      service.resetContent({
        actor: ownerActor,
        now: new Date("2026-06-14T03:00:00.000Z"),
      })
    ).resolves.toEqual({ kind: "ok", value: contentResetResult })
  })

  it("repository 코스 목록, 생성, editor 조회, 보관 결과를 관리자 DTO로 반환한다", async () => {
    const service = createService({
      courseRepository: {
        async archiveCourse(input) {
          expect(input).toEqual({
            courseId: "cmock",
            now: new Date("2026-06-14T03:00:00.000Z"),
          })
          return archiveCourseResult
        },
        async createCourse(input) {
          expect(input.now.toISOString()).toBe("2026-06-14T03:00:00.000Z")
          return courseDetail
        },
        async readCourseEditor(input) {
          expect(input.courseId).toBe("cmock")
          return courseEditor
        },
        async readCourses(input) {
          expect(input).toEqual({
            category: "입문자를 위한 코스",
            page: 1,
            pageSize: 20,
            query: "글쓰기",
            status: "active",
          })
          return courseList
        },
        async saveCourseEditor() {
          return { kind: "ok", value: courseEditor }
        },
      },
    })

    await expect(
      service.getCourses({
        category: "입문자를 위한 코스",
        page: 1,
        pageSize: 20,
        query: "글쓰기",
        status: "active",
      })
    ).resolves.toEqual(courseList)
    await expect(
      service.createCourse({
        actor: ownerActor,
        now: new Date("2026-06-14T03:00:00.000Z"),
      })
    ).resolves.toEqual({ kind: "ok", value: courseDetail })
    await expect(
      service.getCourseEditor({
        courseId: "cmock",
      })
    ).resolves.toEqual(courseEditor)
    await expect(
      service.archiveCourse({
        actor: ownerActor,
        courseId: "cmock",
        now: new Date("2026-06-14T03:00:00.000Z"),
      })
    ).resolves.toEqual({ kind: "ok", value: archiveCourseResult })
  })

  it("operator의 owner 변경 직접 호출을 모두 거부한다", async () => {
    const service = createService({})
    const now = new Date("2026-06-14T03:00:00.000Z")

    await expect(
      Promise.all([
        service.createCourse({ actor: operatorActor, now }),
        service.archiveCourse({
          actor: operatorActor,
          courseId: "course-1",
          now,
        }),
        service.updateUserStatus({
          actor: operatorActor,
          now,
          status: "suspended",
          userId,
        }),
        service.deleteUser({ actor: operatorActor, now, userId }),
        service.updateNoticeSettings({
          actor: operatorActor,
          announce: "공지",
          banner: "배너",
          now,
        }),
        service.updateLegalSettings({
          actor: operatorActor,
          now,
          privacy: "개인정보처리방침",
          terms: "이용약관",
        }),
        service.resetContent({ actor: operatorActor, now }),
      ])
    ).resolves.toEqual(Array.from({ length: 7 }, () => ({ kind: "forbidden" })))
  })
})

function createService(overrides: Partial<AdminServicePorts>) {
  return createAdminService({
    ...createUnusedAdminServicePorts(),
    ...overrides,
  })
}

function createUnusedAdminServicePorts(): AdminServicePorts {
  return {
    aiChatRepository: {
      async createAiChatUserMessage() {
        return failUnexpectedPort("aiChatRepository.createAiChatUserMessage")
      },
      async readAiChatConversation() {
        return failUnexpectedPort("aiChatRepository.readAiChatConversation")
      },
      async readAiChatConversations() {
        return failUnexpectedPort("aiChatRepository.readAiChatConversations")
      },
      async saveAiChatAssistantMessage() {
        return failUnexpectedPort("aiChatRepository.saveAiChatAssistantMessage")
      },
    },
    analyticsReader: {
      async readAnalytics() {
        return failUnexpectedPort("analyticsReader.readAnalytics")
      },
      async readLessonAnalytics() {
        return failUnexpectedPort("analyticsReader.readLessonAnalytics")
      },
    },
    contentResetRepository: {
      async resetContent() {
        return failUnexpectedPort("contentResetRepository.resetContent")
      },
    },
    courseRepository: {
      async archiveCourse() {
        return failUnexpectedPort("courseRepository.archiveCourse")
      },
      async createCourse() {
        return failUnexpectedPort("courseRepository.createCourse")
      },
      async readCourseEditor() {
        return failUnexpectedPort("courseRepository.readCourseEditor")
      },
      async readCourses() {
        return failUnexpectedPort("courseRepository.readCourses")
      },
      async saveCourseEditor() {
        return failUnexpectedPort("courseRepository.saveCourseEditor")
      },
    },
    dashboardReader: {
      async readDashboard() {
        return failUnexpectedPort("dashboardReader.readDashboard")
      },
    },
    settingsRepository: {
      async readSettings() {
        return failUnexpectedPort("settingsRepository.readSettings")
      },
      async saveLegalSettings() {
        return failUnexpectedPort("settingsRepository.saveLegalSettings")
      },
      async saveNoticeSettings() {
        return failUnexpectedPort("settingsRepository.saveNoticeSettings")
      },
    },
    userRepository: {
      async deleteUser() {
        return failUnexpectedPort("userRepository.deleteUser")
      },
      async readUser() {
        return failUnexpectedPort("userRepository.readUser")
      },
      async readUsers() {
        return failUnexpectedPort("userRepository.readUsers")
      },
      async updateUserStatus() {
        return failUnexpectedPort("userRepository.updateUserStatus")
      },
    },
  }
}

function failUnexpectedPort(portName: string): never {
  throw new Error(
    `테스트에서 사용하지 않는 admin port가 호출되었습니다: ${portName}`
  )
}
