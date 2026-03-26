import { createServerApiClient } from "@/foundation/api"
import type { SessionSnapshot } from "@/domain/auth"

export class SessionRepository {
  private client

  constructor(input?: { requestHost?: string | null }) {
    this.client = createServerApiClient({ requestHost: input?.requestHost })
  }

  async getSession(): Promise<SessionSnapshot | null> {
    const { data, error, response } = await this.client.GET("/session")

    if (response?.status === 401) {
      return null
    }

    if (error) {
      throw new Error("세션 상태를 확인하지 못했습니다.")
    }

    return data
  }
}
