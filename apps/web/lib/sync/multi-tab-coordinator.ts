import type { TabMessage } from "./types"

const CHANNEL_NAME = "writing-sync"
const LEADER_TIMEOUT_MS = 5_000
const HEARTBEAT_INTERVAL_MS = 3_000

export type TabCoordinator = {
  readonly tabId: string
  isLeader: () => boolean
  broadcast: (message: TabMessage) => void
  onMessage: (handler: (message: TabMessage) => void) => void
  onLeaderChange: (handler: (isLeader: boolean) => void) => void
  destroy: () => void
}

function generateTabId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createTabCoordinator(): TabCoordinator {
  const tabId = generateTabId()
  let channel: BroadcastChannel | null = null
  let leader = false
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let lastLeaderHeartbeat = 0
  let leaderCheckTimer: ReturnType<typeof setInterval> | null = null

  const messageHandlers: ((msg: TabMessage) => void)[] = []
  const leaderChangeHandlers: ((isLeader: boolean) => void)[] = []

  function setLeader(value: boolean) {
    if (leader !== value) {
      leader = value
      for (const handler of leaderChangeHandlers) {
        handler(value)
      }
    }
  }

  function broadcast(message: TabMessage) {
    channel?.postMessage(message)
  }

  function claimLeadership() {
    setLeader(true)
    broadcast({ type: "LEADER_CLAIM", tabId, timestamp: Date.now() })
  }

  function startHeartbeat() {
    if (heartbeatTimer) return
    heartbeatTimer = setInterval(() => {
      if (leader) {
        broadcast({ type: "LEADER_CLAIM", tabId, timestamp: Date.now() })
      }
    }, HEARTBEAT_INTERVAL_MS)
  }

  function startLeaderCheck() {
    if (leaderCheckTimer) return
    leaderCheckTimer = setInterval(() => {
      if (!leader && Date.now() - lastLeaderHeartbeat > LEADER_TIMEOUT_MS) {
        claimLeadership()
      }
    }, LEADER_TIMEOUT_MS)
  }

  function handleMessage(event: MessageEvent<TabMessage>) {
    const msg = event.data
    if (!msg || !msg.type) return

    switch (msg.type) {
      case "LEADER_CLAIM": {
        if (msg.tabId !== tabId) {
          lastLeaderHeartbeat = msg.timestamp
          if (leader) {
            // 더 오래된 탭이 이미 리더면 양보
            setLeader(false)
          }
        }
        break
      }
      case "TAB_CLOSING": {
        if (msg.tabId !== tabId) {
          // 리더가 닫히면 리더 선출 시도
          setTimeout(() => {
            if (
              !leader &&
              Date.now() - lastLeaderHeartbeat > LEADER_TIMEOUT_MS
            ) {
              claimLeadership()
            }
          }, 500)
        }
        break
      }
    }

    for (const handler of messageHandlers) {
      handler(msg)
    }
  }

  // 초기화
  if (
    typeof window !== "undefined" &&
    typeof BroadcastChannel !== "undefined"
  ) {
    channel = new BroadcastChannel(CHANNEL_NAME)
    channel.addEventListener("message", handleMessage)

    // 리더 선출: 일정 시간 대기 후 리더가 없으면 자신이 리더
    lastLeaderHeartbeat = 0
    setTimeout(
      () => {
        if (!leader && Date.now() - lastLeaderHeartbeat > LEADER_TIMEOUT_MS) {
          claimLeadership()
        }
      },
      LEADER_TIMEOUT_MS + Math.random() * 500
    )

    startHeartbeat()
    startLeaderCheck()

    // 탭 종료 시 알림
    window.addEventListener("beforeunload", () => {
      broadcast({ type: "TAB_CLOSING", tabId })
    })
  } else {
    // BroadcastChannel 미지원 시 항상 리더
    setLeader(true)
  }

  return {
    tabId,
    isLeader: () => leader,
    broadcast,
    onMessage(handler) {
      messageHandlers.push(handler)
    },
    onLeaderChange(handler) {
      leaderChangeHandlers.push(handler)
    },
    destroy() {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer)
        heartbeatTimer = null
      }
      if (leaderCheckTimer) {
        clearInterval(leaderCheckTimer)
        leaderCheckTimer = null
      }
      broadcast({ type: "TAB_CLOSING", tabId })
      channel?.close()
      channel = null
      messageHandlers.length = 0
      leaderChangeHandlers.length = 0
    },
  }
}
