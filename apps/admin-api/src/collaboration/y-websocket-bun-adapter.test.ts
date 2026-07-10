import { afterEach, describe, expect, it } from "vitest"
import * as decoding from "lib0/decoding"
import * as encoding from "lib0/encoding"
import { $getRoot, $isTextNode, type LexicalEditor } from "lexical"
import * as awarenessProtocol from "y-protocols/awareness"
import * as syncProtocol from "y-protocols/sync"
import { WebsocketProvider } from "y-websocket"
import { Doc, encodeStateAsUpdate } from "yjs"

import {
  createHeadlessResourceDocumentCollaboration,
  readResourceDocumentMarkdown,
  replaceResourceDocumentMarkdown,
} from "@workspace/resource-document"

import {
  createYWebSocketBunAdapter,
  type YWebSocketBunAdapter,
  type YWebSocketConnectionData,
} from "@/collaboration/y-websocket-bun-adapter"

const runningServers: Bun.Server<YWebSocketConnectionData>[] = []

afterEach(() => {
  for (const server of runningServers.splice(0)) {
    server.stop(true)
  }
})

describe("Bun y-websocket 어댑터", () => {
  it("공식 client 두 개가 같은 room에서 변경을 주고받아 수렴한다", async () => {
    const adapter = createYWebSocketBunAdapter()
    const server = startServer(adapter)

    const roomId = `phase-0-${crypto.randomUUID()}`
    const documentA = new Doc()
    const documentB = new Doc()
    const providerA = new WebsocketProvider(
      `ws://127.0.0.1:${server.port}/resources/collaboration`,
      roomId,
      documentA,
      { disableBc: true, WebSocketPolyfill: WebSocket }
    )
    const providerB = new WebsocketProvider(
      `ws://127.0.0.1:${server.port}/resources/collaboration`,
      roomId,
      documentB,
      { disableBc: true, WebSocketPolyfill: WebSocket }
    )

    try {
      await Promise.all([waitForSync(providerA), waitForSync(providerB)])

      documentA.getText("body").insert(0, "A")
      documentB.getText("body").insert(0, "B")

      await waitFor(() => {
        return (
          documentA.getText("body").toString().length === 2 &&
          documentB.getText("body").toString().length === 2
        )
      })

      expect(documentA.getText("body").toString()).toBe(
        documentB.getText("body").toString()
      )
      expect(documentA.getText("body").toString()).toContain("A")
      expect(documentA.getText("body").toString()).toContain("B")
    } finally {
      providerA.destroy()
      providerB.destroy()
      documentA.destroy()
      documentB.destroy()
      adapter.dispose()
    }
  })

  it("실제 Bun endpoint에서 두 Lexical client의 동시 편집이 같은 Markdown으로 수렴한다", async () => {
    const adapter = createYWebSocketBunAdapter()
    const server = startServer(adapter)
    const roomId = `lexical-${crypto.randomUUID()}`
    const clientA = createClient(server, roomId)
    const clientB = createClient(server, roomId)

    try {
      await Promise.all([
        waitForSync(clientA.provider),
        waitForSync(clientB.provider),
      ])

      const collaborationA = createHeadlessResourceDocumentCollaboration({
        document: clientA.document,
        id: "resource-document",
      })
      const collaborationB = createHeadlessResourceDocumentCollaboration({
        document: clientB.document,
        id: "resource-document",
      })
      const editorA = collaborationA.editor
      const editorB = collaborationB.editor

      try {
        expect(replaceResourceDocumentMarkdown(editorA, "기본 문서")).toEqual({
          status: "valid",
        })
        await waitFor(() => {
          const projection = readResourceDocumentMarkdown(editorB)

          return (
            projection.status === "valid" && projection.markdown === "기본 문서"
          )
        })

        appendToFirstTextNode(editorA, " A")
        appendToFirstTextNode(editorB, " B")

        await waitFor(() => {
          const markdownA = readResourceDocumentMarkdown(editorA)
          const markdownB = readResourceDocumentMarkdown(editorB)

          return (
            markdownA.status === "valid" &&
            markdownB.status === "valid" &&
            markdownA.markdown === markdownB.markdown &&
            markdownA.markdown.includes(" A") &&
            markdownA.markdown.includes(" B")
          )
        })
      } finally {
        collaborationA.disconnect()
        collaborationB.disconnect()
      }
    } finally {
      destroyClient(clientA)
      destroyClient(clientB)
      adapter.dispose()
    }
  })

  for (const failure of ["throw", "zero"] as const) {
    it(`broadcast 전송 ${failure} 실패를 해당 socket으로 격리한다`, () => {
      const adapter = createYWebSocketBunAdapter()
      const roomId = `broadcast-${failure}-${crypto.randomUUID()}`
      const healthy = createTestSocket(roomId)
      const failureSocket = createTestSocket(roomId)

      try {
        openTestSocket(adapter, healthy.socket)
        openTestSocket(adapter, failureSocket.socket)
        failureSocket.failWith(failure)

        sendTestMessage(
          adapter,
          healthy.socket,
          createDocumentUpdateMessage("격리 후 보존")
        )

        expect(healthy.wasClosed()).toBe(false)
        expect(failureSocket.wasClosed()).toBe(true)

        const recovered = new Doc()

        try {
          applySyncMessages(healthy.sent, recovered)
          expect(recovered.getText("body").toString()).toBe("격리 후 보존")
        } finally {
          recovered.destroy()
        }
      } finally {
        adapter.dispose()
      }
    })
  }

  it("initial·reply·awareness 전송 실패가 건강한 연결로 전파되지 않는다", () => {
    const adapter = createYWebSocketBunAdapter()

    try {
      const initial = createTestSocket(
        `initial-${crypto.randomUUID()}`,
        "throw"
      )

      openTestSocket(adapter, initial.socket)
      expect(initial.wasClosed()).toBe(true)

      const roomId = `reply-awareness-${crypto.randomUUID()}`
      const healthy = createTestSocket(roomId)
      const reply = createTestSocket(roomId)
      const awareness = createTestSocket(roomId)

      openTestSocket(adapter, healthy.socket)
      sendTestMessage(
        adapter,
        healthy.socket,
        createDocumentUpdateMessage("서버 상태")
      )

      openTestSocket(adapter, reply.socket)
      reply.failWith("throw")
      sendTestMessage(adapter, reply.socket, createSyncStepOneMessage())
      expect(reply.wasClosed()).toBe(true)
      expect(healthy.wasClosed()).toBe(false)

      openTestSocket(adapter, awareness.socket)
      awareness.failWith("throw")
      sendTestMessage(adapter, healthy.socket, createAwarenessMessage())
      expect(awareness.wasClosed()).toBe(true)
      expect(healthy.wasClosed()).toBe(false)
    } finally {
      adapter.dispose()
    }
  })
})

