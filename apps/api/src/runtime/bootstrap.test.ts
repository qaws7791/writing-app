import { beforeEach, describe, expect, test, vi } from "vitest"

const {
  createApiContainerMock,
  createAppMock,
  migrateDatabaseMock,
  seedDatabaseMock,
} = vi.hoisted(() => {
  return {
    createApiContainerMock: vi.fn(),
    createAppMock: vi.fn(),
    migrateDatabaseMock: vi.fn(),
    seedDatabaseMock: vi.fn(),
  }
})

vi.mock("@workspace/database", () => ({
  migrateDatabase: migrateDatabaseMock,
  seedDatabase: seedDatabaseMock,
}))

vi.mock("../app.js", () => ({
  createApp: createAppMock,
}))

vi.mock("./container.js", () => ({
  createApiContainer: createApiContainerMock,
}))

vi.mock("../config/env.js", () => ({
  apiEnv: {
    API_AUTH_BASE_URL: "http://127.0.0.1:3010",
    API_AUTH_SECRET: "test-secret-test-secret-test-secret",
    API_DATABASE_PATH: "memory:test",
    API_LOG_LEVEL: "info",
    API_PORT: 3010,
    API_WEB_BASE_URL: "http://127.0.0.1:3000",
  },
}))

import { createApiDependencies, readApiEnvironment } from "./bootstrap.js"

function createLoggerStub() {
  const child = vi.fn()
  const logger = {
    child,
    info: vi.fn(),
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
    sqliteVersion: "3.46.0",
    aiUseCases: {},
    homeUseCases: { getHome: vi.fn() },
    promptUseCases: { listPrompts: vi.fn() },
    writingUseCases: { listWritings: vi.fn() },
    writingSyncUseCases: {},
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
    const app = { fetch: vi.fn() }

    createApiContainerMock.mockReturnValue(container)
    createAppMock.mockReturnValue(app)
    migrateDatabaseMock.mockResolvedValue(undefined)
  })

  test("seeds the database on startup when enabled", async () => {
    await createApiDependencies({
      apiBaseUrl: "http://127.0.0.1:3010",
      authBaseUrl: "http://127.0.0.1:3010",
      authSecret: "test-secret-test-secret-test-secret",
      databasePath: "memory:test",
      logLevel: "info",
      port: 3010,
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
      authSecret: "test-secret-test-secret-test-secret",
      databasePath: "memory:test",
      logLevel: "info",
      port: 3010,
      seedOnStartup: false,
      webBaseUrl: "http://127.0.0.1:3000",
    })

    expect(seedDatabaseMock).not.toHaveBeenCalled()
  })

  test("derives seedOnStartup from NODE_ENV", () => {
    vi.stubEnv("NODE_ENV", "production")
    expect(readApiEnvironment().seedOnStartup).toBe(false)

    vi.stubEnv("NODE_ENV", "development")
    expect(readApiEnvironment().seedOnStartup).toBe(true)

    vi.unstubAllEnvs()
  })

  test("delegates cleanup to container.dispose", async () => {
    const result = await createApiDependencies({
      apiBaseUrl: "http://127.0.0.1:3010",
      authBaseUrl: "http://127.0.0.1:3010",
      authSecret: "test-secret-test-secret-test-secret",
      databasePath: "memory:test",
      logLevel: "info",
      port: 3010,
      seedOnStartup: false,
      webBaseUrl: "http://127.0.0.1:3000",
    })

    result.close()

    const container = createApiContainerMock.mock.results[0]!.value
    expect(container.dispose).toHaveBeenCalledTimes(1)
  })
})
