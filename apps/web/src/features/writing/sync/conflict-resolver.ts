import type { WritingContent } from "@/domain/writing"

import type { LocalDocument } from "./types"
import { deleteAllPendingTransactions, putDocument } from "./local-db"

export type ConflictData = {
  serverVersion: number
  serverContent: WritingContent
  serverTitle: string
}

/**
 * 단일 사용자 환경에서의 충돌 해결.
 * 멀티 탭/디바이스 시나리오에서 서버가 409를 반환하면
 * 서버의 최신 상태를 채택하고 로컬 보류 트랜잭션을 초기화한다.
 * (Last-Writer-Wins: 가장 최근 동기화 성공한 쪽이 우선)
 */
export async function resolveConflict(
  writingId: number,
  conflictResponse: ConflictData
): Promise<LocalDocument> {
  const resolvedDoc: LocalDocument = {
    writingId,
    title: conflictResponse.serverTitle,
    content: conflictResponse.serverContent,
    baseVersion: conflictResponse.serverVersion,
    localVersion: conflictResponse.serverVersion,
    lastModifiedAt: new Date().toISOString(),
    syncStatus: "synced",
  }

  await deleteAllPendingTransactions(writingId)
  await putDocument(resolvedDoc)

  return resolvedDoc
}

/**
 * 서버에서 가져온 최신 상태로 로컬 문서를 동기화한다.
 * 보류 트랜잭션이 없는 경우에만 사용.
 */
export async function applyServerState(
  writingId: number,
  serverVersion: number,
  serverTitle: string,
  serverContent: WritingContent
): Promise<LocalDocument> {
  const doc: LocalDocument = {
    writingId,
    title: serverTitle,
    content: serverContent,
    baseVersion: serverVersion,
    localVersion: serverVersion,
    lastModifiedAt: new Date().toISOString(),
    syncStatus: "synced",
  }

  await putDocument(doc)
  return doc
}
