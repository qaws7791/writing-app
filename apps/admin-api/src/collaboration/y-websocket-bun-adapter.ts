import * as decoding from "lib0/decoding"
import * as encoding from "lib0/encoding"
import * as awarenessProtocol from "y-protocols/awareness"
import * as syncProtocol from "y-protocols/sync"
import { applyUpdate, Doc, encodeStateAsUpdate } from "yjs"

const messageSync = 0
const messageAwareness = 1
const messageQueryAwareness = 3

export type YWebSocketConnectionData = {
  readonly actorId: string
  readonly channel: "collaboration"
  readonly initialSnapshot: Uint8Array | null
  readonly initialStateVersion: number
  readonly roomId: string
}

export type YWebSocketRoomFlushReason =
  | "debounce"
  | "explicit"
  | "room-empty"
  | "shutdown"

export type YWebSocketRoomFlushResult =
  | {
      readonly kind: "ok"
      readonly stateVersion: number
    }
  | { readonly kind: "error" }

export type YWebSocketRoomFlushInput = {
  readonly actorId: string
  readonly expectedStateVersion: number
  readonly reason: YWebSocketRoomFlushReason
  readonly roomId: string
  readonly snapshot: Uint8Array
}

export type YWebSocketBunAdapter = {
  readonly websocket: Bun.WebSocketHandler<YWebSocketConnectionData>
  closeRoom(roomId: string, code: number, reason: string): number
  dispose(): Promise<void>
  flushRoom(roomId: string): Promise<"error" | "not-open" | "ok">
  getRoomConnectionCount(roomId: string): number
  hasRoom(roomId: string): boolean
  lockRoom(roomId: string): Promise<"error" | "not-open" | "ok">
  unlockRoom(roomId: string): void
}

export type CreateYWebSocketBunAdapterInput = {
  readonly flushDelayMilliseconds?: number
  readonly maxRoomConnections?: number
  readonly onFlush?: (
    input: YWebSocketRoomFlushInput
  ) => Promise<YWebSocketRoomFlushResult>
}

type YWebSocket = Bun.ServerWebSocket<YWebSocketConnectionData>

type AwarenessChange = {
  readonly added: readonly number[]
  readonly removed: readonly number[]
  readonly updated: readonly number[]
}

type YWebSocketRoom = {
  readonly awareness: awarenessProtocol.Awareness
  readonly controlledClients: Map<unknown, Set<number>>
  readonly document: Doc
  readonly sockets: Set<YWebSocket>
  dirty: boolean
  flushOperation: Promise<"error" | "ok"> | null
  flushTimer: ReturnType<typeof setTimeout> | null
  lastActorId: string | null
  state: "active" | "error" | "locked"
  stateVersion: number
}

type YWebSocketAdapterContext = {
  readonly flushDelayMilliseconds: number
  readonly maxRoomConnections: number
  readonly onFlush:
    | ((input: YWebSocketRoomFlushInput) => Promise<YWebSocketRoomFlushResult>)
    | undefined
  readonly rooms: Map<string, YWebSocketRoom>
}

