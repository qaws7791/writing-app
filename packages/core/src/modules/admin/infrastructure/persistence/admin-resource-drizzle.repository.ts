import type {
  AdminArchiveResourceDocumentResultDto,
  AdminDeleteResourceDocumentResultDto,
  AdminResourceDocumentDetailDto,
  AdminResourceDocumentListDto,
  AdminTiptapDocument,
} from "@workspace/core/modules/admin/domain/admin.dto"
import type {
  ArchiveAdminResourceDocumentInput,
  CreateAdminResourceDocumentInput,
  DeleteAdminResourceDocumentInput,
  ResourceAdminRepository,
  ReadAdminResourceDocumentInput,
  ReadAdminResourceDocumentsInput,
  UpdateAdminResourceDocumentInput,
} from "@workspace/core/modules/admin/application/ports/admin.repository"
import { adminTiptapDocumentSchema } from "@workspace/contracts/admin"
import { contentStatuses } from "@workspace/core/shared/kernel/status"
import { and, count, desc, eq, or, sql } from "drizzle-orm"

import type { WritingAppDatabase } from "@workspace/db/client"
import { adminAuthUsers, adminResourceDocuments } from "@workspace/db/schema"
import { createPageBounds } from "@workspace/core/modules/admin/infrastructure/persistence/admin-repository-shared"

type ResourceDocumentRow = typeof adminResourceDocuments.$inferSelect

type ResourceDocumentWithAuthorRow = {
  readonly authorEmail: string
  readonly authorId: string
  readonly authorName: string
  readonly contentJson: string
  readonly createdAt: Date
  readonly excerpt: string
  readonly id: string
  readonly status: ResourceDocumentRow["status"]
  readonly title: string
  readonly updatedAt: Date
}

export function createAdminResourceRepository(
  db: WritingAppDatabase
): ResourceAdminRepository {
  return {
    archiveResourceDocument(input) {
      return Promise.resolve(archiveResourceDocument(db, input))
    },
    createResourceDocument(input) {
      return Promise.resolve(createResourceDocument(db, input))
    },
    deleteResourceDocument(input) {
      return Promise.resolve(deleteResourceDocument(db, input))
    },
    readResourceDocument(input) {
      return Promise.resolve(readResourceDocument(db, input))
    },
    readResourceDocuments(input) {
      return Promise.resolve(readResourceDocuments(db, input))
    },
    updateResourceDocument(input) {
      return Promise.resolve(updateResourceDocument(db, input))
    },
  }
}

function readResourceDocuments(
  db: WritingAppDatabase,
  input: ReadAdminResourceDocumentsInput
): AdminResourceDocumentListDto {
  const query = input.query.trim().toLowerCase()
  const whereCondition = createResourceDocumentsWhereCondition({
    query,
    status: input.status,
  })
  const totalItems =
    db
      .select({ value: count() })
      .from(adminResourceDocuments)
      .where(whereCondition)
      .get()?.value ?? 0
  const pagination = createPageBounds(input, totalItems)
  const rows = db
    .select({
      authorEmail: adminAuthUsers.email,
      authorId: adminAuthUsers.id,
      authorName: adminAuthUsers.name,
      contentJson: adminResourceDocuments.contentJson,
      createdAt: adminResourceDocuments.createdAt,
      excerpt: adminResourceDocuments.excerpt,
      id: adminResourceDocuments.id,
      status: adminResourceDocuments.status,
      title: adminResourceDocuments.title,
      updatedAt: adminResourceDocuments.updatedAt,
    })
    .from(adminResourceDocuments)
    .innerJoin(
      adminAuthUsers,
      eq(adminAuthUsers.id, adminResourceDocuments.authorId)
    )
    .where(whereCondition)
    .orderBy(desc(adminResourceDocuments.updatedAt))
    .limit(pagination.pageSize)
    .offset(pagination.offset)
    .all()

  return {
    items: rows.map(toResourceDocumentListItemDto),
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems: pagination.totalItems,
      totalPages: pagination.totalPages,
    },
  }
}

function readResourceDocument(
  db: WritingAppDatabase,
  input: ReadAdminResourceDocumentInput
): AdminResourceDocumentDetailDto | null {
  const row = db
    .select({
      authorEmail: adminAuthUsers.email,
      authorId: adminAuthUsers.id,
      authorName: adminAuthUsers.name,
      contentJson: adminResourceDocuments.contentJson,
      createdAt: adminResourceDocuments.createdAt,
      excerpt: adminResourceDocuments.excerpt,
      id: adminResourceDocuments.id,
      status: adminResourceDocuments.status,
      title: adminResourceDocuments.title,
      updatedAt: adminResourceDocuments.updatedAt,
    })
    .from(adminResourceDocuments)
    .innerJoin(
      adminAuthUsers,
      eq(adminAuthUsers.id, adminResourceDocuments.authorId)
    )
    .where(eq(adminResourceDocuments.id, input.documentId))
    .get()

  return row === undefined ? null : toResourceDocumentDetailDto(row)
}

