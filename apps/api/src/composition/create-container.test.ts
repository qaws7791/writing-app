import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const adminMcpFactories = vi.hoisted(() => ({
  createAuthentication: vi.fn(),
  createRuntime: vi.fn(),
}))

vi.mock("@/mcp/admin/admin-mcp-auth", () => ({
  createAdminMcpAuthentication: adminMcpFactories.createAuthentication,
}))
vi.mock("@/mcp/admin/admin-mcp-runtime", () => ({
  createAdminMcpRuntime: adminMcpFactories.createRuntime,
}))

import { createApp } from "@/composition/create-app"
import {
  createContainer,
  type ApiContainer,
} from "@/composition/create-container"
import { parseApiEnv, type ApiEnv } from "@/config/env"
import type { AdminMcpRuntime } from "@/mcp/admin/admin-mcp-runtime"

const openContainers: ApiContainer[] = []
const temporaryDirectories: string[] = []

beforeEach(() => {
  adminMcpFactories.createAuthentication.mockReset()
  adminMcpFactories.createRuntime.mockReset()
})

afterEach(async () => {
  await Promise.all(
    openContainers.splice(0).map((container) => container.dispose())
  )
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true })
  }
})

describe("admin MCP container composition", () => {
  it("composes the static verifier without an owner-row precheck", async () => {
    const innerRuntime = createInnerRuntime()
    adminMcpFactories.createAuthentication.mockReturnValue({ verifier: {} })
    adminMcpFactories.createRuntime.mockReturnValue(innerRuntime.runtime)

    const container = await createContainer(createTestEnvironment())
    openContainers.push(container)

    expect(container.admin.mcp).toBe(innerRuntime.runtime)
    expect(container.health.isDatabaseReady()).toBe(true)
    expect(adminMcpFactories.createAuthentication).toHaveBeenCalledOnce()
    expect(adminMcpFactories.createAuthentication).toHaveBeenCalledWith(
      expect.objectContaining({
        accessTokenStore: expect.objectContaining({
          verify: expect.any(Function),
        }),
        configuration: container.platform.env.adminMcp,
        now: container.platform.clock.now,
      })
    )
    expect(adminMcpFactories.createRuntime).toHaveBeenCalledOnce()
  })

  it("registers only the static bearer MCP endpoint", async () => {
    const innerRuntime = createInnerRuntime()
    adminMcpFactories.createAuthentication.mockReturnValue({ verifier: {} })
    adminMcpFactories.createRuntime.mockReturnValue(innerRuntime.runtime)
    const container = await createContainer(createTestEnvironment())
    openContainers.push(container)
    const app = createApp(container)

    const mcpResponse = await app.fetch(createMcpRequest())
    expect(mcpResponse.status).toBe(401)

    for (const path of [
      "/.well-known/oauth-protected-resource/mcp/admin",
      "/.well-known/oauth-authorization-server",
    ]) {
      const response = await app.fetch(
        new Request(`http://localhost:8787${path}`, {
          headers: { host: "localhost:8787" },
        })
      )
      expect(response.status).toBe(404)
    }
    expect(innerRuntime.fetch).toHaveBeenCalledOnce()
  })

  it("closes the static MCP runtime with the container", async () => {
    const innerRuntime = createInnerRuntime()
    adminMcpFactories.createAuthentication.mockReturnValue({ verifier: {} })
    adminMcpFactories.createRuntime.mockReturnValue(innerRuntime.runtime)
    const container = await createContainer(createTestEnvironment())
    openContainers.push(container)

    await container.dispose()

    expect(innerRuntime.close).toHaveBeenCalledOnce()
  })

  it("propagates static verifier and runtime construction failures", async () => {
    const authenticationFailure = new Error("static verifier failed")
    adminMcpFactories.createAuthentication.mockImplementationOnce(() => {
      throw authenticationFailure
    })

    await expect(createContainer(createTestEnvironment())).rejects.toBe(
      authenticationFailure
    )

    adminMcpFactories.createAuthentication.mockReturnValueOnce({ verifier: {} })
    adminMcpFactories.createRuntime.mockImplementationOnce(() => {
      throw new Error("MCP runtime construction failed")
    })
    await expect(createContainer(createTestEnvironment())).rejects.toThrow(
      "MCP runtime construction failed"
    )
  })
})

function createMcpRequest(): Request {
  return new Request("http://localhost:8787/mcp/admin", {
    body: "{}",
    headers: {
      "content-type": "application/json",
      host: "localhost:8787",
    },
    method: "POST",
  })
}

function createInnerRuntime() {
  const close = vi.fn(async () => undefined)
  const fetch = vi.fn(async () => new Response(null, { status: 401 }))
  return {
    close,
    fetch,
    runtime: { close, fetch } satisfies AdminMcpRuntime,
  }
}

function createTestEnvironment(): ApiEnv {
  const directory = mkdtempSync(
    path.join(tmpdir(), "writing-app-api-container-")
  )
  temporaryDirectories.push(directory)

  return parseApiEnv({
    ADMIN_AUTH_SECRET: "a".repeat(32),
    ADMIN_MCP_ENABLED: "true",
    ADMIN_MCP_RESOURCE_URL: "http://localhost:8787/mcp/admin",
    DATABASE_URL: path.join(directory, "api.sqlite"),
    LEARNER_AUTH_SECRET: "b".repeat(32),
    LOG_LEVEL: "silent",
    NODE_ENV: "test",
  })
}
