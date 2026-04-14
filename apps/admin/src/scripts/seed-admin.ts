/**
 * 초기 어드민 계정 생성 스크립트
 * 사용법: bun --env-file=.env.development run src/scripts/seed-admin.ts
 *
 * 환경변수:
 *   ADMIN_EMAIL    - 어드민 이메일 (기본: admin@example.com)
 *   ADMIN_PASSWORD - 어드민 비밀번호 (기본: changeme123)
 *   ADMIN_NAME     - 어드민 이름 (기본: 관리자)
 */

import { hash } from "bcryptjs"
import { eq } from "drizzle-orm"

import { adminUsers, openDb } from "@workspace/database"

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL 환경변수가 설정되지 않았습니다")
}

const email = (process.env.ADMIN_EMAIL ?? "admin@example.com").toLowerCase()
const password = process.env.ADMIN_PASSWORD ?? "changeme123"
const name = process.env.ADMIN_NAME ?? "관리자"

const { db, close } = openDb(DATABASE_URL)

const [existing] = await db
  .select()
  .from(adminUsers)
  .where(eq(adminUsers.email, email))
  .limit(1)

if (existing) {
  console.log(`이미 존재하는 어드민 계정: ${email}`)
  await close()
  process.exit(0)
}

const passwordHash = await hash(password, 12)
await db.insert(adminUsers).values({ email, passwordHash, name })

console.log(`어드민 계정 생성 완료: ${email}`)
await close()
