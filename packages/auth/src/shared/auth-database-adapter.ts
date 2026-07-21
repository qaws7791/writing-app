import { drizzleAdapter } from "better-auth/adapters/drizzle"

const authDatabaseAdapterValue = Symbol("auth-database-adapter-value")

type BetterAuthDatabaseAdapter = ReturnType<typeof drizzleAdapter>

export type AuthDatabaseAdapter = {
  readonly [authDatabaseAdapterValue]: BetterAuthDatabaseAdapter
}

export function createSqliteAuthDatabaseAdapter<
  TDatabase extends object,
  TSchema extends object,
>(input: {
  readonly database: TDatabase
  readonly schema: TSchema
}): AuthDatabaseAdapter {
  return {
    [authDatabaseAdapterValue]: drizzleAdapter(
      input.database as Parameters<typeof drizzleAdapter>[0],
      {
        provider: "sqlite",
        schema: input.schema,
      }
    ),
  }
}

export function readAuthDatabaseAdapter(
  adapter: AuthDatabaseAdapter
): BetterAuthDatabaseAdapter {
  return adapter[authDatabaseAdapterValue]
}
