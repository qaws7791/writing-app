import { sql } from "drizzle-orm"

import type {
  ResourceSearchRecord,
  ResourceSearchRepository,
} from "@workspace/core/resource-library"
import {
  parseResourceBreadcrumbPath,
  toResourceDocumentId,
} from "@workspace/core/resource-library"
import type { WritingAppDatabase } from "@workspace/db/client"

type ResourceSearchQueryRow = {
  readonly excerpt: string
  readonly name: string
  readonly node_id: string
  readonly path_json: string
  readonly version: number
}

export function createDrizzleResourceSearchRepository(
  db: WritingAppDatabase
): ResourceSearchRepository {
  return {
    async search(input) {
      const query = createResourceFtsQuery(input.query)
      if (query === null) return []

      return db
        .all<ResourceSearchQueryRow>(sql`
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
              admin_resource_search.name,
              snippet(admin_resource_search, 2, '', '', ' … ', 12) AS excerpt,
              node.updated_at,
              document.version
            FROM admin_resource_search
            INNER JOIN admin_resource_nodes AS node
              ON node.id = admin_resource_search.node_id
            INNER JOIN admin_resource_documents AS document ON document.node_id = node.id
            WHERE admin_resource_search MATCH ${query}
              AND node.status = 'active'
            ORDER BY bm25(admin_resource_search), node.updated_at DESC, node.id
            LIMIT ${input.limit}
          )
          SELECT matches.node_id, matches.name, matches.excerpt,
            matches.version, paths.path_json
          FROM matches
          INNER JOIN paths ON paths.id = matches.node_id
        `)
        .map(toResourceSearchRecord)
    },
  }
}

function createResourceFtsQuery(query: string): string | null {
  const tokens = query.normalize("NFC").trim().split(/\s+/u).filter(Boolean)
  return tokens.length === 0
    ? null
    : tokens.map((token) => `"${token.replaceAll('"', '""')}"*`).join(" AND ")
}

function toResourceSearchRecord(
  row: ResourceSearchQueryRow
): ResourceSearchRecord {
  return {
    excerpt: row.excerpt.trim().length === 0 ? null : row.excerpt.trim(),
    id: toResourceDocumentId(row.node_id),
    name: row.name,
    path: parseResourceBreadcrumbPath(row.path_json),
    version: row.version,
  }
}
