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
      documents: "draftId, syncStatus, lastModifiedAt",
      pendingTransactions: "++id, draftId, status, createdAt",
      versions: "++id, draftId, version",
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
  draftId: number
): Promise<LocalDocument | undefined> {
  return getLocalDb().documents.get(draftId)
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
  draftId: number
): Promise<PendingTransaction[]> {
  return getLocalDb()
    .pendingTransactions.where("draftId")
    .equals(draftId)
    .sortBy("createdAt")
}

export async function getPendingTransactionsByStatus(
  draftId: number,
  status: PendingTransaction["status"]
): Promise<PendingTransaction[]> {
  return getLocalDb()
    .pendingTransactions.where(["draftId", "status"])
    .equals([draftId, status])
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
  draftId: number
): Promise<void> {
  await getLocalDb()
    .pendingTransactions.where("draftId")
    .equals(draftId)
    .delete()
}

export async function getPendingCount(draftId: number): Promise<number> {
  return getLocalDb()
    .pendingTransactions.where("draftId")
    .equals(draftId)
    .count()
}

export async function putLocalVersion(
  version: Omit<LocalVersion, "id">
): Promise<void> {
  const db = getLocalDb()

  // 최대 50개 유지
  const count = await db.versions
    .where("draftId")
    .equals(version.draftId)
    .count()

  if (count >= 50) {
    const oldest = await db.versions
      .where("draftId")
      .equals(version.draftId)
      .sortBy("version")

    const toDelete = oldest.slice(0, count - 49)
    await db.versions.bulkDelete(toDelete.map((v) => v.id!).filter(Boolean))
  }

  await db.versions.add(version as LocalVersion)
}

export async function getLocalVersions(
  draftId: number
): Promise<LocalVersion[]> {
  return getLocalDb()
    .versions.where("draftId")
    .equals(draftId)
    .reverse()
    .sortBy("version")
}

export type { WritingSyncDatabase }
