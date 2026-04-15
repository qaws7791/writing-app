import { createApiDependencies, readApiEnvironment } from "./runtime/bootstrap"

const environment = readApiEnvironment()
const { app, close } = await createApiDependencies(environment)

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    close()
    process.exit(0)
  })
}

export default {
  fetch: app.fetch,
  port: environment.port,
}
