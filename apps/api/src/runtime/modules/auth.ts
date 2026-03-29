import { asFunction, type AwilixContainer } from "awilix"
import { authSchema } from "@workspace/database"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { createResendEmailSender } from "@workspace/email"

import { createAuth } from "../../auth/auth"
import { createDevEmailInbox, createDevEmailPort } from "../../auth/auth-email"
import { apiEnv } from "../../config/env"
import type { ApiCradle } from "../container"

export function registerAuth(container: AwilixContainer<ApiCradle>) {
  container.register({
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
  })
}
