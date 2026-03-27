import { beforeEach, describe, expect, test, vi } from "vitest"

const {
  createAIApiServiceMock,
  createAppMock,
  createAuthMock,
  createAIRequestRepositoryMock,
  createDailyRecommendationRepositoryMock,
  createDevEmailInboxMock,
  createDevEmailPortMock,
  drizzleAdapterMock,
  createWritingApiServiceMock,
  createWritingRepositoryMock,
  createWritingSyncApiServiceMock,
  createWritingSyncRepositoryMock,
  createWritingSyncWriterMock,
  createWritingTransactionRepositoryMock,
  createWritingVersionRepositoryMock,
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
    createAIApiServiceMock: vi.fn(),
    createAppMock: vi.fn(),
    createAuthMock: vi.fn(),
    createAIRequestRepositoryMock: vi.fn(),
    createDailyRecommendationRepositoryMock: vi.fn(),
    createDevEmailInboxMock: vi.fn(),
    createDevEmailPortMock: vi.fn(),
    drizzleAdapterMock: vi.fn(),
    createWritingApiServiceMock: vi.fn(),
    createWritingRepositoryMock: vi.fn(),
    createWritingSyncApiServiceMock: vi.fn(),
    createWritingSyncRepositoryMock: vi.fn(),
    createWritingSyncWriterMock: vi.fn(),
    createWritingTransactionRepositoryMock: vi.fn(),
    createWritingVersionRepositoryMock: vi.fn(),
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
  authSchema: {},
  createAIRequestRepository: createAIRequestRepositoryMock,
  createDailyRecommendationRepository: createDailyRecommendationRepositoryMock,
  createWritingRepository: createWritingRepositoryMock,
  createWritingSyncRepository: createWritingSyncRepositoryMock,
  createWritingSyncWriter: createWritingSyncWriterMock,
  createWritingTransactionRepository: createWritingTransactionRepositoryMock,
  createWritingVersionRepository: createWritingVersionRepositoryMock,
  createPromptRepository: createPromptRepositoryMock,
  migrateDatabase: migrateDatabaseMock,
  openDb: openDbMock,
  readSqliteVersion: readSqliteVersionMock,
  seedDatabase: seedDatabaseMock,
}))

vi.mock("better-auth/adapters/drizzle", () => ({
  drizzleAdapter: drizzleAdapterMock,
}))

vi.mock("@workspace/email", () => ({
  createResendEmailSender: vi.fn(),
}))

vi.mock("../services/writing-services.js", () => ({
  createWritingApiService: createWritingApiServiceMock,
  createWritingSyncApiService: createWritingSyncApiServiceMock,
}))

vi.mock("../services/prompt-services.js", () => ({
  createHomeApiService: createHomeApiServiceMock,
  createPromptApiService: createPromptApiServiceMock,
}))

vi.mock("../app.js", () => ({
  createApp: createAppMock,
}))

vi.mock("../services/ai-services.js", () => ({
  createAIApiService: createAIApiServiceMock,
}))

vi.mock("../auth/auth.js", () => ({
  createAuth: createAuthMock,
}))

vi.mock("../auth/auth-email.js", () => ({
  createDevEmailInbox: createDevEmailInboxMock,
  createDevEmailPort: createDevEmailPortMock,
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

vi.mock("../observability/logger.js", () => ({
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
    const emailInbox = {
      clear: vi.fn(),
      readLatestMessage: vi.fn(),
      store: vi.fn(),
    }
    const emailPort = {
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
    createDevEmailInboxMock.mockReturnValue(emailInbox)
    createDevEmailPortMock.mockReturnValue(emailPort)
    drizzleAdapterMock.mockReturnValue({ name: "adapter" })
    createAuthMock.mockReturnValue(auth)
    createAIRequestRepositoryMock.mockReturnValue({})
    createPromptRepositoryMock.mockReturnValue({ exists: vi.fn() })
    createWritingRepositoryMock.mockReturnValue({ list: vi.fn() })
    createWritingSyncRepositoryMock.mockReturnValue({})
    createWritingSyncWriterMock.mockReturnValue({})
    createWritingTransactionRepositoryMock.mockReturnValue({})
    createWritingVersionRepositoryMock.mockReturnValue({})
    createAIApiServiceMock.mockReturnValue({})
    createPromptApiServiceMock.mockReturnValue({ listPrompts: vi.fn() })
    createWritingApiServiceMock.mockReturnValue({ listWritings: vi.fn() })
    createHomeApiServiceMock.mockReturnValue({ getHome: vi.fn() })
    createWritingSyncApiServiceMock.mockReturnValue({})
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
})
