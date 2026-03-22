import { createApiDependencies, readApiEnvironment } from "./runtime/bootstrap"

const environment = readApiEnvironment()
const { app } = await createApiDependencies(environment)

export default {
  fetch: app.fetch,
  port: environment.port,
}
