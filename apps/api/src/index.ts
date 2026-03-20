import { createApiDependencies, readApiEnvironment } from "./bootstrap.js"

const environment = readApiEnvironment()
const { app } = await createApiDependencies(environment)

export default {
  fetch: app.fetch,
  port: environment.port,
}
