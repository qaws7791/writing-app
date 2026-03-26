import Dexie, { type Table } from "dexie"

import type { LocalDocument, LocalVersion, PendingTransaction } from "./types"

const DATABASE_NAME = "writing-sync"
const DATABASE_VERSION = 1

class WritingSyncDatabase extends Dexie {
  documents!: Table<LocalDocument, number>
  pendingTransactions!: Table<PendingTransaction, number>
  versions!: Table<LocalVersion, number>

  constructor() {
    super(DATABASE_NAME)

    this.version(DATABASE_VERSION).stores({
      documents: "writingId, syncStatus, lastModifiedAt",
      pendingTransactions: "++id, writingId, status, createdAt",
      versions: "++id, writingId, version",
    })
  }
}

let dbInstance: WritingSyncDatabase | null = null

export function getLocalDb(): WritingSyncDatabase {
  if (!dbInstance) {
    dbInstance = new WritingSyncDatabase()
  }
  return dbInstance
}

export async function getDocument(
  writingId: number
): Promise<LocalDocument | undefined> {
  return getLocalDb().documents.get(writingId)
}

export async function putDocument(doc: LocalDocument): Promise<void> {
  await getLocalDb().documents.put(doc)
}

export async function enqueuePendingTransaction(
  tx: Omit<PendingTransaction, "id">
): Promise<number> {
  return getLocalDb().pendingTransactions.add(tx as PendingTransaction)
}

export async function getPendingTransactions(
  writingId: number
): Promise<PendingTransaction[]> {
  return getLocalDb()
    .pendingTransactions.where("writingId")
    .equals(writingId)
    .sortBy("createdAt")
}

export async function getPendingTransactionsByStatus(
  writingId: number,
  status: PendingTransaction["status"]
): Promise<PendingTransaction[]> {
  return getLocalDb()
    .pendingTransactions.where(["writingId", "status"])
    .equals([writingId, status])
    .sortBy("createdAt")
}

export async function updateTransactionStatus(
  ids: number[],
  status: PendingTransaction["status"]
): Promise<void> {
  // Dexie's KeyPaths type can't handle recursive TiptapNode in Operation
  await (getLocalDb().pendingTransactions as Table).bulkUpdate(
    ids.map((id) => ({ key: id, changes: { status } }))
  )
}

export async function deletePendingTransactions(ids: number[]): Promise<void> {
  await getLocalDb().pendingTransactions.bulkDelete(ids)
}

export async function deleteAllPendingTransactions(
  writingId: number
): Promise<void> {
  await getLocalDb()
    .pendingTransactions.where("writingId")
    .equals(writingId)
    .delete()
}

export async function getPendingCount(writingId: number): Promise<number> {
  return getLocalDb()
    .pendingTransactions.where("writingId")
    .equals(writingId)
    .count()
}

export async function putLocalVersion(
  version: Omit<LocalVersion, "id">
): Promise<void> {
  const db = getLocalDb()

  // 최대 50개 유지
  const count = await db.versions
    .where("writingId")
    .equals(version.writingId)
    .count()

  if (count >= 50) {
    const oldest = await db.versions
      .where("writingId")
      .equals(version.writingId)
      .sortBy("version")

    const toDelete = oldest.slice(0, count - 49)
    await db.versions.bulkDelete(toDelete.map((v) => v.id!).filter(Boolean))
  }

  await db.versions.add(version as LocalVersion)
}

export async function getLocalVersions(
  writingId: number
): Promise<LocalVersion[]> {
  return getLocalDb()
    .versions.where("writingId")
    .equals(writingId)
    .reverse()
    .sortBy("version")
}

export type { WritingSyncDatabase }
