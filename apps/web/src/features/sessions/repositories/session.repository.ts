import type { ApiClient, paths } from "@workspace/api-client"

import {
  unwrapApiResult,
  unwrapRequiredApiResult,
} from "@/foundation/api/result"

type SessionRuntime =
  paths["/sessions/{sessionId}"]["get"]["responses"][200]["content"]["application/json"]
type SubmitStepBody =
  paths["/sessions/{sessionId}/steps/{stepOrder}/submit"]["post"]["requestBody"]["content"]["application/json"]

export async function fetchSessionDetail(
  client: ApiClient,
  sessionId: number
): Promise<SessionRuntime> {
  return unwrapRequiredApiResult(
    await client.GET("/sessions/{sessionId}", {
      params: { path: { sessionId } },
    }),
    "세션 런타임 응답이 비어 있습니다."
  )
}

export async function startSession(
  client: ApiClient,
  sessionId: number
): Promise<SessionRuntime> {
  return unwrapRequiredApiResult(
    await client.POST("/sessions/{sessionId}/start", {
      params: { path: { sessionId } },
    }),
    "세션 시작 응답이 비어 있습니다."
  )
}

export async function submitSessionStep(
  client: ApiClient,
  input: {
    sessionId: number
    stepOrder: number
    response?: SubmitStepBody["response"]
  }
): Promise<SessionRuntime> {
  return unwrapRequiredApiResult(
    await client.POST("/sessions/{sessionId}/steps/{stepOrder}/submit", {
      params: {
        path: {
          sessionId: input.sessionId,
          stepOrder: input.stepOrder,
        },
      },
      body:
        input.response === undefined
          ? {}
          : {
              response: input.response,
            },
    }),
    "스텝 제출 응답이 비어 있습니다."
  )
}

export async function retrySessionStepAi(
  client: ApiClient,
  input: {
    sessionId: number
    stepOrder: number
  }
): Promise<SessionRuntime> {
  return unwrapRequiredApiResult(
    await client.POST("/sessions/{sessionId}/steps/{stepOrder}/retry", {
      params: {
        path: {
          sessionId: input.sessionId,
          stepOrder: input.stepOrder,
        },
      },
    }),
    "AI 재시도 응답이 비어 있습니다."
  )
}

export async function completeSession(
  client: ApiClient,
  input: {
    sessionId: number
    journeyId: number
    nextSessionOrder: number
    totalSessions: number
  }
) {
  unwrapApiResult(
    await client.POST("/sessions/{sessionId}/complete", {
      params: { path: { sessionId: input.sessionId } },
      body: {
        journeyId: input.journeyId,
        nextSessionOrder: input.nextSessionOrder,
        totalSessions: input.totalSessions,
      },
    })
  )
}
