import { describe, expect, it, vi } from "vitest"

import { createApp } from "@/app"
import {
  createTestDependencies,
  testCourseDetail,
} from "@/routes/test-dependencies"

const authenticatedHeaders = {
  Cookie: "learner_session_token=active-token",
}

describe("플랫폼 API courses route", () => {
  it("인증된 사용자가 cursor page 형식으로 course 목록을 조회한다", async () => {
    const app = createApp(createTestDependencies())

    const response = await app.request("/courses", {
      headers: authenticatedHeaders,
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      items: [
        {
          id: "c1",
          lessonCount: 3,
          title: "글쓰기 첫걸음 30일",
          version: {
            curriculumVersionId: "c1-v1",
            revision: 1,
          },
          visualKey: "basic-sentence-writing",
        },
      ],
      nextCursor: null,
    })
  })

  it("검색·분류·정렬·limit query를 content service에 전달한다", async () => {
    const dependencies = createTestDependencies()
    const listCourses = vi.fn(dependencies.contentService.listCourses)
    const app = createApp({
      ...dependencies,
      contentService: { ...dependencies.contentService, listCourses },
    })

    const response = await app.request(
      "/courses?query=%EA%B8%80%EC%93%B0%EA%B8%B0&category=%EC%9E%85%EB%AC%B8%EC%9E%90%EB%A5%BC%20%EC%9C%84%ED%95%9C%20%EC%BD%94%EC%8A%A4&sort=title-asc&limit=10",
      { headers: authenticatedHeaders }
    )

    expect(response.status).toBe(200)
    expect(listCourses).toHaveBeenCalledWith({
      category: "입문자를 위한 코스",
      limit: 10,
      query: "글쓰기",
      sort: "title-asc",
    })
  })

  it("같은 조회 조건으로 서명한 cursor를 다음 위치로 전달한다", async () => {
    const dependencies = createTestDependencies()
    const nextPosition = { courseId: "c0", primary: "가나다" }
    const cursor = dependencies.learnerCursorCodec.encode({
      endpoint: "courses",
      fingerprint: dependencies.learnerCursorCodec.createFingerprint({
        category: undefined,
        query: undefined,
        sort: "title-asc",
      }),
      position: nextPosition,
    })
    const listCourses = vi.fn(dependencies.contentService.listCourses)
    const app = createApp({
      ...dependencies,
      contentService: { ...dependencies.contentService, listCourses },
    })

    const response = await app.request(
      `/courses?sort=title-asc&cursor=${encodeURIComponent(cursor)}&limit=10`,
      { headers: authenticatedHeaders }
    )

    expect(response.status).toBe(200)
    expect(listCourses).toHaveBeenCalledWith({
      after: nextPosition,
      limit: 10,
      sort: "title-asc",
    })
  })

  it("유효하지 않은 cursor는 400 INVALID_CURSOR로 반환한다", async () => {
    const dependencies = createTestDependencies()
    const listCourses = vi.fn(dependencies.contentService.listCourses)
    const app = createApp({
      ...dependencies,
      contentService: { ...dependencies.contentService, listCourses },
    })

    const response = await app.request("/courses?cursor=invalid", {
      headers: authenticatedHeaders,
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: "INVALID_CURSOR",
    })
    expect(listCourses).not.toHaveBeenCalled()
  })

  it("인증된 사용자가 정규화된 course category 목록을 조회한다", async () => {
    const app = createApp(createTestDependencies())

    const response = await app.request("/course-categories", {
      headers: authenticatedHeaders,
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(["입문자를 위한 코스"])
  })

  it("인증된 사용자가 학습 상태가 포함된 course 상세를 조회한다", async () => {
    const app = createApp(createTestDependencies())

    const response = await app.request("/courses/c1", {
      headers: authenticatedHeaders,
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      id: "c1",
      learning: {
        completedLessons: 0,
        progressPercent: 0,
        status: "not_started",
      },
      units: [
        {
          id: "u1",
          lessons: [
            {
              id: "l1",
              learning: { status: "not_started" },
            },
          ],
        },
      ],
    })
  })

  it("완료한 course 상세는 nextLesson을 null로 반환한다", async () => {
    const dependencies = createTestDependencies()
    const completedDetail = {
      ...testCourseDetail,
      learning: {
        completedAt: "2026-06-14T00:00:00.000Z",
        completedLessons: 3,
        lastActivityAt: "2026-06-14T00:00:00.000Z",
        nextLesson: null,
        progressPercent: 100 as const,
        status: "completed" as const,
        totalLessons: 3,
        version: testCourseDetail.version,
      },
    }
    const app = createApp({
      ...dependencies,
      contentService: {
        ...dependencies.contentService,
        async getCourseDetail() {
          return { kind: "ok" as const, value: completedDetail }
        },
      },
    })

    const response = await app.request("/courses/c1", {
      headers: authenticatedHeaders,
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      learning: {
        completedLessons: 3,
        nextLesson: null,
        progressPercent: 100,
        status: "completed",
      },
    })
  })

  it("응답 계약 위반은 본문을 노출하지 않고 redacted event를 남긴다", async () => {
    const dependencies = createTestDependencies()
    const contractEvents: unknown[] = []
    const app = createApp({
      ...dependencies,
      contentService: {
        ...dependencies.contentService,
        async listCourses() {
          return {
            items: [
              {
                ...testCourseDetail,
                internalSolution: "노출되면 안 되는 값",
              },
            ],
            nextPosition: null,
          }
        },
      },
      contractErrorLogger(event) {
        contractEvents.push(event)
      },
      deploymentVersion: "test-deployment",
      requestLoggingRuntime: {
        createRequestId: () => "request-contract-failure",
        readMonotonicTimeMs: () => 0,
      },
    })

    const response = await app.request("/courses", {
      headers: authenticatedHeaders,
    })

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      code: "INTERNAL_SERVER_ERROR",
      message: "서버 오류가 발생했습니다.",
      requestId: "request-contract-failure",
    })
    expect(contractEvents).toEqual([
      {
        classification: "response-schema-invalid",
        contractName: "LearnerCourseListResponse",
        deploymentVersion: "test-deployment",
        event: "api.contract.response_invalid",
        fieldPaths: ["items.0"],
        method: "GET",
        requestId: "request-contract-failure",
        route: "/courses",
      },
    ])
    expect(JSON.stringify(contractEvents)).not.toContain("노출되면 안 되는 값")
  })
})
