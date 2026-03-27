import { describe, expect, test } from "vitest"

import { createDevEmailInbox, createDevEmailPort } from "./auth-email.js"
import { createCapturedLogger } from "../test-support/capture-logger.js"

describe("createDevEmailPort", () => {
  test("includes token and url in development-style logs", async () => {
    const { entries, logger } = createCapturedLogger()
    const inbox = createDevEmailInbox()
    const emailPort = createDevEmailPort({
      exposeSensitiveData: true,
      inbox,
      logger,
    })

    await emailPort.sendVerificationEmail({
      email: "writer@example.com",
      token: "token-123",
      url: "http://127.0.0.1:3000/verify?token=token-123",
    })

    expect(entries[0]).toEqual(
      expect.objectContaining({
        email: "writer@example.com",
        kind: "verification",
        level: 30,
        msg: "verification auth email queued: http://127.0.0.1:3000/verify?token=token-123",
        token: "token-123",
        url: "http://127.0.0.1:3000/verify?token=token-123",
      })
    )
  })

  test("omits token and url in production-style logs", async () => {
    const { entries, logger } = createCapturedLogger()
    const inbox = createDevEmailInbox()
    const emailPort = createDevEmailPort({
      exposeSensitiveData: false,
      inbox,
      logger,
    })

    await emailPort.sendPasswordResetEmail({
      email: "writer@example.com",
      token: "token-123",
      url: "http://127.0.0.1:3000/reset?token=token-123",
    })

    expect(entries[0]).toEqual(
      expect.objectContaining({
        email: "writer@example.com",
        kind: "password-reset",
        level: 30,
        msg: "auth email queued",
      })
    )
    expect(entries[0]?.token).toBeUndefined()
    expect(entries[0]?.url).toBeUndefined()
  })

  test("stores the latest message for development inbox lookups", async () => {
    const { logger } = createCapturedLogger()
    const inbox = createDevEmailInbox()
    const emailPort = createDevEmailPort({
      exposeSensitiveData: true,
      inbox,
      logger,
    })

    await emailPort.sendVerificationEmail({
      email: "writer@example.com",
      token: "token-123",
      url: "http://127.0.0.1:3000/verify?token=token-123",
    })

    expect(
      inbox.readLatestMessage({
        email: "writer@example.com",
        kind: "verification",
      })
    ).toEqual(
      expect.objectContaining({
        email: "writer@example.com",
        kind: "verification",
        token: "token-123",
      })
    )
  })
})