type TestClient = {
  readonly document: Doc
  readonly provider: WebsocketProvider
}

function startServer(
  adapter: YWebSocketBunAdapter
): Bun.Server<YWebSocketConnectionData> {
  const server = Bun.serve<YWebSocketConnectionData>({
    fetch(request, bunServer) {
      const url = new URL(request.url)
      const roomId = readRoomId(url)

      if (
        roomId !== null &&
        bunServer.upgrade(request, {
          data: { roomId },
        })
      ) {
        return undefined
      }

      return new Response("WebSocket upgrade가 필요합니다.", { status: 426 })
    },
    port: 0,
    websocket: adapter.websocket,
  })

  runningServers.push(server)
  return server
}

function createClient(
  server: Bun.Server<YWebSocketConnectionData>,
  roomId: string
): TestClient {
  const document = new Doc()
  const provider = new WebsocketProvider(
    `ws://127.0.0.1:${server.port}/resources/collaboration`,
    roomId,
    document,
    { disableBc: true, WebSocketPolyfill: WebSocket }
  )

  return { document, provider }
}

function destroyClient(client: TestClient): void {
  client.provider.destroy()
  client.document.destroy()
}

function createTestSocket(
  roomId: string,
  initialFailure: "throw" | "zero" | null = null
): TestSocket {
  return new TestSocket(roomId, initialFailure)
}

class TestSocket implements Bun.ServerWebSocket<YWebSocketConnectionData> {
  readonly data: YWebSocketConnectionData
  readonly remoteAddress = "127.0.0.1"
  readonly sent: Uint8Array[] = []
  readonly socket: Bun.ServerWebSocket<YWebSocketConnectionData> = this
  binaryType: "arraybuffer" | "nodebuffer" | "uint8array" = "uint8array"

  private closed = false
  private failure: "throw" | "zero" | null
  private readonly subscribedTopics = new Set<string>()

  constructor(roomId: string, failure: "throw" | "zero" | null) {
    this.data = { roomId }
    this.failure = failure
  }

  get readyState(): Bun.ServerWebSocket<YWebSocketConnectionData>["readyState"] {
    return this.closed ? WebSocket.CLOSED : WebSocket.OPEN
  }

  get subscriptions(): string[] {
    return [...this.subscribedTopics]
  }

  close(): void {
    this.closed = true
  }

  cork<Result = unknown>(
    _callback: (socket: Bun.ServerWebSocket<Result>) => Result
  ): Result {
    throw new Error("fixture에서는 WebSocket cork를 지원하지 않습니다.")
  }

  failWith(failure: "throw" | "zero"): void {
    this.failure = failure
  }

  getBufferedAmount(): number {
    return 0
  }

  isSubscribed(topic: string): boolean {
    return this.subscribedTopics.has(topic)
  }

  ping(): number {
    return 1
  }

  pong(): number {
    return 1
  }

  publish(): number {
    return 1
  }

  publishBinary(): number {
    return 1
  }

  publishText(): number {
    return 1
  }

