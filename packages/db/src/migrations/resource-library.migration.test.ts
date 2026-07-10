import { describe, expect, it } from "vitest"

import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import { runResourceLibraryMigration } from "@workspace/db/migrations/resource-library.migration"

describe("자료실 schema 전환 migration", () => {
  it("legacy Tiptap 자료를 폐기하고 최종 트리·문서·협업·감사·FTS schema를 만든다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      runBaselineMigration(client.sqlite)
      insertAdminUser(client.sqlite)
      client.sqlite.exec(`
        INSERT INTO admin_resource_documents (
          id,
          title,
          content_json,
          excerpt,
          status,
          author_id,
          created_at,
          updated_at
        ) VALUES (
          'legacy-document',
          '기존 자료',
          '{"type":"doc","content":[]}',
          '기존 본문',
          'active',
          'admin-1',
          1,
          1
        );
      `)

      runResourceLibraryMigration(client.sqlite)

      expect(
        readColumnNames(client.sqlite, "admin_resource_documents")
      ).toEqual(["node_id", "content_markdown", "content_revision"])
      expect(readTableNames(client.sqlite)).toEqual(
        expect.arrayContaining([
          "admin_resource_audit_events",
          "admin_resource_collaboration",
          "admin_resource_documents",
          "admin_resource_nodes",
          "admin_resource_search",
          "admin_resource_tree_state",
        ])
      )
      expect(
        client.sqlite
          .query<{ readonly count: number }, []>(
            "SELECT count(*) AS count FROM admin_resource_documents"
          )
          .get()?.count
      ).toBe(0)
      expect(
        client.sqlite
          .query<{ readonly revision: number }, []>(
            "SELECT revision FROM admin_resource_tree_state WHERE singleton_id = 1"
          )
          .get()
      ).toEqual({ revision: 0 })
    } finally {
      client.close()
    }
  })

  it("재실행 시 최종 schema의 새 자료를 보존한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      runBaselineMigration(client.sqlite)
      insertAdminUser(client.sqlite)
      runResourceLibraryMigration(client.sqlite)
      insertResourceFolder(client.sqlite, {
        id: "folder-preserved",
        name: "보존 폴더",
        normalizedName: "보존 폴더",
      })

      runResourceLibraryMigration(client.sqlite)

      expect(
        client.sqlite
          .query<{ readonly name: string }, []>(
            "SELECT name FROM admin_resource_nodes WHERE id = 'folder-preserved'"
          )
          .get()
      ).toEqual({ name: "보존 폴더" })
    } finally {
      client.close()
    }
  })

  it("kind·status·활성 형제 이름·문서 node·singleton 무결성을 DB에서도 보장한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      runBaselineMigration(client.sqlite)
      insertAdminUser(client.sqlite)
      runResourceLibraryMigration(client.sqlite)
      insertResourceFolder(client.sqlite, {
        id: "folder-root",
        name: "루트",
        normalizedName: "루트",
      })

      expect(() =>
        insertResourceFolder(client.sqlite, {
          id: "folder-duplicate-root",
          name: " 루트 ",
          normalizedName: "루트",
        })
      ).toThrow()
      expect(() =>
        client.sqlite
          .query<void, [kind: string]>(`
          INSERT INTO admin_resource_nodes (
            id, kind, parent_id, name, normalized_name, sort_order, status,
            trash_root_id, created_by, updated_by, created_at, updated_at
          ) VALUES (
            'invalid-kind', ?, NULL, '잘못된 종류', '잘못된 종류', 0,
            'active', NULL, 'admin-1', 'admin-1', 1, 1
          );
        `)
          .run("page")
      ).toThrow()
      expect(() =>
        client.sqlite
          .query<void, [nodeId: string]>(`
          INSERT INTO admin_resource_documents (
            node_id, content_markdown, content_revision
          ) VALUES (?, '', 0);
        `)
          .run("folder-root")
      ).toThrow("문서 node만 본문을 가질 수 있습니다.")
      expect(() =>
        client.sqlite
          .query<void, [singletonId: number]>(`
          INSERT INTO admin_resource_tree_state (
            singleton_id, revision, updated_at
          ) VALUES (?, 0, 1);
        `)
          .run(2)
      ).toThrow()
    } finally {
      client.close()
    }
  })

  it("폴더 부모·하위 이름·휴지통 상태·감사 JSON 제약과 FTS5 검색을 보장한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      runBaselineMigration(client.sqlite)
      insertAdminUser(client.sqlite)
      runResourceLibraryMigration(client.sqlite)
      insertResourceFolder(client.sqlite, {
        id: "folder-parent",
        name: "부모",
        normalizedName: "부모",
      })
      insertResourceNode(client.sqlite, {
        id: "document-parent",
        kind: "document",
        name: "문서 부모",
        normalizedName: "문서 부모",
        parentId: null,
        sortOrder: 1,
      })
      client.sqlite.exec(`
        INSERT INTO admin_resource_documents (
          node_id, content_markdown, content_revision
        ) VALUES ('document-parent', '', 0);
      `)
      insertResourceNode(client.sqlite, {
        id: "folder-child",
        kind: "folder",
        name: "중복 이름",
        normalizedName: "중복 이름",
        parentId: "folder-parent",
        sortOrder: 0,
      })

      expect(() =>
        insertResourceNode(client.sqlite, {
          id: "invalid-document-child",
          kind: "folder",
          name: "잘못된 하위 폴더",
          normalizedName: "잘못된 하위 폴더",
          parentId: "document-parent",
          sortOrder: 0,
        })
      ).toThrow("자료 node의 부모는 폴더여야 합니다.")
      expect(() =>
        insertResourceNode(client.sqlite, {
          id: "duplicate-child",
          kind: "document",
          name: " 중복 이름 ",
          normalizedName: "중복 이름",
          parentId: "folder-parent",
          sortOrder: 1,
        })
      ).toThrow("UNIQUE constraint failed")
      expect(() =>
        insertResourceNode(client.sqlite, {
          id: "too-long-name",
          kind: "folder",
          name: "가".repeat(121),
          normalizedName: "가".repeat(121),
          parentId: null,
          sortOrder: 2,
        })
      ).toThrow()
      expect(() =>
        client.sqlite
          .query<void, [contentMarkdown: string]>(`
            UPDATE admin_resource_documents
            SET content_markdown = ?
            WHERE node_id = 'document-parent';
          `)
          .run("가".repeat(200_001))
      ).toThrow()

      client.sqlite.exec(`
        UPDATE admin_resource_nodes
        SET status = 'archived', trash_root_id = 'folder-child'
        WHERE id = 'folder-child';
      `)
      expect(() =>
        insertResourceNode(client.sqlite, {
          id: "replacement-child",
          kind: "document",
          name: "중복 이름",
          normalizedName: "중복 이름",
          parentId: "folder-parent",
          sortOrder: 1,
        })
      ).not.toThrow()
      expect(() =>
        client.sqlite
          .query<void, []>(`
          UPDATE admin_resource_nodes
          SET status = 'active'
          WHERE id = 'folder-child';
        `)
          .run()
      ).toThrow()
      expect(() =>
        client.sqlite
          .query<void, []>(`
          INSERT INTO admin_resource_audit_events (
            id, node_id, event_type, actor_id, payload_json, created_at
          ) VALUES (
            'invalid-audit', 'folder-parent', 'rename', 'admin-1', '{', 1
          );
        `)
          .run()
      ).toThrow()

      client.sqlite.exec(`
        INSERT INTO admin_resource_search (node_id, kind, name, body_text)
        VALUES ('replacement-child', 'document', '중복 이름', '실시간 공동 편집 안내');
      `)
      expect(
        client.sqlite
          .query<{ readonly node_id: string }, []>(`
            SELECT node_id
            FROM admin_resource_search
            WHERE admin_resource_search MATCH '공동'
          `)
          .all()
      ).toEqual([{ node_id: "replacement-child" }])
    } finally {
      client.close()
    }
  })

  it("알 수 없는 legacy 변형을 삭제하지 않고 명시적으로 거부한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      client.sqlite.exec(`
        CREATE TABLE admin_resource_documents (
          id TEXT PRIMARY KEY NOT NULL,
          unsupported_content TEXT NOT NULL
        );
        INSERT INTO admin_resource_documents (id, unsupported_content)
        VALUES ('preserved', '보존');
      `)

      expect(() => runResourceLibraryMigration(client.sqlite)).toThrow(
        "알 수 없는 admin_resource_documents schema입니다."
      )
      expect(
        client.sqlite
          .query<{ readonly unsupported_content: string }, []>(
            "SELECT unsupported_content FROM admin_resource_documents WHERE id = 'preserved'"
          )
          .get()
      ).toEqual({ unsupported_content: "보존" })
      expect(readTableNames(client.sqlite)).not.toContain(
        "admin_resource_nodes"
      )
    } finally {
      client.close()
    }
  })
})

function readColumnNames(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"],
  table: string
): readonly string[] {
  return sqlite
    .query<{ readonly name: string }, []>(`PRAGMA table_info(${table})`)
    .all()
    .map(({ name }) => name)
}

function readTableNames(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): readonly string[] {
  return sqlite
    .query<{ readonly name: string }, []>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
    )
    .all()
    .map(({ name }) => name)
}

function insertAdminUser(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"]
): void {
  sqlite.exec(`
    INSERT INTO admin_user (
      id, name, email, email_verified, role, created_at, updated_at
    ) VALUES (
      'admin-1', '관리자', 'admin@example.com', 1, 'operator', 1, 1
    );
  `)
}

function insertResourceFolder(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"],
  input: {
    readonly id: string
    readonly name: string
    readonly normalizedName: string
  }
): void {
  sqlite
    .query<void, [id: string, name: string, normalizedName: string]>(`
      INSERT INTO admin_resource_nodes (
        id, kind, parent_id, name, normalized_name, sort_order, status,
        trash_root_id, created_by, updated_by, created_at, updated_at
      ) VALUES (
        ?, 'folder', NULL, ?, ?, 0, 'active', NULL,
        'admin-1', 'admin-1', 1, 1
      );
    `)
    .run(input.id, input.name, input.normalizedName)
}

function insertResourceNode(
  sqlite: ReturnType<typeof createInMemoryWritingAppDatabase>["sqlite"],
  input: {
    readonly id: string
    readonly kind: "document" | "folder"
    readonly name: string
    readonly normalizedName: string
    readonly parentId: string | null
    readonly sortOrder: number
  }
): void {
  sqlite
    .query<
      void,
      [
        id: string,
        kind: string,
        parentId: string | null,
        name: string,
        normalizedName: string,
        sortOrder: number,
      ]
    >(`
      INSERT INTO admin_resource_nodes (
        id, kind, parent_id, name, normalized_name, sort_order, status,
        trash_root_id, created_by, updated_by, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, 'active', NULL,
        'admin-1', 'admin-1', 1, 1
      );
    `)
    .run(
      input.id,
      input.kind,
      input.parentId,
      input.name,
      input.normalizedName,
      input.sortOrder
    )
}
