import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "sqlite",
  dbCredentials: {
    url: process.env["DATABASE_URL"] ?? "data/api.sqlite",
  },
  out: "./src/migrations",
  schema: "./src/schema/index.ts",
})
