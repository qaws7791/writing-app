import assert from "node:assert/strict"

import { RuleTester } from "oxlint/plugins-dev"

import {
  catchPreservesCauseRule,
  noUnsafeUnknownCastRule,
} from "./workspace-rules.mjs"

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

tester.run("catch-preserves-cause", catchPreservesCauseRule, {
  invalid: [
    {
      code: "try { save() } catch { return err({ kind: 'save-failed' }) }",
      errors: [{ messageId: "missingCause" }],
    },
    {
      code: "try { save() } catch (cause) { return err({ kind: 'save-failed' }) }",
      errors: [{ messageId: "missingCause" }],
    },
  ],
  valid: [
    {
      code: "try { save() } catch (cause) { return err({ cause, kind: 'save-failed' }) }",
    },
    {
      code: "try { save() } catch (error) { if (error instanceof Abort) return err(error.failure); throw error }",
    },
    {
      code: "return err({ kind: 'conflict' })",
    },
  ],
})
