import { createTwoClientBrowserConvergenceFixture } from "@load/resource-document-sync-load-fixture"

const fixture = await createTwoClientBrowserConvergenceFixture()
const server = Bun.serve({
  port: 0,
  async fetch(request) {
    const url = new URL(request.url)
    if (request.method === "GET" && url.pathname === "/health") {
      return new Response("<!doctype html><title>resource load</title>", {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      })
    }
    if (request.method === "POST" && url.pathname === "/shutdown") {
      setTimeout(() => void close(), 10)
      return Response.json({ closing: true })
    }
    const match = url.pathname.match(/^\/(submit|converge)\/(0|1)$/)
    if (request.method !== "POST" || match === null) {
      return new Response("Not Found", { status: 404 })
    }
    const operation = match[1]
    const clientIndex = Number(match[2]) as 0 | 1
    const value =
      operation === "submit"
        ? await fixture.submit(clientIndex)
        : await fixture.converge(clientIndex)
    return Response.json(value)
  },
})

process.stdout.write(`${JSON.stringify({ port: server.port })}\n`)

let closing = false
async function close(): Promise<void> {
  if (closing) return
  closing = true
  await server.stop(true)
  await fixture.close()
  process.exit(0)
}

process.on("SIGINT", () => void close())
process.on("SIGTERM", () => void close())
