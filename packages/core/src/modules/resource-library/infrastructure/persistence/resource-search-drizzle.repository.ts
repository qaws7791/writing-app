import { sql } from "drizzle-orm"

import type {
  ResourceSearchRecord,
  ResourceSearchRepository,
} from "@workspace/core/modules/resource-library/application/ports/resource-search.repository"
import {
  toResourceDocumentId,
  toResourceFolderId,
} from "@workspace/core/modules/resource-library/domain/resource-tree-node"
import { parseResourceBreadcrumbPath } from "@workspace/core/modules/resource-library/infrastructure/persistence/resource-library-drizzle.persistence"
import type { WritingAppDatabase } from "@workspace/db/client"

type ResourceSearchQueryRow = {
  readonly excerpt: string
  readonly kind: ResourceSearchRecord["kind"]
  readonly name: string
  readonly node_id: string
  readonly path_json: string
}

export function createDrizzleResourceSearchRepository(
  db: WritingAppDatabase
): ResourceSearchRepository {
  return {
    async search(input) {
      const query = createResourceFtsQuery(input.query)

      if (query === null) {
        return []
      }

      const status = input.scope === "active" ? "active" : "archived"
      const rows = db.all<ResourceSearchQueryRow>(sql`
        WITH RECURSIVE paths(id, path_json) AS (
          SELECT id, json_array()
          FROM admin_resource_nodes
          WHERE parent_id IS NULL

          UNION ALL

          SELECT
            child.id,
            json_insert(
              parent.path_json,
              '$[#]',
              json_object('id', parent_node.id, 'name', parent_node.name)
            )
          FROM admin_resource_nodes AS child
          INNER JOIN paths AS parent ON child.parent_id = parent.id
          INNER JOIN admin_resource_nodes AS parent_node ON parent_node.id = parent.id
        ),
        matches AS (
          SELECT
            admin_resource_search.node_id,
            admin_resource_search.kind,
            admin_resource_search.name,
            snippet(admin_resource_search, 3, '', '', ' … ', 12) AS excerpt,
            node.updated_at
          FROM admin_resource_search
          INNER JOIN admin_resource_nodes AS node
            ON node.id = admin_resource_search.node_id
          WHERE admin_resource_search MATCH ${query}
            AND node.status = ${status}
          ORDER BY bm25(admin_resource_search), node.updated_at DESC, node.id
          LIMIT ${input.limit}
        )
        SELECT
          matches.node_id,
          matches.kind,
          matches.name,
          matches.excerpt,
          paths.path_json
        FROM matches
        INNER JOIN paths ON paths.id = matches.node_id
      `)

      return rows.map(toResourceSearchRecord)
    },
  }
}

function createResourceFtsQuery(query: string): string | null {
  const tokens = query.normalize("NFC").trim().split(/\s+/u).filter(Boolean)

  if (tokens.length === 0) {
    return null
  }

  return tokens
    .map((token) => `"${token.replaceAll('"', '""')}"*`)
    .join(" AND ")
}

function toResourceSearchRecord(
  row: ResourceSearchQueryRow
): ResourceSearchRecord {
  const path = parseResourceBreadcrumbPath(row.path_json)

  return row.kind === "folder"
    ? {
        excerpt: null,
        id: toResourceFolderId(row.node_id),
        kind: row.kind,
        name: row.name,
        path,
      }
    : {
        excerpt: row.excerpt.trim().length === 0 ? null : row.excerpt.trim(),
        id: toResourceDocumentId(row.node_id),
        kind: row.kind,
        name: row.name,
        path,
      }
}