function createResourceDocument(
  db: WritingAppDatabase,
  input: CreateAdminResourceDocumentInput
): AdminResourceDocumentDetailDto {
  const content = adminTiptapDocumentSchema.parse(input.content)
  const id = `admin-resource-${crypto.randomUUID()}`

  db.insert(adminResourceDocuments)
    .values({
      authorId: input.adminId,
      contentJson: JSON.stringify(content),
      createdAt: input.now,
      excerpt: createExcerpt(content),
      id,
      status: contentStatuses.active,
      title: input.title,
      updatedAt: input.now,
    })
    .run()

  const created = readResourceDocument(db, { documentId: id })

  if (created === null) {
    throw new Error("Created admin resource document was not found")
  }

  return created
}

function updateResourceDocument(
  db: WritingAppDatabase,
  input: UpdateAdminResourceDocumentInput
): AdminResourceDocumentDetailDto | null {
  const content = adminTiptapDocumentSchema.parse(input.content)
  const existing = db
    .select({ id: adminResourceDocuments.id })
    .from(adminResourceDocuments)
    .where(eq(adminResourceDocuments.id, input.documentId))
    .get()

  if (existing === undefined) {
    return null
  }

  db.update(adminResourceDocuments)
    .set({
      contentJson: JSON.stringify(content),
      excerpt: createExcerpt(content),
      title: input.title,
      updatedAt: input.now,
    })
    .where(eq(adminResourceDocuments.id, input.documentId))
    .run()

  return readResourceDocument(db, { documentId: input.documentId })
}

function archiveResourceDocument(
  db: WritingAppDatabase,
  input: ArchiveAdminResourceDocumentInput
) {
  const existing = db
    .select({
      authorId: adminResourceDocuments.authorId,
      id: adminResourceDocuments.id,
    })
    .from(adminResourceDocuments)
    .where(eq(adminResourceDocuments.id, input.documentId))
    .get()

  if (existing === undefined) {
    return { kind: "not-found" } as const
  }

  if (existing.authorId !== input.adminId) {
    return { kind: "forbidden" } as const
  }

  db.update(adminResourceDocuments)
    .set({
      status: contentStatuses.archived,
      updatedAt: input.now,
    })
    .where(eq(adminResourceDocuments.id, input.documentId))
    .run()

  return {
    kind: "ok",
    value: { archived: true } satisfies AdminArchiveResourceDocumentResultDto,
  } as const
}

function deleteResourceDocument(
  db: WritingAppDatabase,
  input: DeleteAdminResourceDocumentInput
) {
  const existing = db
    .select({
      authorId: adminResourceDocuments.authorId,
      id: adminResourceDocuments.id,
    })
    .from(adminResourceDocuments)
    .where(eq(adminResourceDocuments.id, input.documentId))
    .get()

  if (existing === undefined) {
    return { kind: "not-found" } as const
  }

  if (existing.authorId !== input.adminId) {
    return { kind: "forbidden" } as const
  }

  db.delete(adminResourceDocuments)
    .where(eq(adminResourceDocuments.id, input.documentId))
    .run()

  return {
    kind: "ok",
    value: { deleted: true } satisfies AdminDeleteResourceDocumentResultDto,
  } as const
}

function createResourceDocumentsWhereCondition({
  query,
  status,
}: {
  readonly query: string
  readonly status: ReadAdminResourceDocumentsInput["status"]
}) {
  const statusCondition =
    status === "all" ? undefined : eq(adminResourceDocuments.status, status)
  const queryCondition =
    query.length === 0
      ? undefined
      : or(
          sql`lower(${adminResourceDocuments.title}) like ${`%${query}%`}`,
          sql`lower(${adminResourceDocuments.excerpt}) like ${`%${query}%`}`
        )

  return and(statusCondition, queryCondition)
}

function toResourceDocumentListItemDto(
  row: ResourceDocumentWithAuthorRow
): AdminResourceDocumentListDto["items"][number] {
  return {
    author: {
      email: row.authorEmail,
      id: row.authorId,
      name: row.authorName,
    },
    createdAt: row.createdAt.toISOString(),
    excerpt: row.excerpt,
    id: row.id,
    status: row.status,
    title: row.title,
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toResourceDocumentDetailDto(
  row: ResourceDocumentWithAuthorRow
): AdminResourceDocumentDetailDto {
  return {
    ...toResourceDocumentListItemDto(row),
    content: adminTiptapDocumentSchema.parse(JSON.parse(row.contentJson)),
  }
}

function createExcerpt(content: AdminTiptapDocument): string {
  const text = content.content
    .flatMap((node) => node.content?.map((child) => child.text) ?? [])
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()

  return text.length === 0 ? "내용 없음" : text.slice(0, 160)
}
