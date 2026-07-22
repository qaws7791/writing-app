import { describe, expect, it } from "vitest"
import { createInMemoryWritingAppDatabase } from "@workspace/db/client"
import { runBaselineMigration } from "@workspace/db/migrations/migrate"
import { adminIdentityProfiles } from "@workspace/identity/schema"

import { runApiIdentitySchemaMigration } from "@/composition/identity-schema-migration"

describe("통합 API identity schema migration 조립", () => {
  it("legacy credential role을 neutral 입력으로 전달해 한 번만 backfill한다", () => {
    const client = createInMemoryWritingAppDatabase()

    try {
      runBaselineMigration(client.sqlite)
      client.sqlite.exec(`
        INSERT INTO admin_user (
          id, name, email, email_verified, image, role, created_at, updated_at
        ) VALUES (
          'legacy-owner', '기존 소유자', 'legacy-owner@example.com', 1, NULL,
          'owner', 1784678400000, 1784678400000
        );
      `)

      runApiIdentitySchemaMigration(client.sqlite)
      runApiIdentitySchemaMigration(client.sqlite)

      expect(client.db.select().from(adminIdentityProfiles).all()).toEqual([
        { adminId: "legacy-owner", role: "owner", version: 0 },
      ])
    } finally {
      client.close()
    }
  })
})
