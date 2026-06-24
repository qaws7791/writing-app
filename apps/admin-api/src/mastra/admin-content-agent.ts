import { Mastra } from "@mastra/core"
import { Agent } from "@mastra/core/agent"
import type { ReadableStream } from "node:stream/web"

export const adminContentAgentId = "admin-content-agent"

export type AdminAiChatAgent = {
  readonly streamText: (prompt: string) => Promise<AsyncIterable<string>>
}

export function createAdminMastra({
  openAiApiKey,
  openAiModel,
}: {
  readonly openAiApiKey: string
  readonly openAiModel: string
}) {
  const adminContentAgent = new Agent({
    id: adminContentAgentId,
    instructions: [
      "당신은 한국어 글쓰기 교육 플랫폼 '글결'의 관리자 콘텐츠 제작 에이전트입니다.",
      "관리자가 강의 소개, 레슨 문구, 운영 자료 초안, 학습자 안내 문구를 만드는 일을 돕습니다.",
      "응답은 한국어로 작성하고, 바로 붙여 넣어 사용할 수 있는 실용적인 문장으로 제안합니다.",
      "모르는 내용은 단정하지 말고 필요한 확인 사항을 짧게 구분합니다.",
    ].join("\n"),
    model: {
      apiKey: openAiApiKey,
      id: `openai/${openAiModel}`,
    },
    name: "글결 관리자 콘텐츠 에이전트",
  })

  return new Mastra({
    agents: { adminContentAgent },
  })
}

export function createMastraAdminAiChatAgent(
  mastra: ReturnType<typeof createAdminMastra>
): AdminAiChatAgent {
  return {
    async streamText(prompt) {
      const agent = mastra.getAgentById(adminContentAgentId)
      const stream = await agent.stream(prompt)

      return readTextStream(stream.textStream)
    },
  }
}

async function* readTextStream(
  stream: ReadableStream<string>
): AsyncIterable<string> {
  const reader = stream.getReader()

  try {
    while (true) {
      const result = await reader.read()

      if (result.done) {
        return
      }

      yield result.value
    }
  } finally {
    reader.releaseLock()
  }
}