  send(message: string | Bun.BufferSource): number {
    if (this.failure === "throw") {
      throw new Error("주입한 WebSocket 전송 실패")
    }

    if (this.failure === "zero") {
      return 0
    }

    const bytes =
      typeof message === "string"
        ? new TextEncoder().encode(message)
        : copyBufferSource(message)

    this.sent.push(bytes)
    return Math.max(bytes.byteLength, 1)
  }

  sendBinary(message: Bun.BufferSource): number {
    return this.send(message)
  }

  sendText(message: string): number {
    return this.send(message)
  }

  subscribe(topic: string): void {
    this.subscribedTopics.add(topic)
  }

  terminate(): void {
    this.closed = true
  }

  unsubscribe(topic: string): void {
    this.subscribedTopics.delete(topic)
  }

  wasClosed(): boolean {
    return this.closed
  }
}

function copyBufferSource(source: Bun.BufferSource): Uint8Array {
  return ArrayBuffer.isView(source)
    ? Uint8Array.from(
        new Uint8Array(source.buffer, source.byteOffset, source.byteLength)
      )
    : Uint8Array.from(new Uint8Array(source))
}

function openTestSocket(
  adapter: YWebSocketBunAdapter,
  socket: Bun.ServerWebSocket<YWebSocketConnectionData>
): void {
  const open = adapter.websocket.open

  if (open === undefined) {
    throw new Error("WebSocket open handler를 찾지 못했습니다.")
  }

  open(socket)
}

function sendTestMessage(
  adapter: YWebSocketBunAdapter,
  socket: Bun.ServerWebSocket<YWebSocketConnectionData>,
  message: Uint8Array
): void {
  const handleMessage = adapter.websocket.message

  if (handleMessage === undefined) {
    throw new Error("WebSocket message handler를 찾지 못했습니다.")
  }

  handleMessage(socket, Buffer.from(message))
}

function createDocumentUpdateMessage(text: string): Uint8Array {
  const document = new Doc()

  try {
    document.getText("body").insert(0, text)

    const encoder = encoding.createEncoder()

    encoding.writeVarUint(encoder, 0)
    syncProtocol.writeUpdate(encoder, encodeStateAsUpdate(document))
    return encoding.toUint8Array(encoder)
  } finally {
    document.destroy()
  }
}

function createSyncStepOneMessage(): Uint8Array {
  const document = new Doc()

  try {
    const encoder = encoding.createEncoder()

    encoding.writeVarUint(encoder, 0)
    syncProtocol.writeSyncStep1(encoder, document)
    return encoding.toUint8Array(encoder)
  } finally {
    document.destroy()
  }
}

function createAwarenessMessage(): Uint8Array {
  const document = new Doc()
  const awareness = new awarenessProtocol.Awareness(document)

  try {
    awareness.setLocalState({ name: "건강한 연결" })

    const encoder = encoding.createEncoder()

    encoding.writeVarUint(encoder, 1)
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(awareness, [document.clientID])
    )
    return encoding.toUint8Array(encoder)
  } finally {
    awareness.destroy()
    document.destroy()
  }
}

function applySyncMessages(
  messages: readonly Uint8Array[],
  document: Doc
): void {
  for (const message of messages) {
    const decoder = decoding.createDecoder(message)

    if (decoding.readVarUint(decoder) !== 0) {
      continue
    }

    syncProtocol.readSyncMessage(
      decoder,
      encoding.createEncoder(),
      document,
      null
    )
  }
}

function readRoomId(url: URL): string | null {
  const pathname = url.pathname
  const prefix = "/resources/collaboration/"

  return pathname.startsWith(prefix)
    ? decodeURIComponent(pathname.slice(prefix.length))
    : null
}

function appendToFirstTextNode(editor: LexicalEditor, text: string): void {
  editor.update(
    () => {
      const node = $getRoot().getFirstDescendant()

      if (!$isTextNode(node)) {
        throw new Error("fixture의 첫 번째 텍스트 노드를 찾지 못했습니다.")
      }

      node.spliceText(node.getTextContentSize(), 0, text)
    },
    { discrete: true }
  )
}

function waitForSync(provider: WebsocketProvider): Promise<void> {
  if (provider.synced) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      provider.off("sync", onSync)
      reject(new Error("y-websocket 초기 동기화 시간이 초과되었습니다."))
    }, 5_000)
    const onSync = (isSynced: boolean) => {
      if (!isSynced) {
        return
      }

      clearTimeout(timeout)
      provider.off("sync", onSync)
      resolve()
    }

    provider.on("sync", onSync)
  })
}

async function waitFor(predicate: () => boolean): Promise<void> {
  const startedAt = performance.now()

  while (!predicate()) {
    if (performance.now() - startedAt > 5_000) {
      throw new Error("y-websocket 변경 수렴 시간이 초과되었습니다.")
    }

    await new Promise((resolve) => setTimeout(resolve, 10))
  }
}
