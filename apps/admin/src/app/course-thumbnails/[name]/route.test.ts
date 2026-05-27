import { describe, expect, it } from "vitest"

import { GET } from "@/app/course-thumbnails/[name]/route"

describe("admin course thumbnail route", () => {
  it("returns a course thumbnail from the shared web public assets", async () => {
    const response = await GET(new Request("http://localhost/course"), {
      params: Promise.resolve({ name: "sentence-structure.png" }),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toBe("image/png")
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0)
  })

  it("rejects invalid thumbnail names", async () => {
    const response = await GET(new Request("http://localhost/course"), {
      params: Promise.resolve({ name: "../secret.png" }),
    })

    expect(response.status).toBe(404)
  })
})
