import { createHash, createHmac, timingSafeEqual } from "node:crypto"

import { userIdSchema } from "@workspace/contracts/identity/admin-ids"

import type {
  AdminUserCursorCodec,
  AdminUserPagePosition,
} from "#identity/application/identity-ports"

type CursorPayload = Readonly<{
  fingerprint: string
  position: AdminUserPagePosition
  version: 1
}>

export function createAdminUserCursorCodec(
  secret: string
): AdminUserCursorCodec {
  if (Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("Cursor signing secret must be at least 32 bytes")
  }

  return {
    createFingerprint(input) {
      return createHash("sha256")
        .update(JSON.stringify(input))
        .digest("base64url")
    },
    decode(cursor, fingerprint) {
      const [encodedPayload, encodedSignature, extra] = cursor.split(".")
      if (
        encodedPayload === undefined ||
        encodedSignature === undefined ||
        extra !== undefined
      ) {
        return null
      }

      const provided = Buffer.from(encodedSignature, "base64url")
      const expected = Buffer.from(sign(encodedPayload, secret), "base64url")
      if (
        provided.length !== expected.length ||
        !timingSafeEqual(provided, expected)
      ) {
        return null
      }

      const payload = parsePayload(encodedPayload)
      return payload?.fingerprint === fingerprint ? payload.position : null
    },
    encode(input) {
      const encodedPayload = Buffer.from(
        JSON.stringify({ ...input, version: 1 } satisfies CursorPayload),
        "utf8"
      ).toString("base64url")
      return `${encodedPayload}.${sign(encodedPayload, secret)}`
    },
  }
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url")
}

function parsePayload(encodedPayload: string): CursorPayload | null {
  try {
    const value: unknown = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    )
    if (!isObject(value) || value["version"] !== 1) return null
    if (typeof value["fingerprint"] !== "string") return null

    const position = value["position"]
    if (!isObject(position)) return null
    if (
      position["primary"] !== null &&
      typeof position["primary"] !== "number" &&
      typeof position["primary"] !== "string"
    ) {
      return null
    }

    const userId = userIdSchema.safeParse(position["userId"])
    if (!userId.success) return null

    return {
      fingerprint: value["fingerprint"],
      position: {
        primary: position["primary"],
        userId: userId.data,
      },
      version: 1,
    }
  } catch {
    return null
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
