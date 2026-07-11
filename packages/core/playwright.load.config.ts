import { defineConfig } from "@playwright/test"

export default defineConfig({
  fullyParallel: false,
  reporter: "list",
  testDir: "./load",
  testMatch: "resource-document-two-context.spec.ts",
  timeout: 30_000,
  workers: 1,
})
