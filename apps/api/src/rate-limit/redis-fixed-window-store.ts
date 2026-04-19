import type { ClientRateLimitInfo, Store } from "hono-rate-limiter"

import type { AppEnv } from "../app-env"

type RedisStoreClient = {
  call: (command: string, ...args: Array<number | string>) => Promise<unknown>
  decr: (key: string) => Promise<number>
  del: (key: string) => Promise<number>
  get: (key: string) => Promise<string | null>
  pttl: (key: string) => Promise<number>
}

const INCREMENT_SCRIPT = `
local key = KEYS[1]
local window_ms = tonumber(ARGV[1])
local current_time = redis.call("TIME")
local now_ms = current_time[1] * 1000 + math.floor(current_time[2] / 1000)
local total_hits = redis.call("INCR", key)
local ttl = redis.call("PTTL", key)

if ttl < 0 then
  redis.call("PEXPIRE", key, window_ms)
  ttl = window_ms
end

return { total_hits, now_ms + ttl }
`

function normalizePrefix(prefix: string): string {
  if (prefix.length === 0) return ""
  return prefix.endsWith(":") ? prefix : `${prefix}:`
}

function parseInteger(value: unknown, fieldName: string): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN

  if (!Number.isFinite(parsed)) {
    throw new Error(`유효하지 않은 Redis rate limit ${fieldName}입니다.`)
  }

  return parsed
}

function parseIncrementResult(value: unknown): {
  resetAtMs: number
  totalHits: number
} {
  if (!Array.isArray(value) || value.length < 2) {
    throw new Error("유효하지 않은 Redis rate limit 응답입니다.")
  }

  return {
    resetAtMs: parseInteger(value[1], "reset_at_ms"),
    totalHits: parseInteger(value[0], "total_hits"),
  }
}

export class RedisFixedWindowStore implements Store<AppEnv> {
  readonly localKeys = false
  readonly prefix: string

  constructor(
    private readonly client: RedisStoreClient,
    private readonly windowMs: number,
    prefix: string
  ) {
    this.prefix = normalizePrefix(prefix)
  }

  async get(key: string): Promise<ClientRateLimitInfo | undefined> {
    const namespacedKey = this.prefixKey(key)
    const [totalHits, ttlMs] = await Promise.all([
      this.client.get(namespacedKey),
      this.client.pttl(namespacedKey),
    ])

    if (totalHits === null || ttlMs <= 0) {
      return undefined
    }

    return {
      resetTime: new Date(Date.now() + ttlMs),
      totalHits: parseInteger(totalHits, "total_hits"),
    }
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const result = await this.client.call(
      "EVAL",
      INCREMENT_SCRIPT,
      1,
      this.prefixKey(key),
      this.windowMs
    )
    const { resetAtMs, totalHits } = parseIncrementResult(result)

    return {
      resetTime: new Date(resetAtMs),
      totalHits,
    }
  }

  async decrement(key: string): Promise<void> {
    const namespacedKey = this.prefixKey(key)
    const remainingHits = await this.client.decr(namespacedKey)

    if (remainingHits <= 0) {
      await this.client.del(namespacedKey)
    }
  }

  async resetKey(key: string): Promise<void> {
    await this.client.del(this.prefixKey(key))
  }

  private prefixKey(key: string): string {
    return `${this.prefix}${key}`
  }
}

export type { RedisStoreClient }
