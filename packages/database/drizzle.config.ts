import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "./data/geulpil.sqlite",
  },
  dialect: "sqlite",
  out: "./drizzle",
  schema: "./src/schema/index.ts",
})
