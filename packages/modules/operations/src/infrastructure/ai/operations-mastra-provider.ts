import type { ReadableStream } from "node:stream/web"
import {
  createManagedMastraAgent,
  createMastraTool,
} from "@workspace/ai/mastra-agent"
import type { ResourceDocumentId } from "@workspace/types/ids"
import { z } from "zod"

import type {
  AiProviderPort,
  OperationsAiKnowledgePort,
} from "#operations/application/ports/operations-ports"

const agentId = "operations-content-agent"

export type ManagedOperationsAiProvider = Readonly<{
  close: () => Promise<void>
  provider: AiProviderPort
}>

export function createOperationsMastraProvider(input: {
  readonly apiKey: string
  readonly knowledge: OperationsAiKnowledgePort
  readonly model: string
}): ManagedOperationsAiProvider {
  const searchResources = createMastraTool({
    description: "관리자 자료실의 활성 문서를 검색합니다.",
    id: "search_resources",
    inputSchema: z.object({
      limit: z.number().int().min(1).max(10).default(5),
      query: z.string().trim().min(1).max(200),
    }),
    execute: async (query) => ({
      documents: await input.knowledge.searchResources(query),
    }),
  })
  const readResourceDocument = createMastraTool({
    description: "검색 결과에 포함된 관리자 자료실 문서 한 건을 읽습니다.",
    id: "read_resource_document",
    inputSchema: z.object({ documentId: z.string().trim().min(1).max(200) }),
    execute: async ({ documentId }) => ({
      document: await input.knowledge.readResourceDocument(
        documentId as ResourceDocumentId
      ),
    }),
  })
  const managedAgent = createManagedMastraAgent({
    id: agentId,
    instructions: [
      "당신은 한국어 글쓰기 교육 플랫폼의 관리자 콘텐츠 제작 에이전트입니다.",
      "근거가 필요한 내부 사실은 관리자 자료실의 활성 문서만 검색하고 읽습니다.",
      "Git, 저장소 코드, 프로젝트 문서, 파일 시스템은 도구나 문맥으로 사용하지 않습니다.",
      "코스 제작을 위한 조사, 설명과 초안 작성을 돕되 어떤 데이터도 변경하지 않습니다.",
      "발행, 저장, 삭제, 권한 변경과 운영 변경을 수행할 수 있다고 말하지 않습니다.",
    ].join("\n"),
    model: { apiKey: input.apiKey, id: `openai/${input.model}` },
    name: "관리자 운영 콘텐츠 에이전트",
    tools: {
      readResourceDocument,
      searchResources,
    },
  })
  return Object.freeze({
    close: managedAgent.close,
    provider: createProvider(managedAgent.agent),
  })
}

function createProvider(
  agent: ReturnType<typeof createManagedMastraAgent>["agent"]
): AiProviderPort {
  return Object.freeze({
    async streamText(prompt, options) {
      const stream = await agent.stream(prompt, {
        abortSignal: options.signal,
        modelSettings: { maxOutputTokens: options.maxOutputTokens },
      })
      return readTextStream(stream.textStream)
    },
  })
}

async function* readTextStream(
  stream: ReadableStream<string>
): AsyncIterable<string> {
  const reader = stream.getReader()
  try {
    while (true) {
      const result = await reader.read()
      if (result.done) return
      yield result.value
    }
  } finally {
    reader.releaseLock()
  }
}
