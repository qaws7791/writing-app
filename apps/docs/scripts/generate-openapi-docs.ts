import { execFileSync } from "node:child_process"

import { generateFiles } from "fumadocs-openapi"

import { openapi } from "@/lib/openapi"

await generateFiles({
  input: openapi,
  output: "content/docs/api",
  includeDescription: true,
  meta: {
    folderStyle: "folder",
  },
})

execFileSync(
  "bunx",
  ["prettier", "--write", "content/docs/api/**/*.{mdx,json}"],
  {
    shell: process.platform === "win32",
    stdio: "inherit",
  }
)
