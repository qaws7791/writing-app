import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "sqlite",
  dbCredentials: {
    url: "../../data/api.sqlite",
  },
  out: "./drizzle",
  schema: "./src/db/schema.ts",
})
