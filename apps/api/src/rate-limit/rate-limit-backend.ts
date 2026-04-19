import { MemoryStore, type Store } from "hono-rate-limiter"

import type { AppEnv } from "../app-env"
import {
  RedisFixedWindowStore,
  type RedisStoreClient,
} from "./redis-fixed-window-store"

export type RateLimitPolicy = {
  bucket: string
  limit: number
  windowMs: number
}

type ApiRateLimitStore = Store<AppEnv>

export type RateLimitBackend = {
  createStore: (policy: RateLimitPolicy) => ApiRateLimitStore
}

type RedisRateLimitBackendOptions = {
  client: RedisStoreClient
  prefix: string
}

function joinPrefix(...parts: string[]): string {
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join(":")
}

export function createRedisRateLimitBackend(
  options: RedisRateLimitBackendOptions
): RateLimitBackend {
  return {
    createStore(policy) {
      return new RedisFixedWindowStore(
        options.client,
        policy.windowMs,
        joinPrefix(options.prefix, policy.bucket)
      )
    },
  }
}

export function createMemoryRateLimitBackend(): RateLimitBackend {
  return {
    createStore() {
      return new MemoryStore<AppEnv>()
    },
  }
}
