import { describe, expect, it } from "vitest"
import { adminSessionCookieName } from "@workspace/contracts/auth-session-cookie"

import {
  adminTargetContractProtocolVersion,
  type AdminTargetContractRunInput,
  type AdminTargetContractSemanticObservation,
} from "@/test-support/admin-target-contract"
import {
  assertAdminTargetContract,
  type AdminTargetContractEvidence,
} from "@/test-support/admin-target-contract-harness"

const adminCookie = `${adminSessionCookieName}=admin-token`

const adminDashboardAnalyticsTargetContractInput = {
  cases: [
    {
      id: "dashboard-anonymous",
      request: { method: "GET", path: "/dashboard" },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "dashboard-owner",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/dashboard",
      },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "dashboard-operator",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/dashboard",
      },
      responseBody: "json",
      scenario: "operator",
    },
    {
      id: "analytics-default-query",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/analytics",
      },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "analytics-explicit-days",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/analytics?days=2",
      },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "analytics-days-above-limit",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/analytics?days=366",
      },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "lesson-analytics-default-query",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/analytics/lessons",
      },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "lesson-analytics-filter-pagination",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/analytics/lessons?page=1&pageSize=10&query=%EB%91%98%EC%A7%B8&sort=completionRate&direction=asc",
      },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "lesson-analytics-invalid-direction",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/analytics/lessons?direction=sideways",
      },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "lesson-analytics-page-size-above-limit",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/analytics/lessons?pageSize=101",
      },
      responseBody: "json",
      scenario: "default",
    },
    {
      id: "dashboard-invalid-read-side-result",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/dashboard",
      },
      responseBody: "json",
      scenario: "invalid-dashboard",
    },
    {
      id: "analytics-invalid-read-side-result",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/analytics",
      },
      responseBody: "json",
      scenario: "invalid-analytics",
    },
    {
      id: "lesson-analytics-invalid-read-side-result",
      request: {
        headers: [["Cookie", adminCookie]],
        method: "GET",
        path: "/analytics/lessons",
      },
      responseBody: "json",
      scenario: "invalid-lesson-analytics",
    },
    {
      id: "dashboard-analytics-openapi",
      openApiProjection: {
        components: [
          {
            names: ["adminSessionCookie"],
            section: "securitySchemes",
          },
        ],
        paths: ["/analytics", "/analytics/lessons", "/dashboard"],
      },
      request: { method: "GET", path: "/openapi" },
      responseBody: "openapi",
      scenario: "default",
    },
  ],
  protocolVersion: adminTargetContractProtocolVersion,
  suite: "admin-dashboard-analytics",
} as const satisfies AdminTargetContractRunInput

describe("관리자 dashboard·analytics의 통합 runtime target 계약", () => {
  it("조회, pagination·정렬 validation, 권한, OpenAPI, schema redaction을 workspace 격리 상태에서 보존한다", async () => {
    const evidence = await assertAdminTargetContract(
      adminDashboardAnalyticsTargetContractInput
    )

    expect(evidence.caseCount).toBe(
      adminDashboardAnalyticsTargetContractInput.cases.length
    )
    expect(readObservation(evidence, "dashboard-anonymous")).toMatchObject({
      body: {
        kind: "json",
        value: { code: "UNAUTHORIZED", message: "Unauthorized" },
      },
      effectJournal: [],
      status: 401,
    })
    expect(readObservation(evidence, "dashboard-owner")).toMatchObject({
      body: {
        kind: "json",
        value: {
          metrics: {
            activeCourses: 1,
            activeLessons: 2,
            activeUsersLast7Days: 3,
            completedLessons: 4,
            signupsLast7Days: 5,
            signupsToday: 1,
            totalUsers: 6,
          },
        },
      },
      effectJournal: [
        {
          effect: "dashboard.read",
          input: { now: "2026-06-14T03:00:00.000Z" },
          sequence: 1,
        },
      ],
      headers: { "cache-control": ["private, no-store"] },
      status: 200,
    })
    expect(readObservation(evidence, "analytics-default-query")).toMatchObject({
      effectJournal: [
        {
          effect: "analytics.read",
          input: { days: 30, now: "2026-06-14T03:00:00.000Z" },
          sequence: 1,
        },
      ],
      status: 200,
    })
    expect(readObservation(evidence, "analytics-explicit-days")).toMatchObject({
      effectJournal: [
        {
          effect: "analytics.read",
          input: { days: 2, now: "2026-06-14T03:00:00.000Z" },
          sequence: 1,
        },
      ],
      status: 200,
    })
    expect(
      readObservation(evidence, "lesson-analytics-filter-pagination")
    ).toMatchObject({
      effectJournal: [
        {
          effect: "analytics.lessons.read",
          input: {
            direction: "asc",
            page: 1,
            pageSize: 10,
            query: "둘째",
            sort: "completionRate",
          },
          sequence: 1,
        },
      ],
      status: 200,
    })
    for (const id of [
      "analytics-days-above-limit",
      "lesson-analytics-invalid-direction",
      "lesson-analytics-page-size-above-limit",
    ]) {
      expect(readObservation(evidence, id)).toMatchObject({
        body: {
          kind: "json",
          value: {
            code: "VALIDATION_FAILED",
            message: "Request validation failed",
          },
        },
        effectJournal: [],
        status: 400,
      })
    }
    for (const id of [
      "dashboard-invalid-read-side-result",
      "analytics-invalid-read-side-result",
      "lesson-analytics-invalid-read-side-result",
    ]) {
      expect(readObservation(evidence, id)).toMatchObject({
        body: {
          kind: "json",
          value: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Internal Server Error",
          },
        },
        status: 500,
      })
    }
  }, 15_000)
})

function readObservation(
  evidence: AdminTargetContractEvidence,
  id: string
): AdminTargetContractSemanticObservation {
  const observation = evidence.target.observations.find(
    (candidate) => candidate.id === id
  )

  if (observation === undefined) {
    throw new Error(`target contract 관찰값을 찾을 수 없습니다: ${id}`)
  }

  return observation
}
