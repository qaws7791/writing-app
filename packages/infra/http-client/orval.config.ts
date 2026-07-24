import { defineConfig } from "orval"

const generatedClientOutput = (
  audience: "admin" | "learner",
  mutator: "adminFetch" | "learnerFetch"
) => ({
  client: "fetch" as const,
  clean: true,
  mode: "single" as const,
  override: {
    fetch: {
      includeHttpResponseReturnType: false,
    },
    mutator: {
      name: mutator,
      path: "./src/generated-fetch.ts",
    },
  },
  schemas: `.generated/${audience}/models`,
  target: `.generated/${audience}/index.ts`,
})

const generatedMswOutput = (audience: "admin" | "learner") => ({
  clean: false,
  client: "fetch" as const,
  mock: {
    generators: [
      {
        baseUrl: audience === "learner" ? "*/api" : "*",
        generateEachHttpStatus: true,
        preferredContentType: "application/json",
        type: "msw" as const,
      },
    ],
    indexMockFiles: true,
  },
  mode: "split" as const,
  override: {
    mock: {
      required: true,
    },
  },
  schemas: `.generated/${audience}/models`,
  target: `.generated/${audience}/mocks`,
})

export default defineConfig({
  admin: {
    input: {
      target: "../../../apps/api/.generated/openapi/admin.json",
    },
    output: generatedClientOutput("admin", "adminFetch"),
  },
  adminMsw: {
    input: {
      target: "../../../apps/api/.generated/openapi/admin.json",
    },
    output: generatedMswOutput("admin"),
  },
  learner: {
    input: {
      target: "../../../apps/api/.generated/openapi/learner.json",
    },
    output: generatedClientOutput("learner", "learnerFetch"),
  },
  learnerMsw: {
    input: {
      target: "../../../apps/api/.generated/openapi/learner.json",
    },
    output: generatedMswOutput("learner"),
  },
})
