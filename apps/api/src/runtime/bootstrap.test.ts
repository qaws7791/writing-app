import { beforeEach, describe, expect, test, vi } from "vitest"

const {
  createApiContainerMock,
  createAppMock,
  createAllRoutesMock,
  getAuthEmailsRouteMock,
  migrateDatabaseMock,
  seedDatabaseMock,
} = vi.hoisted(() => {
  const publicRoute = { openapi: vi.fn(), route: vi.fn() }
  const devRoute = { openapi: vi.fn(), route: vi.fn() }
  return {
    createApiContainerMock: vi.fn(),
    createAppMock: vi.fn(),
    createAllRoutesMock: vi.fn(() => [publicRoute]),
    getAuthEmailsRouteMock: devRoute,
    migrateDatabaseMock: vi.fn(),
    seedDatabaseMock: vi.fn(),
  }
})

vi.mock("@workspace/database", () => ({
  migrateDatabase: migrateDatabaseMock,
  seedDatabase: seedDatabaseMock,
}))

vi.mock("../lib/hono/create-app.js", () => ({
  createApp: createAppMock,
}))

vi.mock("./container.js", () => ({
  createApiContainer: createApiContainerMock,
  extractUseCases: (cradle: Record<string, unknown>) => {
    const { getHomeUseCase, healthCheckUseCase, sqliteVersion } = cradle
    return {
      getHomeUseCase,
      healthCheckUseCase,
      sqliteVersion,
    }
  },
}))

vi.mock("../routes/index.js", () => ({
  allRoutes: createAllRoutesMock,
}))

vi.mock("../routes/dev/get-auth-emails.js", () => ({
  default: getAuthEmailsRouteMock,
}))

vi.mock("../config/env.js", () => ({
  apiEnv: {
    API_AUTH_BASE_URL: "http://127.0.0.1:3010",
    API_AUTH_SECRET: "test-secret-test-secret-test-secret",
    API_DATABASE_PATH: "memory:test",
    API_LOG_LEVEL: "info",
    API_PORT: 3010,
    API_RATE_LIMIT_REDIS_PREFIX: "test:rate-limit",
    API_REDIS_URL: "redis://127.0.0.1:6379",
    API_WEB_BASE_URL: "http://127.0.0.1:3000",
  },
}))

import { createApiDependencies, readApiEnvironment } from "./bootstrap.js"

function createLoggerStub() {
  const child = vi.fn()
  const logger = {
    child,
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }

  child.mockReturnValue(logger)

  return logger
}

function createMockContainer() {
  const cradle = {
    auth: {
      api: { getSession: vi.fn() },
      handler: vi.fn(),
    },
    database: {
      close: vi.fn(),
      db: { name: "db" },
      sqlite: { name: "sqlite" },
    },
    devEmailInbox: {
      clear: vi.fn(),
      readLatestMessage: vi.fn(),
    },
    logger: createLoggerStub(),
    rateLimitBackend: { createStore: vi.fn() },
    redisClient: {
      ping: vi.fn().mockResolvedValue("PONG"),
    },
    sqliteVersion: "3.46.0",
    getHomeUseCase: vi.fn(),
    healthCheckUseCase: vi.fn(),
  }

  return {
    cradle,
    dispose: vi.fn().mockResolvedValue(undefined),
  }
}

