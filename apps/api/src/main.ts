import { serve } from "bun"
import type { AppEnvInput } from "@workspace/env/parse-env"

import {
  createContainer,
  type ApiContainer,
  type CreateContainerOptions,
} from "@/composition/create-container"
import { createApp, type ApiApp } from "@/composition/create-app"
import { parseApiEnv, type ApiEnv } from "@/config/env"
import {
  createUnifiedApiServerLifecycle,
  registerUnifiedApiShutdownSignals,
  type UnifiedApiServerLifecycle,
} from "@/lifecycle/server-lifecycle"

export type ApiServerRuntime = Readonly<{
  app: ApiApp
  container: ApiContainer
  lifecycle: UnifiedApiServerLifecycle
  server: ReturnType<typeof serve>
}>

export type StartApiServerOptions = Readonly<{
  container?: CreateContainerOptions
  validateEnv?: (env: ApiEnv) => void
}>

export async function startApiServer(
  rawEnv: AppEnvInput,
  options: StartApiServerOptions = {}
): Promise<ApiServerRuntime> {
  const env = parseApiEnv(rawEnv)
  options.validateEnv?.(env)
  const container = await createContainer(env, options.container)
  let server: ReturnType<typeof serve> | undefined

  try {
    const app = createApp(container)
    const logger = container.platform.logger
    const lifecycle = createUnifiedApiServerLifecycle({
      disposeContainer: container.dispose,
      fetch: app.fetch,
      onDrainResult(observation) {
        logger.info(observation, "server.shutdown.drain")
      },
      onShutdownError(error, phase) {
        logger.error({ error, phase }, "server.shutdown.failed")
      },
    })
    server = serve({ fetch: lifecycle.fetch, port: env.port })
    lifecycle.attachServer(server)
    registerUnifiedApiShutdownSignals(lifecycle.shutdown, undefined, (error) =>
      logger.error({ error }, "server.shutdown.unhandled")
    )

    return { app, container, lifecycle, server }
  } catch (cause) {
    try {
      await server?.stop(true)
    } catch (error) {
      container.platform.logger.error(
        { error, phase: "force-stop-server" },
        "server.shutdown.failed"
      )
    }
    try {
      await container.dispose()
    } catch {
      // container가 각 resource 정리 실패를 이미 구조화해 기록한다.
    }
    throw cause
  }
}

if (import.meta.main) {
  await startApiServer(process.env)
}
