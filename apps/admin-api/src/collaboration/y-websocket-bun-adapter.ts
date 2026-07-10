import * as decoding from "lib0/decoding"
import * as encoding from "lib0/encoding"
import * as awarenessProtocol from "y-protocols/awareness"
import * as syncProtocol from "y-protocols/sync"
import { Doc } from "yjs"

const messageSync = 0
const messageAwareness = 1
const messageQueryAwareness = 3

export type YWebSocketConnectionData = {
  readonly roomId: string
}

export type YWebSocketBunAdapter = {
  readonly websocket: Bun.WebSocketHandler<YWebSocketConnectionData>
  dispose(): void
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
}

type YWebSocketAdapterContext = {
  readonly rooms: Map<string, YWebSocketRoom>
}

export function createYWebSocketBunAdapter(): YWebSocketBunAdapter {
  const rooms = new Map<string, YWebSocketRoom>()
  const context: YWebSocketAdapterContext = { rooms }

  return {
    dispose() {
      for (const [roomId, room] of [...rooms]) {
        for (const socket of room.sockets) {
          closeSocket(socket)
        }

        destroyRoom(roomId, room, rooms)
      }
    },
    websocket: {
      close(socket) {
        const room = rooms.get(socket.data.roomId)

        if (room === undefined) {
          return
        }

        removeSocket(context, room, socket)
      },
      message(socket, message) {
        const room = rooms.get(socket.data.roomId)

        if (room === undefined) {
          closeSocket(socket, 1011, "WebSocket room을 찾지 못했습니다.")
          return
        }

        if (typeof message === "string") {
          closeSocket(socket, 1003, "이진 WebSocket 메시지만 허용됩니다.")
          return
        }

        try {
          handleMessage(context, room, socket, copyBytes(message))
        } catch {
          removeSocket(context, room, socket)
          closeSocket(socket, 1003, "유효하지 않은 y-websocket 메시지입니다.")
        }
      },
      open(socket) {
        const room = getOrCreateRoom(socket.data.roomId, context)

        room.sockets.add(socket)
        room.controlledClients.set(socket, new Set())
        sendInitialState(context, room, socket)
      },
    },
  }
}

function getOrCreateRoom(
  roomId: string,
  context: YWebSocketAdapterContext
): YWebSocketRoom {
  const existingRoom = context.rooms.get(roomId)

  if (existingRoom !== undefined) {
    return existingRoom
  }

  const document = new Doc()
  const awareness = new awarenessProtocol.Awareness(document)
  const room: YWebSocketRoom = {
    awareness,
    controlledClients: new Map(),
    document,
    sockets: new Set(),
  }

  awareness.setLocalState(null)
  document.on("update", (update: Uint8Array) => {
    const encoder = encoding.createEncoder()

    encoding.writeVarUint(encoder, messageSync)
    syncProtocol.writeUpdate(encoder, update)
    broadcast(context, room, encoding.toUint8Array(encoder))
  })
  awareness.on(
    "update",
    ({ added, removed, updated }: AwarenessChange, origin: unknown) => {
      const changedClients = [...added, ...updated, ...removed]
      const controlledClients = room.controlledClients.get(origin)

      if (controlledClients !== undefined) {
        for (const clientId of added) {
          controlledClients.add(clientId)
        }

        for (const clientId of removed) {
          controlledClients.delete(clientId)
        }
      }

      broadcastAwareness(context, room, changedClients)
    }
  )
  context.rooms.set(roomId, room)

  return room
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
  if (clientIds.length === 0) {
    return
  }

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
    if (socket.send(message) !== 0) {
      return true
    }
  } catch {
    // 실패한 연결은 아래의 공통 정리 경로에서 격리한다.
  }

  removeSocket(context, room, socket)
  closeSocket(socket, 1011, "WebSocket 메시지 전송에 실패했습니다.")
  return false
}

function removeSocket(
  context: YWebSocketAdapterContext,
  room: YWebSocketRoom,
  socket: YWebSocket
): void {
  if (!room.sockets.has(socket) && !room.controlledClients.has(socket)) {
    return
  }

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
    room.sockets.size === 0 &&
    context.rooms.get(socket.data.roomId) === room
  ) {
    destroyRoom(socket.data.roomId, room, context.rooms)
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
