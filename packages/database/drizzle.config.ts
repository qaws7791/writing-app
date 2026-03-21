import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dbCredentials: {
    url: process.env.API_DATABASE_PATH ?? "./data/app.sqlite",
  },
  dialect: "sqlite",
  out: "./drizzle",
  schema: "./src/schema/index.ts",
})
