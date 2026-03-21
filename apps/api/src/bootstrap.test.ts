import { beforeEach, describe, expect, test, vi } from "vitest"

const {
  createAppMock,
  createAuthMock,
  createDevEmailPortMock,
  createDraftApiServiceMock,
  createDraftRepositoryMock,
  createHomeApiServiceMock,
  createPromptApiServiceMock,
  createPromptRepositoryMock,
  createApiLoggerMock,
  migrateDatabaseMock,
  openDbMock,
  readSqliteVersionMock,
  seedDatabaseMock,
} = vi.hoisted(() => {
  return {
    createAppMock: vi.fn(),
    createAuthMock: vi.fn(),
    createDevEmailPortMock: vi.fn(),
    createDraftApiServiceMock: vi.fn(),
    createDraftRepositoryMock: vi.fn(),
    createHomeApiServiceMock: vi.fn(),
    createPromptApiServiceMock: vi.fn(),
    createPromptRepositoryMock: vi.fn(),
    createApiLoggerMock: vi.fn(),
    migrateDatabaseMock: vi.fn(),
    openDbMock: vi.fn(),
    readSqliteVersionMock: vi.fn(),
    seedDatabaseMock: vi.fn(),
  }
})

vi.mock("@workspace/database", () => ({
  createDraftRepository: createDraftRepositoryMock,
  createPromptRepository: createPromptRepositoryMock,
  migrateDatabase: migrateDatabaseMock,
  openDb: openDbMock,
  readSqliteVersion: readSqliteVersionMock,
  seedDatabase: seedDatabaseMock,
}))

vi.mock("./application-services.js", () => ({
  createDraftApiService: createDraftApiServiceMock,
  createHomeApiService: createHomeApiServiceMock,
  createPromptApiService: createPromptApiServiceMock,
}))

vi.mock("./app.js", () => ({
  createApp: createAppMock,
}))

vi.mock("./auth.js", () => ({
  createAuth: createAuthMock,
}))

vi.mock("./auth-email.js", () => ({
  createDevEmailPort: createDevEmailPortMock,
}))

vi.mock("./env.js", () => ({
  apiEnv: {
    API_AUTH_BASE_URL: "http://127.0.0.1:3010",
    API_AUTH_SECRET: "test-secret-test-secret-test-secret",
    API_DATABASE_PATH: "memory:test",
    API_LOG_LEVEL: "info",
    API_PORT: 3010,
    API_WEB_BASE_URL: "http://127.0.0.1:3000",
  },
}))

vi.mock("./logger.js", () => ({
  createApiLogger: createApiLoggerMock,
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

describe("bootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    const logger = createLoggerStub()
    const database = {
      close: vi.fn(),
      db: { name: "db" },
      sqlite: { name: "sqlite" },
    }
    const emailPort = {
      clear: vi.fn(),
      readLatestMessage: vi.fn(),
      sendPasswordResetEmail: vi.fn(),
      sendVerificationEmail: vi.fn(),
    }
    const auth = {
      api: {
        getSession: vi.fn(),
      },
      handler: vi.fn(),
    }
    const app = {
      fetch: vi.fn(),
    }

    createApiLoggerMock.mockReturnValue(logger)
    openDbMock.mockReturnValue(database)
    readSqliteVersionMock.mockReturnValue("3.46.0")
    createDevEmailPortMock.mockReturnValue(emailPort)
    createAuthMock.mockReturnValue(auth)
    createPromptRepositoryMock.mockReturnValue({ exists: vi.fn() })
    createDraftRepositoryMock.mockReturnValue({ list: vi.fn() })
    createPromptApiServiceMock.mockReturnValue({ listPrompts: vi.fn() })
    createDraftApiServiceMock.mockReturnValue({ listDrafts: vi.fn() })
    createHomeApiServiceMock.mockReturnValue({ getHome: vi.fn() })
    createAppMock.mockReturnValue(app)
    migrateDatabaseMock.mockResolvedValue(undefined)
  })

  test("seeds the database on startup when enabled", async () => {
    await createApiDependencies({
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
})