describe("bootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    const container = createMockContainer()
    const app = {
      fetch: vi.fn(),
      get: vi.fn(),
      openAPIRegistry: { registerComponent: vi.fn() },
    }

    createApiContainerMock.mockReturnValue(container)
    createAppMock.mockReturnValue(app)
    migrateDatabaseMock.mockResolvedValue(undefined)
  })

  test("seeds the database on startup when enabled", async () => {
    await createApiDependencies({
      apiBaseUrl: "http://127.0.0.1:3010",
      authBaseUrl: "http://127.0.0.1:3010",
      authDebugEnabled: false,
      authSecret: "test-secret-test-secret-test-secret",
      databasePath: "memory:test",
      logLevel: "info",
      port: 3010,
      rateLimitRedisPrefix: "test:rate-limit",
      redisUrl: "redis://127.0.0.1:6379",
      seedOnStartup: true,
      webBaseUrl: "http://127.0.0.1:3000",
    })

    expect(seedDatabaseMock).toHaveBeenCalledTimes(1)
    expect(seedDatabaseMock).toHaveBeenCalledWith({ name: "db" })
  })

  test("skips database seeding on startup when disabled", async () => {
    await createApiDependencies({
      apiBaseUrl: "http://127.0.0.1:3010",
      authBaseUrl: "http://127.0.0.1:3010",
      authDebugEnabled: false,
      authSecret: "test-secret-test-secret-test-secret",
      databasePath: "memory:test",
      logLevel: "info",
      port: 3010,
      rateLimitRedisPrefix: "test:rate-limit",
      redisUrl: "redis://127.0.0.1:6379",
      seedOnStartup: false,
      webBaseUrl: "http://127.0.0.1:3000",
    })

    expect(seedDatabaseMock).not.toHaveBeenCalled()
  })

  test("does not register dev routes when auth debug is disabled", async () => {
    await createApiDependencies({
      apiBaseUrl: "http://127.0.0.1:3010",
      authBaseUrl: "http://127.0.0.1:3010",
      authDebugEnabled: false,
      authSecret: "test-secret-test-secret-test-secret",
      databasePath: "memory:test",
      logLevel: "info",
      port: 3010,
      rateLimitRedisPrefix: "test:rate-limit",
      redisUrl: "redis://127.0.0.1:6379",
      seedOnStartup: false,
      webBaseUrl: "http://127.0.0.1:3000",
    })

    expect(createAppMock).toHaveBeenCalledWith(
      expect.objectContaining({
        routes: createAllRoutesMock.mock.results[0]?.value,
      })
    )
  })

  test("registers dev routes only when auth debug is enabled", async () => {
    await createApiDependencies({
      apiBaseUrl: "http://127.0.0.1:3010",
      authBaseUrl: "http://127.0.0.1:3010",
      authDebugEnabled: true,
      authSecret: "test-secret-test-secret-test-secret",
      databasePath: "memory:test",
      logLevel: "info",
      port: 3010,
      rateLimitRedisPrefix: "test:rate-limit",
      redisUrl: "redis://127.0.0.1:6379",
      seedOnStartup: false,
      webBaseUrl: "http://127.0.0.1:3000",
    })

    expect(createAppMock).toHaveBeenCalledWith(
      expect.objectContaining({
        routes: [
          ...(createAllRoutesMock.mock.results[0]?.value ?? []),
          getAuthEmailsRouteMock,
        ],
      })
    )
  })

  test("registers the cookie auth security scheme for the OpenAPI document", async () => {
    await createApiDependencies({
      apiBaseUrl: "http://127.0.0.1:3010",
      authBaseUrl: "http://127.0.0.1:3010",
      authDebugEnabled: false,
      authSecret: "test-secret-test-secret-test-secret",
      databasePath: "memory:test",
      logLevel: "info",
      port: 3010,
      rateLimitRedisPrefix: "test:rate-limit",
      redisUrl: "redis://127.0.0.1:6379",
      seedOnStartup: false,
      webBaseUrl: "http://127.0.0.1:3000",
    })

    const app = createAppMock.mock.results[0]?.value

    expect(app.openAPIRegistry.registerComponent).toHaveBeenCalledWith(
      "securitySchemes",
      "cookieAuth",
      {
        description:
          "better-auth가 관리하는 세션 쿠키입니다. /api/auth/sign-in/email 로그인 후 자동으로 설정됩니다.",
        in: "cookie",
        name: "better-auth.session_token",
        type: "apiKey",
      }
    )
  })

  test("derives seedOnStartup and authDebugEnabled from NODE_ENV", () => {
    vi.stubEnv("NODE_ENV", "production")
    expect(readApiEnvironment().seedOnStartup).toBe(false)
    expect(readApiEnvironment().authDebugEnabled).toBe(false)

    vi.stubEnv("NODE_ENV", "development")
    expect(readApiEnvironment().seedOnStartup).toBe(true)
    expect(readApiEnvironment().authDebugEnabled).toBe(true)

    vi.unstubAllEnvs()
  })

  test("delegates cleanup to container.dispose", async () => {
    const result = await createApiDependencies({
      apiBaseUrl: "http://127.0.0.1:3010",
      authBaseUrl: "http://127.0.0.1:3010",
      authDebugEnabled: false,
      authSecret: "test-secret-test-secret-test-secret",
      databasePath: "memory:test",
      logLevel: "info",
      port: 3010,
      rateLimitRedisPrefix: "test:rate-limit",
      redisUrl: "redis://127.0.0.1:6379",
      seedOnStartup: false,
      webBaseUrl: "http://127.0.0.1:3000",
    })

    result.close()

    expect(createApiContainerMock).toHaveBeenCalledTimes(1)

    const [firstResult] = createApiContainerMock.mock.results
    expect(firstResult).toBeDefined()

    const container = firstResult?.value
    expect(container).toBeDefined()
    expect(container.dispose).toHaveBeenCalledTimes(1)
  })
})
