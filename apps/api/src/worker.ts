import { createCloudflareAuthEmailDelivery } from "@workspace/auth/email/cloudflare"
import type { AuthEmailDeliveryPort } from "@workspace/auth/email/delivery"
import { createWritingAppDatabase } from "@workspace/db/client"
import { err } from "@workspace/kernel/result"
import {
  createR2ObjectStorage,
  createR2PrivateObjectStorage,
} from "@workspace/storage/r2-object-storage"
import { createWorkersAiWritingCheckProvider } from "@workspace/writing/module"
import { createContentAssetStorageAdapter } from "@/adapters/content/content-asset-storage"
import { createCloudflareContentAssetImageProcessor } from "@/adapters/content/cloudflare-content-asset-image-processor"
import { createDeletionMarkerStore } from "@/adapters/identity/deletion-marker-store"
import { createApp } from "@/composition/create-app"
import { createContainer } from "@/composition/create-container"
import { parseApiEnv } from "@/config/env"
import { createDailyMaintenance } from "@/maintenance/daily-maintenance"
import { createExpiredSessionMaintenance } from "@/maintenance/expired-session-maintenance"
import { uuidGenerator } from "@/runtime/uuid-generator"

export async function createWorkerRuntime(bindings: ApiBindings) {
  const variables = Object.fromEntries(
    Object.entries(bindings).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string"
    )
  )
  const env = parseApiEnv(variables)
  const database = createWritingAppDatabase(bindings.DB)
  const email = env.authEmail
  let authEmailDelivery: AuthEmailDeliveryPort
  if (email.kind === "local" && bindings.LOCAL_MAILBOX !== undefined) {
    const mailbox = bindings.LOCAL_MAILBOX
    const deliver = async (
      kind: "verification" | "password-reset",
      input: Parameters<AuthEmailDeliveryPort["deliverVerification"]>[0]
    ) => {
      await mailbox.put(
        input.recipient.email.toLowerCase(),
        JSON.stringify({ kind, callbackUrl: input.callbackUrl }),
        { httpMetadata: { contentType: "application/json" } }
      )
    }
    authEmailDelivery = {
      deliverVerification: (input) => deliver("verification", input),
      deliverPasswordReset: (input) => deliver("password-reset", input),
    }
  } else if (email.kind === "cloudflare" && bindings.EMAIL !== undefined) {
    authEmailDelivery = createCloudflareAuthEmailDelivery({
      binding: bindings.EMAIL,
      from: email.from,
      ...(email.replyTo === undefined ? {} : { replyTo: email.replyTo }),
    })
  } else {
    throw new Error("인증 메일 binding이 없습니다.")
  }
  const container = await createContainer(env, {
    database,
    authEmailDelivery,
    checkProvider:
      bindings.AI === undefined
        ? { check: async () => err({ kind: "not-configured" }) }
        : createWorkersAiWritingCheckProvider(bindings.AI),
    contentAssetStorage: createContentAssetStorageAdapter(
      createR2ObjectStorage(bindings.CONTENT_ASSETS, env.assetPublicBaseUrl)
    ),
    imageProcessor: createCloudflareContentAssetImageProcessor(bindings.IMAGES),
    deletionMarkerStore: createDeletionMarkerStore({
      objectStorage: createR2PrivateObjectStorage(bindings.PRIVATE_DATA),
      idGenerator: uuidGenerator,
      prefix: "privacy/deletion-markers",
    }),
  })
  return { container, database }
}

export default {
  async fetch(request: Request, bindings: ApiBindings): Promise<Response> {
    const url = new URL(request.url)
    if (
      url.pathname === "/__dev/mail" &&
      bindings.NODE_ENV === "development" &&
      bindings.LOCAL_MAILBOX !== undefined &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    ) {
      if (request.method !== "GET") return new Response(null, { status: 405 })
      const message = await bindings.LOCAL_MAILBOX.get(
        (url.searchParams.get("email") ?? "").toLowerCase()
      )
      return new Response(message?.body ?? null, {
        status: message === null ? 404 : 200,
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
        },
      })
    }
    if (url.pathname.startsWith("/assets/content/")) {
      if (request.method !== "GET" && request.method !== "HEAD")
        return new Response(null, { status: 405 })
      const key = url.pathname
        .slice("/assets/content/".length)
        .split("/")
        .map(decodeURIComponent)
        .join("/")
      const asset = await bindings.CONTENT_ASSETS.get(key)
      if (asset === null) return new Response(null, { status: 404 })
      const headers = new Headers({
        etag: asset.httpEtag,
        "cache-control": "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff",
      })
      asset.writeHttpMetadata(headers)
      if (request.headers.get("if-none-match") === asset.httpEtag)
        return new Response(null, { status: 304, headers })
      return new Response(request.method === "HEAD" ? null : asset.body, {
        headers,
      })
    }
    const { container } = await createWorkerRuntime(bindings)
    const headers = new Headers(request.headers)
    headers.delete("x-writing-app-client-ip")
    const clientIp = request.headers.get("cf-connecting-ip")
    if (clientIp !== null) headers.set("x-writing-app-client-ip", clientIp)
    return createApp(container).fetch(new Request(request, { headers }))
  },
  async scheduled(
    _event: ScheduledController,
    bindings: ApiBindings
  ): Promise<void> {
    const { container, database } = await createWorkerRuntime(bindings)
    const maintenance = createDailyMaintenance({
      auditTrail: container.modules.operations.auditTrail,
      clock: container.platform.clock,
      contentAssets: container.modules.content.maintenance,
      deletedLearners: container.modules.identity.deletedLearnerPurge,
      expiredSessions: createExpiredSessionMaintenance(database.db),
      externalLogRetentionEvidence: null,
    })
    const result = await maintenance.execute({ batchSize: 100, dryRun: false })
    if (result.isErr())
      throw new Error("일일 정리에 실패했습니다.", { cause: result.error })
    container.platform.logger.info(
      { stages: result.value.stages },
      "maintenance.completed"
    )
  },
} satisfies ExportedHandler<ApiBindings>
