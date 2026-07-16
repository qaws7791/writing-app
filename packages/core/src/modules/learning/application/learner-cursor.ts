import { createHash, createHmac, timingSafeEqual } from "node:crypto"

export type LearnerCursorEndpoint = "courses" | "progress"

export type LearnerCursorPosition = {
  readonly courseId: string
  readonly primary: number | string
}

type LearnerCursorPayload = {
  readonly endpoint: LearnerCursorEndpoint
  readonly fingerprint: string
  readonly learnerScope?: string
  readonly position: LearnerCursorPosition
  readonly version: 1
}

export type LearnerCursorCodec = {
  readonly createFingerprint: (value: unknown) => string
  readonly createLearnerScope: (learnerId: string) => string
  readonly decode: (
    cursor: string,
    expectation: {
      readonly endpoint: LearnerCursorEndpoint
      readonly fingerprint: string
      readonly learnerScope?: string
    }
  ) => LearnerCursorPosition | null
  readonly encode: (input: Omit<LearnerCursorPayload, "version">) => string
}

export function createLearnerCursorCodec(secret: string): LearnerCursorCodec {
  if (Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("Cursor signing secret must be at least 32 bytes")
  }

  return {
    createFingerprint(value) {
      return createHash("sha256").update(stableJson(value)).digest("base64url")
    },
    createLearnerScope(learnerId) {
      return createHmac("sha256", secret)
        .update(`learner:${learnerId}`)
        .digest("base64url")
    },
    decode(cursor, expectation) {
      const [encodedPayload, encodedSignature, extra] = cursor.split(".")

      if (
        encodedPayload === undefined ||
        encodedSignature === undefined ||
        extra !== undefined
      ) {
        return null
      }

      const expectedSignature = sign(encodedPayload, secret)
      const provided = Buffer.from(encodedSignature, "base64url")
      const expected = Buffer.from(expectedSignature, "base64url")

      if (
        provided.length !== expected.length ||
        !timingSafeEqual(provided, expected)
      ) {
        return null
      }

      const payload = parsePayload(encodedPayload)

      if (
        payload === null ||
        payload.version !== 1 ||
        payload.endpoint !== expectation.endpoint ||
        payload.fingerprint !== expectation.fingerprint ||
        payload.learnerScope !== expectation.learnerScope
      ) {
        return null
      }

      return payload.position
    },
    encode(input) {
      const encodedPayload = Buffer.from(
        JSON.stringify({ ...input, version: 1 } satisfies LearnerCursorPayload),
        "utf8"
      ).toString("base64url")

      return `${encodedPayload}.${sign(encodedPayload, secret)}`
    },
  }
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url")
}

function parsePayload(encodedPayload: string): LearnerCursorPayload | null {
  try {
    const value: unknown = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    )

    if (!isObject(value) || value["version"] !== 1) return null
    if (value["endpoint"] !== "courses" && value["endpoint"] !== "progress") {
      return null
    }
    if (typeof value["fingerprint"] !== "string") return null
    if (
      value["learnerScope"] !== undefined &&
      typeof value["learnerScope"] !== "string"
    ) {
      return null
    }

    const position = value["position"]
    if (!isObject(position) || typeof position["courseId"] !== "string") {
      return null
    }
    if (
      typeof position["primary"] !== "string" &&
      typeof position["primary"] !== "number"
    ) {
      return null
    }

    return value as LearnerCursorPayload
  } catch {
    return null
  }
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`
  }
  if (isObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`
  }

  return JSON.stringify(value) ?? "null"
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
