import type { ReadableStream } from "node:stream/web"
import {
  createManagedMastraAgent,
  createMastraTool,
  MastraRequestContext,
} from "@workspace/ai/mastra-agent"
import type {
  AdminId,
  ConversationId,
  CourseId,
  ResourceDocumentId,
} from "@workspace/types/ids"
import { z } from "zod"

import type { AiChangeProposalApplication } from "#operations/application/ai-change-proposals"
import type {
  AiProviderPort,
  OperationsAiKnowledgePort,
} from "#operations/application/ports/operations-ports"

const agentId = "operations-content-agent"

type OperationsAiRequestContext = Readonly<{
  adminId: AdminId
  conversationId: ConversationId
}>

export type ManagedOperationsAiProvider = Readonly<{
  close: () => Promise<void>
  provider: AiProviderPort
}>

export function createOperationsMastraProvider(input: {
  readonly apiKey: string
  readonly knowledge: OperationsAiKnowledgePort
  readonly model: string
  readonly proposals: Pick<AiChangeProposalApplication, "createProposal">
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
  const proposeContentDraft = createMastraTool({
    description:
      "강의 초안의 제목 또는 설명 변경안을 등록합니다. 발행은 수행하지 않습니다.",
    id: "propose_content_draft",
    inputSchema: z.object({
      courseId: z.string().trim().min(1).max(200),
      description: z.string().max(10_000).optional(),
      expectedEditVersion: z.number().int().nonnegative(),
      title: z.string().trim().min(1).max(200).optional(),
    }),
    execute: async (change, context) => {
      const request = readRequestContext(
        context.requestContext as
          | MastraRequestContext<OperationsAiRequestContext>
          | undefined
      )
      const result = await input.proposals.createProposal({
        adminId: request.adminId,
        change: {
          ...change,
          courseId: change.courseId as CourseId,
          kind: "content-course-draft",
        },
        conversationId: request.conversationId,
      })
      return result.isErr()
        ? { created: false, reason: result.error.kind }
        : { created: true, proposalId: result.value.id }
    },
  })
  const proposeResourceDocument = createMastraTool({
    description:
      "자료실 문서의 이름 또는 Markdown 변경안을 등록합니다. 삭제는 수행하지 않습니다.",
    id: "propose_resource_document",
    inputSchema: z.object({
      contentMarkdown: z.string().max(100_000).optional(),
      documentId: z.string().trim().min(1).max(200),
      expectedVersion: z.number().int().nonnegative(),
      name: z.string().trim().min(1).max(200).optional(),
    }),
    execute: async (change, context) => {
      const request = readRequestContext(
        context.requestContext as
          | MastraRequestContext<OperationsAiRequestContext>
          | undefined
      )
      const result = await input.proposals.createProposal({
        adminId: request.adminId,
        change: {
          ...change,
          documentId: change.documentId as ResourceDocumentId,
          kind: "resource-document",
        },
        conversationId: request.conversationId,
      })
      return result.isErr()
        ? { created: false, reason: result.error.kind }
        : { created: true, proposalId: result.value.id }
    },
  })
  const managedAgent = createManagedMastraAgent({
    id: agentId,
    instructions: [
      "당신은 한국어 글쓰기 교육 플랫폼의 관리자 콘텐츠 제작 에이전트입니다.",
      "근거가 필요한 내부 사실은 관리자 자료실의 활성 문서만 검색하고 읽습니다.",
      "Git, 저장소 코드, 프로젝트 문서, 파일 시스템은 도구나 문맥으로 사용하지 않습니다.",
      "변경은 content draft 또는 resource document 제안으로만 등록합니다.",
      "발행, 영구 삭제, 권한 변경, 운영 설정 변경을 수행하거나 제안 도구로 우회하지 않습니다.",
      "등록된 제안은 관리자가 별도 승인해야 적용된다고 명시합니다.",
    ].join("\n"),
    model: { apiKey: input.apiKey, id: `openai/${input.model}` },
    name: "관리자 운영 콘텐츠 에이전트",
    tools: {
      proposeContentDraft,
      proposeResourceDocument,
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
      const requestContext =
        new MastraRequestContext<OperationsAiRequestContext>()
      requestContext.set("adminId", options.adminId)
      requestContext.set("conversationId", options.conversationId)
      const stream = await agent.stream(prompt, {
        abortSignal: options.signal,
        modelSettings: { maxOutputTokens: options.maxOutputTokens },
        requestContext,
      })
      return readTextStream(stream.textStream)
    },
  })
}

function readRequestContext(
  context: MastraRequestContext<OperationsAiRequestContext> | undefined
): OperationsAiRequestContext {
  const adminId = context?.get("adminId")
  const conversationId = context?.get("conversationId")
  if (adminId === undefined || conversationId === undefined) {
    throw new Error("Operations AI request context is missing")
  }
  return { adminId, conversationId }
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
