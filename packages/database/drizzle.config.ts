import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/geulpil",
  },
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./src/schema/index.ts",
})
