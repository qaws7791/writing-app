import assert from "node:assert/strict"

import { RuleTester } from "oxlint/plugins-dev"

import { noUnsafeUnknownCastRule } from "./workspace-rules.mjs"

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { lang: "ts" },
    sourceType: "module",
  },
})

tester.run("no-unsafe-unknown-cast", noUnsafeUnknownCastRule, {
  invalid: [
    {
      code: "const userId = value as unknown as UserId",
      errors: [{ messageId: "unsafeUnknownCast" }],
    },
  ],
  valid: [
    {
      code: "const userId = toUserId(value)",
    },
  ],
})

assert.ok(true)