export function createYWebSocketBunAdapter(
  input: CreateYWebSocketBunAdapterInput = {}
): YWebSocketBunAdapter {
  const rooms = new Map<string, YWebSocketRoom>()
  const context: YWebSocketAdapterContext = {
    flushDelayMilliseconds: input.flushDelayMilliseconds ?? 1_000,
    maxRoomConnections: input.maxRoomConnections ?? 20,
    onFlush: input.onFlush,
    rooms,
  }

  return {
    closeRoom(roomId, code, reason) {
      const room = rooms.get(roomId)

      if (room === undefined) return 0

      const connectionCount = room.sockets.size

      for (const socket of [...room.sockets]) {
        removeSocket(context, room, socket, false)
        closeSocket(socket, code, reason)
      }
      destroyRoom(roomId, room, rooms)

      return connectionCount
    },
    async dispose() {
      for (const [roomId, room] of [...rooms]) {
        room.state = "locked"
        await flushRoomUntilClean(context, roomId, room, "shutdown")

        for (const socket of [...room.sockets]) {
          removeSocket(context, room, socket, false)
          closeSocket(socket, 1012, "서버가 종료되어 연결을 닫습니다.")
        }
        destroyRoom(roomId, room, rooms)
      }
    },
    async flushRoom(roomId) {
      const room = rooms.get(roomId)

      return room === undefined
        ? "not-open"
        : flushRoomUntilClean(context, roomId, room, "explicit")
    },
    getRoomConnectionCount(roomId) {
      return rooms.get(roomId)?.sockets.size ?? 0
    },
    hasRoom(roomId) {
      return rooms.has(roomId)
    },
    async lockRoom(roomId) {
      const room = rooms.get(roomId)

      if (room === undefined) return "not-open"

      room.state = "locked"
      return flushRoomUntilClean(context, roomId, room, "explicit")
    },
    unlockRoom(roomId) {
      const room = rooms.get(roomId)

      if (room?.state === "locked") {
        room.state = "active"
      }
    },
    websocket: {
      close(socket) {
        const room = rooms.get(socket.data.roomId)

        if (room !== undefined) {
          removeSocket(context, room, socket, true)
        }
      },
      message(socket, message) {
        const room = rooms.get(socket.data.roomId)

        if (room === undefined) {
          closeSocket(socket, 1011, "WebSocket room을 찾지 못했습니다.")
          return
        }

        if (room.state !== "active") {
          removeSocket(context, room, socket, true)
          closeSocket(socket, 1012, "자료 문서가 읽기 전용으로 전환되었습니다.")
          return
        }

        if (typeof message === "string") {
          closeSocket(socket, 1003, "이진 WebSocket 메시지만 허용됩니다.")
          return
        }

        try {
          handleMessage(context, room, socket, copyBytes(message))
        } catch {
          removeSocket(context, room, socket, true)
          closeSocket(socket, 1003, "유효하지 않은 y-websocket 메시지입니다.")
        }
      },
      open(socket) {
        let room: YWebSocketRoom | null

        try {
          room = getOrCreateRoom(socket.data, context)
        } catch {
          closeSocket(
            socket,
            1011,
            "저장된 공동 편집 상태가 올바르지 않습니다."
          )
          return
        }

        if (room.state !== "active") {
          closeSocket(socket, 1013, "공동 편집 room을 준비하는 중입니다.")
          return
        }

        if (room.sockets.size >= context.maxRoomConnections) {
          closeSocket(socket, 1013, "문서당 공동 편집 인원은 20명까지입니다.")
          return
        }

        room.sockets.add(socket)
        room.controlledClients.set(socket, new Set())
        sendInitialState(context, room, socket)
      },
    },
  }
}

function getOrCreateRoom(
  connection: YWebSocketConnectionData,
  context: YWebSocketAdapterContext
): YWebSocketRoom {
  const existingRoom = context.rooms.get(connection.roomId)

  if (existingRoom !== undefined) return existingRoom

  const document = new Doc()

  if (connection.initialSnapshot !== null) {
    applyUpdate(document, connection.initialSnapshot)
  }

  const awareness = new awarenessProtocol.Awareness(document)
  const room: YWebSocketRoom = {
    awareness,
    controlledClients: new Map(),
    dirty: false,
    document,
    flushOperation: null,
    flushTimer: null,
    lastActorId: null,
    sockets: new Set(),
    state: "active",
    stateVersion: connection.initialStateVersion,
  }

  awareness.setLocalState(null)
  document.on("update", (update: Uint8Array, origin: unknown) => {
    const encoder = encoding.createEncoder()

    encoding.writeVarUint(encoder, messageSync)
    syncProtocol.writeUpdate(encoder, update)
    broadcast(context, room, encoding.toUint8Array(encoder))

    const actorId = readUpdateActorId(room, origin)

    if (actorId !== null) {
      markRoomDirty(context, connection.roomId, room, actorId)
    }
  })
  awareness.on(
    "update",
    ({ added, removed, updated }: AwarenessChange, origin: unknown) => {
      const changedClients = [...added, ...updated, ...removed]
      const controlledClients = room.controlledClients.get(origin)

      if (controlledClients !== undefined) {
        for (const clientId of added) controlledClients.add(clientId)
        for (const clientId of removed) controlledClients.delete(clientId)
      }

      broadcastAwareness(context, room, changedClients)
    }
  )
  context.rooms.set(connection.roomId, room)

  return room
}

