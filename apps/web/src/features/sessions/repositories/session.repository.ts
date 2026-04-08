import type { ApiClient } from "@workspace/api-client"

export async function fetchSessionDetail(client: ApiClient, sessionId: number) {
  const { data, error } = await client.GET("/sessions/{sessionId}", {
    params: { path: { sessionId } },
  })
  if (error) throw error
  return data
}

export async function startSession(client: ApiClient, sessionId: number) {
  const { data, error } = await client.POST("/sessions/{sessionId}/start", {
    params: { path: { sessionId } },
  })
  if (error) throw error
  return data
}

export async function submitSessionStep(
  client: ApiClient,
  input: {
    sessionId: number
    stepOrder: number
    response?: unknown
  }
) {
  const { error } = await client.POST(
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
