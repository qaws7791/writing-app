import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

import { applyUpdate, Doc, encodeStateAsUpdate, mergeUpdates } from "yjs"

import { createResourceDocumentSyncUseCase } from "#core/modules/resource-library/application/use-cases/resource-document-sync.use-case"
import { toResourceDocumentTransactionId } from "#core/modules/resource-library/domain/resource-document-sync"
import { toResourceDocumentId } from "#core/modules/resource-library/domain/resource-tree-node"
import { createDrizzleResourceDocumentSyncRepository } from "#core/modules/resource-library/infrastructure/persistence/resource-document-sync-drizzle.repository"
import {
  createHeadlessResourceDocumentCollaboration,
  createResourceDocumentSnapshot,
  projectResourceDocumentSnapshot,
  readResourceDocumentMarkdown,
  replaceResourceDocumentMarkdown,
} from "@workspace/resource-document"
import {
  createWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"

const clientCount = 20
const connectionCount = 2
const maximumAttemptsPerClient = 25
const workloadDocumentId = toResourceDocumentId("load-document")
const lockDocumentId = toResourceDocumentId("lock-document")

export type ResourceDocumentLoadMetrics = {
  readonly acceptedTransactions: number
  readonly busyCount: number
  readonly busyRetryCount: number
  readonly clientCount: number
  readonly connectionCount: number
  readonly convergenceCount: number
  readonly latencyMilliseconds: {
    readonly p50: number
    readonly p95: number
    readonly p99: number
  }
  readonly maximumAttemptsPerClient: number
  readonly retryCount: number
  readonly snapshotFallbackCount: number
}

export async function createTwoClientBrowserConvergenceFixture() {
  const fixture = createLoadFixture()
  const initial = createResourceDocumentSnapshot("초기 본문")
  if (initial.status !== "valid") {
    await fixture.close()
    throw new Error("브라우저 fixture의 초기 snapshot을 만들 수 없습니다.")
  }
  seedLoadFixture(fixture.connections[0], initial.snapshot)
  const clients = [
    createLogicalClient(initial.snapshot, 0),
    createLogicalClient(initial.snapshot, 1),
  ] as const
  const retryCounter = { value: 0 }

  return {
    async close() {
      for (const client of clients) client.document.destroy()
      await fixture.close()
    },
    async converge(clientIndex: 0 | 1) {
      const sync = await fixture.services[clientIndex]?.readSync({
        afterStateVersion: 0,
        documentId: workloadDocumentId,
      })
      if (sync?.kind !== "updates") {
        throw new Error("브라우저 fixture가 증분 update를 읽지 못했습니다.")
      }
      const client = clients[clientIndex]
      for (const update of sync.updates) applyUpdate(client.document, update)
      const snapshot = encodeStateAsUpdate(client.document)
      const projection = projectResourceDocumentSnapshot(snapshot)
      if (projection.status !== "valid") {
        throw new Error("브라우저 fixture의 client 투영에 실패했습니다.")
      }
      return {
        markdown: projection.markdown,
        stateBase64: Buffer.from(snapshot).toString("base64"),
      }
    },
    async submit(clientIndex: 0 | 1) {
      return saveWithBoundedRetry({
        actorId: `load-admin-${clientIndex}`,
        retryCounter,
        service: fixture.services[clientIndex],
        transactionId: `browser-transaction-${clientIndex}`,
        update: clients[clientIndex].update,
      })
    },
  }
}

export async function runResourceDocumentLoadIteration(): Promise<ResourceDocumentLoadMetrics> {
  const fixture = createLoadFixture()
  const initial = createResourceDocumentSnapshot("초기 본문")
  if (initial.status !== "valid") {
    await fixture.close()
    throw new Error("부하 fixture의 초기 snapshot을 만들 수 없습니다.")
  }

  try {
    seedLoadFixture(fixture.connections[0], initial.snapshot)
    const clients = Array.from({ length: clientCount }, (_, index) =>
      createLogicalClient(initial.snapshot, index)
    )
    const retryCounter = { value: 0 }

    const submissions = await Promise.all(
      clients.map(async (client, index) => {
        const startedAt = performance.now()
        const result = await saveWithBoundedRetry({
          actorId: `load-admin-${index}`,
          service: fixture.services[index % connectionCount],
          transactionId: `load-transaction-${index}`,
          update: client.update,
          retryCounter,
        })
        return {
          durationMilliseconds: performance.now() - startedAt,
          result,
        }
      })
    )

    const sync = await fixture.services[0]?.readSync({
      afterStateVersion: 0,
      documentId: workloadDocumentId,
    })
    if (sync?.kind !== "updates" || sync.updates.length !== clientCount) {
      throw new Error("20-client 증분 update를 모두 읽지 못했습니다.")
    }
    const durable = await fixture.services[0]?.readSync({
      afterStateVersion: 0,
      documentId: workloadDocumentId,
      mode: "snapshot",
    })
    if (durable?.kind !== "snapshot") {
      throw new Error("20-client durable snapshot을 읽지 못했습니다.")
    }

    const durableProjection = projectResourceDocumentSnapshot(durable.snapshot)
    if (durableProjection.status !== "valid") {
      throw new Error("20-client durable snapshot 투영에 실패했습니다.")
    }
    const durableState = Buffer.from(durable.snapshot).toString("base64")
    let convergenceCount = 0
    for (const client of clients) {
      for (const update of sync.updates) applyUpdate(client.document, update)
      const clientProjection = projectResourceDocumentSnapshot(
        encodeStateAsUpdate(client.document)
      )
      if (
        clientProjection.status === "valid" &&
        clientProjection.markdown === durableProjection.markdown &&
        Buffer.from(encodeStateAsUpdate(client.document)).toString("base64") ===
          durableState
      ) {
        convergenceCount += 1
      }
      client.document.destroy()
    }

    fixture.connections[0]?.sqlite
      .query(
        `DELETE FROM admin_resource_collaboration_updates
         WHERE document_id = ?1 AND state_version = 1`
      )
      .run(workloadDocumentId)
    const fallback = await fixture.services[0]?.readSync({
      afterStateVersion: 0,
      documentId: workloadDocumentId,
    })
    const lockMetrics = await injectFileLockFault(fixture, initial.snapshot)
    const durations = submissions.map(({ durationMilliseconds }) =>
      round(durationMilliseconds)
    )

    return {
      acceptedTransactions: submissions.filter(
        ({ result }) => result.kind === "accepted"
      ).length,
      busyCount: lockMetrics.busyCount,
      busyRetryCount: lockMetrics.retryCount,
      clientCount,
      connectionCount,
      convergenceCount,
      latencyMilliseconds: {
        p50: percentile(durations, 50),
        p95: percentile(durations, 95),
        p99: percentile(durations, 99),
      },
      maximumAttemptsPerClient,
      retryCount: retryCounter.value + lockMetrics.retryCount,
      snapshotFallbackCount: fallback?.kind === "snapshot" ? 1 : 0,
    }
  } finally {
    await fixture.close()
  }
}

function createLoadFixture() {
  const directory = mkdtempSync(join(tmpdir(), "writing-app-resource-load-"))
  const databasePath = join(directory, "resource-load.sqlite")
  const connections = [
    createWritingAppDatabase(databasePath),
    createWritingAppDatabase(databasePath),
  ] as const
  runBaselineMigration(connections[0].sqlite)

  return {
    connections,
    services: connections.map((connection) =>
      createResourceDocumentSyncUseCase(
        createDrizzleResourceDocumentSyncRepository(connection.db)
      )
    ),
    async close() {
      const resolvedDirectory = resolve(directory)
      const resolvedTemporaryRoot = resolve(tmpdir())
      if (!resolvedDirectory.startsWith(`${resolvedTemporaryRoot}\\`)) {
        throw new Error(
          "부하 fixture 임시 경로가 시스템 임시 디렉터리를 벗어났습니다."
        )
      }
      connections[1].close()
      try {
        connections[0].sqlite.exec("PRAGMA wal_checkpoint(TRUNCATE)")
      } catch (error) {
        if (!isSqliteBusy(error)) throw error
      }
      connections[0].close()
      Bun.gc(true)
      await removeTemporaryDirectory(resolvedDirectory)
    },
  }
}

function seedLoadFixture(
  connection: WritingAppDatabaseClient,
  snapshot: Uint8Array
): void {
  const insertAdmin = connection.sqlite.query(`
    INSERT INTO admin_user (
      id, name, email, email_verified, role, created_at, updated_at
    ) VALUES (?1, ?2, ?3, 1, 'operator', 1, 1)
  `)
  for (let index = 0; index < clientCount; index += 1) {
    insertAdmin.run(
      `load-admin-${index}`,
      `부하 관리자 ${index}`,
      `load-admin-${index}@example.com`
    )
  }

  const insertNode = connection.sqlite.query(`
    INSERT INTO admin_resource_nodes (
      id, kind, parent_id, name, normalized_name, sort_order, status,
      trash_root_id, created_by, updated_by, created_at, updated_at
    ) VALUES (?1, 'document', NULL, ?2, ?2, ?3, 'active', NULL,
      'load-admin-0', 'load-admin-0', 1, 1)
  `)
  const insertDocument = connection.sqlite.query(`
    INSERT INTO admin_resource_documents (
      node_id, content_markdown, content_revision
    ) VALUES (?1, '초기 본문', 0)
  `)
  const insertSearch = connection.sqlite.query(`
    INSERT INTO admin_resource_search (node_id, kind, name, body_text)
    VALUES (?1, 'document', ?2, '초기 본문')
  `)
  const insertCollaboration = connection.sqlite.query(`
    INSERT INTO admin_resource_collaboration (
      document_id, yjs_state, state_version, projected_at
    ) VALUES (?1, ?2, 0, 1)
  `)
  for (const [index, documentId] of [
    workloadDocumentId,
    lockDocumentId,
  ].entries()) {
    const name = `부하 문서 ${index}`
    insertNode.run(documentId, name, index)
    insertDocument.run(documentId)
    insertSearch.run(documentId, name)
    insertCollaboration.run(documentId, Buffer.from(snapshot))
  }
}

function createLogicalClient(initialSnapshot: Uint8Array, index: number) {
  const update = createMarkdownUpdate(
    initialSnapshot,
    `초기 본문\n\n클라이언트 ${index}`,
    `load-client-${index}`
  )
  const document = new Doc()
  applyUpdate(document, initialSnapshot)
  applyUpdate(document, update)
  return { document, update }
}

async function saveWithBoundedRetry(input: {
  readonly actorId: string
  readonly retryCounter: { value: number }
  readonly service:
    | ReturnType<typeof createResourceDocumentSyncUseCase>
    | undefined
  readonly transactionId: string
  readonly update: Uint8Array
}) {
  if (input.service === undefined) throw new Error("부하 connection 누락")
  let knownStateVersion = 0
  for (let attempt = 1; attempt <= maximumAttemptsPerClient; attempt += 1) {
    const result = await input.service.saveTransaction({
      actorId: input.actorId,
      documentId: workloadDocumentId,
      knownStateVersion,
      now: new Date(1_000 + attempt),
      transactionId: toResourceDocumentTransactionId(input.transactionId),
      update: input.update,
    })
    if (result.kind === "accepted" || result.kind === "already-accepted") {
      return result
    }
    if (result.kind !== "stale-state-version") {
      throw new Error(`부하 transaction이 거부되었습니다: ${result.kind}`)
    }
    knownStateVersion = result.actualStateVersion
    input.retryCounter.value += 1
    await Bun.sleep(Math.min(attempt * 5, 50))
  }
  throw new Error(
    `부하 transaction 재시도 상한(${maximumAttemptsPerClient})을 초과했습니다.`
  )
}

async function injectFileLockFault(
  fixture: ReturnType<typeof createLoadFixture>,
  initialSnapshot: Uint8Array
): Promise<{ readonly busyCount: number; readonly retryCount: number }> {
  const lockOwner = fixture.connections[0]
  const contender = fixture.connections[1]
  const service = fixture.services[1]
  if (
    lockOwner === undefined ||
    contender === undefined ||
    service === undefined
  ) {
    throw new Error("잠금 fault fixture connection 누락")
  }
  const transaction = {
    actorId: "load-admin-1",
    documentId: lockDocumentId,
    knownStateVersion: 0,
    now: new Date(2_000),
    transactionId: toResourceDocumentTransactionId("lock-transaction"),
    update: createMarkdownUpdate(
      initialSnapshot,
      "잠금 복구 본문",
      "lock-client"
    ),
  }

  contender.sqlite.exec("PRAGMA busy_timeout = 25")
  lockOwner.sqlite.exec("BEGIN IMMEDIATE")
  let busyCount = 0
  try {
    await service.saveTransaction(transaction)
    throw new Error("file-backed lock fault가 SQLITE_BUSY를 만들지 못했습니다.")
  } catch (error) {
    if (!isSqliteBusy(error)) throw error
    busyCount += 1
  } finally {
    lockOwner.sqlite.exec("ROLLBACK")
    contender.sqlite.exec("PRAGMA busy_timeout = 5000")
  }

  const retry = await service.saveTransaction(transaction)
  if (retry.kind !== "accepted") {
    throw new Error(`잠금 해제 뒤 transaction 재시도 실패: ${retry.kind}`)
  }
  return { busyCount, retryCount: 1 }
}

function createMarkdownUpdate(
  snapshot: Uint8Array,
  markdown: string,
  collaborationId: string
): Uint8Array {
  const document = new Doc()
  const collaboration = createHeadlessResourceDocumentCollaboration({
    document,
    id: collaborationId,
  })
  applyUpdate(document, snapshot)
  readResourceDocumentMarkdown(collaboration.editor)
  const updates: Uint8Array[] = []
  document.on("update", (update) => updates.push(update))
  const replaced = replaceResourceDocumentMarkdown(
    collaboration.editor,
    markdown
  )
  if (replaced.status !== "valid") throw new Error("부하 update 생성 실패")
  collaboration.disconnect()
  document.destroy()
  return mergeUpdates(updates)
}

function isSqliteBusy(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as Error & { readonly code?: string }).code === "SQLITE_BUSY"
  )
}

async function removeTemporaryDirectory(directory: string): Promise<void> {
  const maximumAttempts = 20
  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      rmSync(directory, { force: true, recursive: true })
      return
    } catch (error) {
      const code =
        error instanceof Error && "code" in error
          ? (error as Error & { readonly code?: string }).code
          : undefined
      if (code !== "EBUSY" || attempt === maximumAttempts) throw error
      Bun.gc(true)
      await Bun.sleep(attempt * 50)
    }
  }
}

function percentile(
  values: readonly number[],
  percentileValue: number
): number {
  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.max(
    0,
    Math.ceil((percentileValue / 100) * sorted.length) - 1
  )
  return sorted[index] ?? 0
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
