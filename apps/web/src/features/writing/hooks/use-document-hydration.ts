"use client"

import { useEffect, useState } from "react"
import type { WritingContent } from "@/domain/writing"

import { getDocument, putDocument } from "@/features/writing/sync/local-db"
import { createSyncTransport } from "@/features/writing/sync/sync-transport"
import { createApiClient } from "@/foundation/api/client"

type HydrationState =
  | { status: "loading" }
  | {
      status: "ready"
      title: string
      content: WritingContent
      baseVersion: number
    }
  | { status: "error"; error: string }

type UseDocumentHydrationOptions = {
  writingId: number
  apiBaseUrl: string
  /** 서버에서 받은 초기 데이터 (SSR/RSC) */
  serverData?: {
    title: string
    content: WritingContent
    version: number
  }
}

/**
 * 에디터 초기화를 위한 문서 하이드레이션 훅.
 * 1. 로컬 DB에 캐시가 있으면 즉시 반환한다 (로컬 퍼스트).
 * 2. 서버 데이터가 주어졌으면 로컬 DB 없을 때 그것을 사용한다.
 * 3. 둘 다 없으면 서버 pull을 시도한다.
 */
export function useDocumentHydration(
  options: UseDocumentHydrationOptions
): HydrationState {
  const { writingId, apiBaseUrl, serverData } = options
  const [state, setState] = useState<HydrationState>({ status: "loading" })

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      try {
        // 1. 로컬 DB 우선
        const local = await getDocument(writingId)
        if (cancelled) return

        if (local) {
          setState({
            status: "ready",
            title: local.title,
            content: local.content,
            baseVersion: local.baseVersion,
          })
          return
        }

        // 2. SSR/RSC 서버 데이터
        if (serverData) {
          await putDocument({
            writingId,
            title: serverData.title,
            content: serverData.content,
            baseVersion: serverData.version,
            localVersion: 0,
            lastModifiedAt: new Date().toISOString(),
            syncStatus: "synced",
          })

          if (cancelled) return
          setState({
            status: "ready",
            title: serverData.title,
            content: serverData.content,
            baseVersion: serverData.version,
          })
          return
        }

        // 3. 서버 pull
        const transport = createSyncTransport({
          client: createApiClient({ baseUrl: apiBaseUrl }),
        })
        const result = await transport.pull(writingId, 0)

        if (cancelled) return

        await putDocument({
          writingId,
          title: result.title,
          content: result.content,
          baseVersion: result.version,
          localVersion: 0,
          lastModifiedAt: new Date().toISOString(),
          syncStatus: "synced",
        })

        setState({
          status: "ready",
          title: result.title,
          content: result.content,
          baseVersion: result.version,
        })
      } catch (error) {
        if (cancelled) return
        setState({
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : "문서를 불러올 수 없습니다",
        })
      }
    }

    hydrate()
    return () => {
      cancelled = true
    }
  }, [writingId, apiBaseUrl, serverData])

  return state
}
