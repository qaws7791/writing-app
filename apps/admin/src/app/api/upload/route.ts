import crypto from "node:crypto"
import path from "node:path"
import { type NextRequest, NextResponse } from "next/server"

import { createS3StorageClient } from "@workspace/storage"

import { env } from "@/env"
import { withAdminAuth } from "@/lib/auth/require-admin"

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
])
const MAX_SIZE_BYTES = 5 * 1024 * 1024

let storageClient: ReturnType<typeof createS3StorageClient> | null = null

function getStorage() {
  if (!storageClient) {
    storageClient = createS3StorageClient({
      endpoint: env.STORAGE_ENDPOINT,
      accessKey: env.STORAGE_ACCESS_KEY,
      secretKey: env.STORAGE_SECRET_KEY,
      bucket: env.STORAGE_BUCKET,
      region: env.STORAGE_REGION,
      publicUrl: env.STORAGE_PUBLIC_URL,
    })
  }
  return storageClient
}

export const POST = withAdminAuth(async (req: NextRequest) => {
  const formData = await req.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file field" }, { status: 400 })
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "이미지 파일만 허용됩니다 (JPEG, PNG, WebP, GIF, AVIF)" },
      { status: 415 }
    )
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "파일 크기는 5MB를 초과할 수 없습니다" },
      { status: 413 }
    )
  }

  const ext = path.extname(file.name) || `.${file.type.split("/")[1]}`
  const key = `uploads/${crypto.randomUUID()}${ext}`
  const body = new Uint8Array(await file.arrayBuffer())

  try {
    const { url } = await getStorage().uploadFile({
      key,
      body,
      contentType: file.type,
      contentLength: file.size,
    })
    return NextResponse.json({ url }, { status: 201 })
  } catch (err) {
    console.error("Storage upload failed:", err)
    return NextResponse.json(
      { error: "업로드에 실패했습니다" },
      { status: 502 }
    )
  }
})
