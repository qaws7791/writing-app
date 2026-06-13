import { Hono } from "hono"

export function createHealthRoute(): Hono {
  const route = new Hono()

  route.get("/", (context) =>
    context.json({
      ok: true,
    })
  )

  return route
}
