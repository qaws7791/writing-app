import type { ReadableStream } from "node:stream/web"
import {
  createMastraAgent,
  createMastraRuntime,
  createMastraTool,
  type ManagedMastraRuntime,
} from "@workspace/ai/mastra-runtime"
import type {
  ResourceDocumentUseCase,
  ResourceSearchUseCase,
} from "@workspace/core/resource-library"
import { z } from "zod"

import type { AdminAiChatAgent } from "@/modules/admin-ai-chat/admin-ai-chat-agent"

const adminContentAgentId = "admin-content-agent"

export type { AdminAiChatAgent } from "@/modules/admin-ai-chat/admin-ai-chat-agent"

export function createAdminMastra({
  openAiApiKey,
  openAiModel,
  resourceLibrary,
}: {
  readonly openAiApiKey: string
  readonly openAiModel: string
  readonly resourceLibrary: {
    readonly documents: ResourceDocumentUseCase
    readonly search: ResourceSearchUseCase
  }
}) {
  const searchResources = createMastraTool({
    description:
      "관리자 자료실의 활성 문서 제목과 본문을 검색합니다. 내부 사실을 답하기 전에 사용합니다.",
    id: "search_resources",
    inputSchema: z.object({
      limit: z.number().int().min(1).max(10).default(5),
      query: z.string().trim().min(1).max(200),
    }),
    execute: async ({ limit, query }) => {
      const result = await resourceLibrary.search.search({ limit, query })
      return {
        documents: result.items.map((item) => ({
          excerpt: item.excerpt,
          id: item.id,
          link: `/resources/${item.id}`,
          name: item.name,
          path: item.path.map((part) => part.name),
          version: item.version,
        })),
      }
    },
  })
  const readResourceDocument = createMastraTool({
    description:
      "관리자 자료실의 활성 문서 한 건을 Markdown 원문과 함께 읽습니다. search_resources가 반환한 id를 사용합니다.",
    id: "read_resource_document",
    inputSchema: z.object({ documentId: z.string().trim().min(1).max(128) }),
    execute: async ({ documentId }) => {
      const document = await resourceLibrary.documents.getDocument({
        documentId,
      })
      if (document === null || document.status !== "active") {
        return { found: false }
      }
      return {
        contentMarkdown: document.contentMarkdown,
        found: true,
        id: document.id,
        link: `/resources/${document.id}`,
        name: document.name,
        path: document.path.map((part) => part.name),
        version: document.version,
      }
    },
  })
  const adminContentAgent = createMastraAgent({
    id: adminContentAgentId,
    instructions: [
      "당신은 한국어 글쓰기 교육 플랫폼 '글결'의 관리자 콘텐츠 제작 에이전트입니다.",
      "관리자가 강의 소개, 레슨 문구, 운영 자료 초안, 학습자 안내 문구를 만드는 일을 돕습니다.",
      "응답은 한국어로 작성하고, 바로 붙여 넣어 사용할 수 있는 실용적인 문장으로 제안합니다.",
      "모르는 내용은 단정하지 말고 필요한 확인 사항을 짧게 구분합니다.",
      "프로젝트 내부 사실이나 운영 기준을 묻는 질문에는 search_resources로 관련 자료를 찾고 read_resource_document로 원문을 확인합니다.",
      "자료실을 근거로 답할 때는 문장 가까이에 [문서 제목](/resources/문서ID) 형식의 링크를 표시합니다.",
      "자료실 도구는 읽기 전용이며 자료를 생성하거나 수정하거나 삭제하지 않습니다.",
    ].join("\n"),
    model: {
      apiKey: openAiApiKey,
      id: `openai/${openAiModel}`,
    },
    name: "글결 관리자 콘텐츠 에이전트",
    tools: { readResourceDocument, searchResources },
  })

  const runtimeResult = createMastraRuntime({
    agents: { adminContentAgent },
    apiKey: openAiApiKey,
    timeoutMs: 30_000,
  })
  if (runtimeResult.isErr()) throw runtimeResult.error
  return runtimeResult.value
}

export function createMastraAdminAiChatAgent(
  mastra: ManagedMastraRuntime
): AdminAiChatAgent {
  return {
    async streamText(prompt, options) {
      const agent = mastra.value.getAgentById(adminContentAgentId)
      const stream = await agent.stream(prompt, {
        abortSignal: options.signal,
        modelSettings: { maxOutputTokens: options.maxOutputTokens },
      })

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
