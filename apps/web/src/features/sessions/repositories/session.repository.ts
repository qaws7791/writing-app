import type { ApiClient, paths } from "@workspace/api-client"

type SessionRuntime =
  paths["/sessions/{sessionId}"]["get"]["responses"][200]["content"]["application/json"]

export async function fetchSessionDetail(
  client: ApiClient,
  sessionId: number
): Promise<SessionRuntime> {
  const { data, error } = await client.GET("/sessions/{sessionId}", {
    params: { path: { sessionId } },
  })
  if (error) throw error
  if (!data) {
    throw new Error("세션 런타임 응답이 비어 있습니다.")
  }
  return data
}

export async function startSession(
  client: ApiClient,
  sessionId: number
): Promise<SessionRuntime> {
  const { data, error } = await client.POST("/sessions/{sessionId}/start", {
    params: { path: { sessionId } },
  })
  if (error) throw error
  if (!data) {
    throw new Error("세션 시작 응답이 비어 있습니다.")
  }
  return data
}

export async function submitSessionStep(
  client: ApiClient,
  input: {
    sessionId: number
    stepOrder: number
    response?: unknown
  }
): Promise<SessionRuntime> {
  const { data, error } = await client.POST(
    "/sessions/{sessionId}/steps/{stepOrder}/submit",
    {
      params: {
        path: {
          sessionId: input.sessionId,
          stepOrder: input.stepOrder,
        },
      },
      body: { response: input.response },
    }
  )
  if (error) throw error
  if (!data) {
    throw new Error("스텝 제출 응답이 비어 있습니다.")
  }
  return data
}

export async function retrySessionStepAi(
  client: ApiClient,
  input: {
    sessionId: number
    stepOrder: number
  }
): Promise<SessionRuntime> {
  const { data, error } = await client.POST(
    "/sessions/{sessionId}/steps/{stepOrder}/retry",
    {
      params: {
        path: {
          sessionId: input.sessionId,
          stepOrder: input.stepOrder,
        },
      },
    }
  )
  if (error) throw error
  if (!data) {
    throw new Error("AI 재시도 응답이 비어 있습니다.")
  }
  return data
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
  const { error } = await client.POST("/sessions/{sessionId}/complete", {
    params: { path: { sessionId: input.sessionId } },
    body: {
      journeyId: input.journeyId,
      nextSessionOrder: input.nextSessionOrder,
      totalSessions: input.totalSessions,
    },
  })
  if (error) throw error
}