function readUpdateActorId(
  room: YWebSocketRoom,
  origin: unknown
): string | null {
  for (const socket of room.sockets) {
    if (socket === origin) return socket.data.actorId
  }

  return null
}

function markRoomDirty(
  context: YWebSocketAdapterContext,
  roomId: string,
  room: YWebSocketRoom,
  actorId: string
): void {
  room.dirty = true
  room.lastActorId = actorId

  if (context.onFlush === undefined || room.flushTimer !== null) return

  room.flushTimer = setTimeout(() => {
    room.flushTimer = null
    void flushRoomUntilClean(context, roomId, room, "debounce")
  }, context.flushDelayMilliseconds)
}

function flushRoomUntilClean(
  context: YWebSocketAdapterContext,
  roomId: string,
  room: YWebSocketRoom,
  reason: YWebSocketRoomFlushReason
): Promise<"error" | "ok"> {
  if (room.flushTimer !== null) {
    clearTimeout(room.flushTimer)
    room.flushTimer = null
  }

  if (room.flushOperation !== null) return room.flushOperation

  const operation = performRoomFlushes(context, roomId, room, reason).finally(
    () => {
      room.flushOperation = null
    }
  )

  room.flushOperation = operation
  return operation
}

async function performRoomFlushes(
  context: YWebSocketAdapterContext,
  roomId: string,
  room: YWebSocketRoom,
  reason: YWebSocketRoomFlushReason
): Promise<"error" | "ok"> {
  if (context.onFlush === undefined) {
    room.dirty = false
    return "ok"
  }

  while (room.dirty) {
    const actorId = room.lastActorId

    if (actorId === null) {
      room.state = "error"
      return "error"
    }

    room.dirty = false
    let result: YWebSocketRoomFlushResult

    try {
      result = await context.onFlush({
        actorId,
        expectedStateVersion: room.stateVersion,
        reason,
        roomId,
        snapshot: encodeStateAsUpdate(room.document),
      })
    } catch {
      result = { kind: "error" }
    }

    if (result.kind === "error") {
      room.state = "error"
      closeRoomSockets(
        context,
        room,
        1011,
        "공동 편집 상태 저장에 실패했습니다."
      )
      destroyRoom(roomId, room, context.rooms)
      return "error"
    }

    room.stateVersion = result.stateVersion
  }

  return "ok"
}

function handleMessage(
  context: YWebSocketAdapterContext,
  room: YWebSocketRoom,
  socket: YWebSocket,
  message: Uint8Array
): void {
  const decoder = decoding.createDecoder(message)
  const messageType = decoding.readVarUint(decoder)

  switch (messageType) {
    case messageSync: {
      const encoder = encoding.createEncoder()

      encoding.writeVarUint(encoder, messageSync)
      syncProtocol.readSyncMessage(decoder, encoder, room.document, socket)

      if (encoding.length(encoder) > 1) {
        sendToSocket(context, room, socket, encoding.toUint8Array(encoder))
      }
      break
    }
    case messageAwareness:
      awarenessProtocol.applyAwarenessUpdate(
        room.awareness,
        decoding.readVarUint8Array(decoder),
        socket
      )
      break
    case messageQueryAwareness:
      broadcastAwareness(
        context,
        room,
        [...room.awareness.getStates().keys()],
        socket
      )
      break
    default:
      throw new Error("지원하지 않는 y-websocket 메시지 유형입니다.")
  }
}

