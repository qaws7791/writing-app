import {
  createContainer,
  asFunction,
  asValue,
  InjectionMode,
  type AwilixContainer,
} from "awilix"
import {
  createAIRequestRepository,
  createDailyRecommendationRepository,
  createWritingRepository,
  createPromptRepository,
  createWritingSyncRepository,
  createWritingSyncWriter,
  createWritingTransactionRepository,
  createWritingVersionRepository,
  openDb,
  readSqliteVersion,
  authSchema,
} from "@workspace/database"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { createResendEmailSender } from "@workspace/email"

import { createAIApiService, type AIApiService } from "../services/ai-services"
import {
  createWritingApiService,
  createWritingSyncApiService,
  type WritingApiService,
  type WritingSyncApiService,
} from "../services/writing-services"
import {
  createHomeApiService,
  createPromptApiService,
  type HomeApiService,
  type PromptApiService,
} from "../services/prompt-services"
import { createAuth } from "../auth/auth"
import {
  createDevEmailInbox,
  createDevEmailPort,
  type EmailSender,
} from "../auth/auth-email"
import { apiEnv } from "../config/env"
import { createApiLogger, type ApiLogger } from "../observability/logger"
import type { ApiEnvironment } from "./bootstrap"

export type ApiCradle = {
  // --- Configuration ---
  environment: ApiEnvironment
  isProduction: boolean

  // --- Infrastructure ---
  logger: ApiLogger
  database: ReturnType<typeof openDb>
  sqliteVersion: string

  // --- Auth & Email ---
  devEmailInbox: ReturnType<typeof createDevEmailInbox> | null
  emailSender: EmailSender
  auth: ReturnType<typeof createAuth>

  // --- Repositories ---
  aiRequestRepository: ReturnType<typeof createAIRequestRepository>
  dailyRecommendationRepository: ReturnType<
    typeof createDailyRecommendationRepository
  >
  promptRepository: ReturnType<typeof createPromptRepository>
  writingRepository: ReturnType<typeof createWritingRepository>
  writingSyncRepository: ReturnType<typeof createWritingSyncRepository>
  writingSyncWriter: ReturnType<typeof createWritingSyncWriter>
  writingTransactionRepository: ReturnType<
    typeof createWritingTransactionRepository
  >
  writingVersionRepository: ReturnType<typeof createWritingVersionRepository>

  // --- API Services ---
  aiUseCases: AIApiService
  homeUseCases: HomeApiService
  promptUseCases: PromptApiService
  writingUseCases: WritingApiService
  writingSyncUseCases: WritingSyncApiService
}

export function createApiContainer(
  environment: ApiEnvironment
): AwilixContainer<ApiCradle> {
  const container = createContainer<ApiCradle>({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  })

  container.register({
    // --- Configuration ---

    environment: asValue(environment),
    isProduction: asValue(process.env.NODE_ENV === "production"),

    // --- Infrastructure ---

    logger: asFunction(({ environment }: ApiCradle) =>
      createApiLogger({ level: environment.logLevel })
    ).singleton(),

    database: asFunction(({ environment }: ApiCradle) =>
      openDb(environment.databasePath)
    )
      .singleton()
      .disposer((database) => database.close()),

    sqliteVersion: asFunction(({ database }: ApiCradle) =>
      readSqliteVersion(database.sqlite)
    ).singleton(),

    // --- Auth & Email ---

    devEmailInbox: asFunction(({ isProduction }: ApiCradle) =>
      isProduction ? null : createDevEmailInbox()
    )
      .singleton()
      .disposer((inbox) => inbox?.clear()),

    emailSender: asFunction(
      ({ isProduction, devEmailInbox, logger }: ApiCradle) => {
        if (isProduction) {
          return createResendEmailSender({
            apiKey: apiEnv.RESEND_API_KEY!,
            fromAddress: apiEnv.RESEND_FROM_ADDRESS!,
          })
        }

        return createDevEmailPort({
          exposeSensitiveData: process.env.NODE_ENV === "development",
          inbox: devEmailInbox!,
          logger: logger.child({ scope: "auth-email" }),
        })
      }
    ).singleton(),

    auth: asFunction(({ database, environment, emailSender }: ApiCradle) => {
      const authDatabaseAdapter = drizzleAdapter(database.db, {
        provider: "sqlite",
        schema: authSchema,
      })
      const authUserPort = {
        findUserByEmail: (email: string) =>
          database.db.query.user.findFirst({
            where: (fields, { eq }) => eq(fields.email, email),
          }),
      }

      return createAuth(
        authDatabaseAdapter,
        authUserPort,
        environment,
        emailSender
      )
    }).singleton(),

    // --- Repositories ---

    aiRequestRepository: asFunction(({ database }: ApiCradle) =>
      createAIRequestRepository(database.db)
    ).singleton(),

    dailyRecommendationRepository: asFunction(({ database }: ApiCradle) =>
      createDailyRecommendationRepository(database.db)
    ).singleton(),

    promptRepository: asFunction(({ database }: ApiCradle) =>
      createPromptRepository(database.db)
    ).singleton(),

    writingRepository: asFunction(({ database }: ApiCradle) =>
      createWritingRepository(database.db)
    ).singleton(),

    writingSyncRepository: asFunction(({ database }: ApiCradle) =>
      createWritingSyncRepository(database.db)
    ).singleton(),

    writingSyncWriter: asFunction(({ database }: ApiCradle) =>
      createWritingSyncWriter(database.db)
    ).singleton(),

    writingTransactionRepository: asFunction(({ database }: ApiCradle) =>
      createWritingTransactionRepository(database.db)
    ).singleton(),

    writingVersionRepository: asFunction(({ database }: ApiCradle) =>
      createWritingVersionRepository(database.db)
    ).singleton(),

    // --- API Services ---

    aiUseCases: asFunction(({ aiRequestRepository, logger }: ApiCradle) =>
      createAIApiService({
        aiRequestRepository,
        logger: logger.child({ scope: "ai-services" }),
      })
    ).singleton(),

    promptUseCases: asFunction(({ promptRepository }: ApiCradle) =>
      createPromptApiService(promptRepository)
    ).singleton(),

    homeUseCases: asFunction(
      ({
        dailyRecommendationRepository,
        writingRepository,
        promptRepository,
      }: ApiCradle) =>
        createHomeApiService({
          dailyRecommendationRepository,
          writingRepository,
          promptRepository,
        })
    ).singleton(),

    writingUseCases: asFunction(
      ({ writingRepository, promptRepository }: ApiCradle) =>
        createWritingApiService({
          writingRepository,
          promptRepository,
        })
    ).singleton(),

    writingSyncUseCases: asFunction(
      ({
        writingSyncRepository,
        writingSyncWriter,
        writingTransactionRepository,
        writingVersionRepository,
      }: ApiCradle) =>
        createWritingSyncApiService({
          writingRepository: writingSyncRepository,
          syncWriter: writingSyncWriter,
          transactionRepository: writingTransactionRepository,
          versionRepository: writingVersionRepository,
        })
    ).singleton(),
  })

  return container
}
