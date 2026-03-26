import { resolveBrowserApiBaseUrl } from "@/foundation/lib/api-base-url"
import { env } from "@/foundation/config/env"

const SYNC_TAG = "writing-sync"

let registration: ServiceWorkerRegistration | null = null

function resolveApiBaseUrl(): string | null {
  const envBaseUrl = env.NEXT_PUBLIC_API_BASE_URL
  if (!envBaseUrl) return null
  return resolveBrowserApiBaseUrl(envBaseUrl)
}

function sendApiBaseUrl(target: ServiceWorker | null) {
  if (!target) return
  const url = resolveApiBaseUrl()
  if (url) target.postMessage({ type: "SET_API_BASE_URL", url })
}

/** 서비스 워커를 등록하고 Background Sync를 활성화한다 */
export async function registerSyncServiceWorker(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

  try {
    registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    })
    sendApiBaseUrl(registration.active)
  } catch {
    // 서비스 워커 등록 실패 시 무시 (기능 저하)
  }
}

/** 오프라인 복귀 시 Background Sync를 요청한다 */
export function requestBackgroundSync(): void {
  if (!registration) return

  sendApiBaseUrl(registration.active)

  if ("sync" in registration) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(registration as any).sync.register(SYNC_TAG).catch(() => {
      // Background Sync API 미지원
    })
  } else {
    // fallback: 서비스 워커에 직접 메시지
    registration.active?.postMessage({ type: "REGISTER_SYNC" })
  }
}

/** 서비스 워커로부터의 메시지를 수신한다 */
export function onServiceWorkerMessage(
  handler: (data: {
    type: string
    writingId?: number
    version?: number
  }) => void
): () => void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return () => {}
  }

  const listener = (event: MessageEvent) => {
    if (event.data && typeof event.data.type === "string") {
      handler(event.data)
    }
  }

  navigator.serviceWorker.addEventListener("message", listener)
  return () => navigator.serviceWorker.removeEventListener("message", listener)
}
