import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "sqlite",
  dbCredentials: {
    url: "../../../data/api.sqlite",
  },
  out: "./src/migrations",
  schema: "./src/schema/index.ts",
})