function sendInitialState(
  context: YWebSocketAdapterContext,
  room: YWebSocketRoom,
  socket: YWebSocket
): void {
  const encoder = encoding.createEncoder()

  encoding.writeVarUint(encoder, messageSync)
  syncProtocol.writeSyncStep1(encoder, room.document)
  if (!sendToSocket(context, room, socket, encoding.toUint8Array(encoder))) {
    return
  }

  const awarenessClients = [...room.awareness.getStates().keys()]

  if (awarenessClients.length > 0) {
    broadcastAwareness(context, room, awarenessClients, socket)
  }
}

function broadcastAwareness(
  context: YWebSocketAdapterContext,
  room: YWebSocketRoom,
  clientIds: readonly number[],
  recipient?: YWebSocket
): void {
  if (clientIds.length === 0) return

  const encoder = encoding.createEncoder()

  encoding.writeVarUint(encoder, messageAwareness)
  encoding.writeVarUint8Array(
    encoder,
    awarenessProtocol.encodeAwarenessUpdate(room.awareness, [...clientIds])
  )
  const message = encoding.toUint8Array(encoder)

  if (recipient === undefined) {
    broadcast(context, room, message)
    return
  }

  sendToSocket(context, room, recipient, message)
}

function broadcast(
  context: YWebSocketAdapterContext,
  room: YWebSocketRoom,
  message: Uint8Array
): void {
  for (const socket of [...room.sockets]) {
    sendToSocket(context, room, socket, message)
  }
}

function sendToSocket(
  context: YWebSocketAdapterContext,
  room: YWebSocketRoom,
  socket: YWebSocket,
  message: Uint8Array
): boolean {
  try {
    if (socket.send(message) !== 0) return true
  } catch {
    // 실패한 연결은 아래의 공통 정리 경로에서 격리한다.
  }

  removeSocket(context, room, socket, true)
  closeSocket(socket, 1011, "WebSocket 메시지 전송에 실패했습니다.")
  return false
}

function closeRoomSockets(
  context: YWebSocketAdapterContext,
  room: YWebSocketRoom,
  code: number,
  reason: string
): void {
  for (const socket of [...room.sockets]) {
    removeSocket(context, room, socket, false)
    closeSocket(socket, code, reason)
  }
}

function removeSocket(
  context: YWebSocketAdapterContext,
  room: YWebSocketRoom,
  socket: YWebSocket,
  flushWhenEmpty: boolean
): void {
  if (!room.sockets.has(socket) && !room.controlledClients.has(socket)) return

  const controlledClients = room.controlledClients.get(socket)

  room.controlledClients.delete(socket)
  room.sockets.delete(socket)

  if (controlledClients !== undefined) {
    awarenessProtocol.removeAwarenessStates(
      room.awareness,
      [...controlledClients],
      null
    )
  }

  if (
    flushWhenEmpty &&
    room.sockets.size === 0 &&
    context.rooms.get(socket.data.roomId) === room
  ) {
    void flushRoomUntilClean(
      context,
      socket.data.roomId,
      room,
      "room-empty"
    ).finally(() => {
      if (
        room.sockets.size === 0 &&
        context.rooms.get(socket.data.roomId) === room
      ) {
        destroyRoom(socket.data.roomId, room, context.rooms)
      }
    })
  }
}

function closeSocket(socket: YWebSocket, code?: number, reason?: string): void {
  try {
    socket.close(code, reason)
  } catch {
    // 연결 정리는 이미 완료되었으므로 transport close 실패를 전파하지 않는다.
  }
}

function destroyRoom(
  roomId: string,
  room: YWebSocketRoom,
  rooms: Map<string, YWebSocketRoom>
): void {
  if (room.flushTimer !== null) clearTimeout(room.flushTimer)
  room.awareness.destroy()
  room.document.destroy()
  room.controlledClients.clear()
  room.sockets.clear()
  rooms.delete(roomId)
}

function copyBytes(message: Buffer): Uint8Array {
  const bytes = new Uint8Array(message.byteLength)

  bytes.set(message)
  return bytes
}
