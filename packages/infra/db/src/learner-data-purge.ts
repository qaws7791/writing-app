import type { WritingAppDatabase } from "#db/client"

export type WritingAppDatabaseTransaction = Parameters<
  Parameters<WritingAppDatabase["transaction"]>[0]
>[0]

/**
 * 학습자 데이터를 저장하는 module이 자기 table만 지우는 계약.
 * 삭제 순서를 FK 의존에 맞추고 한 transaction 안에서 원자적으로 실행하기 위해
 * 조립 지점이 순서를 정한 배열로 순회한다.
 */
export type LearnerDataPurgePort = Readonly<{
  moduleName: string
  purge: (
    transaction: WritingAppDatabaseTransaction,
    userIds: readonly string[]
  ) => void
}>
