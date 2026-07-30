import { mkdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import type { AiFeedbackProvider } from "@workspace/ai-feedback/ports"
import type {
  AuthEmailDeliveryInput,
  AuthEmailDeliveryPort,
} from "@workspace/auth/email/delivery"
import { createInMemoryAuthEmailDelivery } from "@workspace/auth/email/in-memory"
import {
  e2eRuntimeOrigins,
  readRequiredE2eEnvironment,
} from "@workspace/env/e2e-runtime"
import type { ContentAssetStoragePort } from "@workspace/content/ports"
import { err, ok } from "@workspace/kernel/result"

import { startApiServer } from "@/main"

const provider: AiFeedbackProvider = {
  model: "e2e-deterministic",
  provider: "e2e",
  async createFeedback(prompt) {
    if (prompt.input.includes("[E2E_AI_FAILURE]")) {
      return err({ kind: "provider-unavailable" })
    }

    return ok({
      feedback: {
        improvements: ["근거를 한 문장 더 구체화해 보세요."],
        nextAction: "같은 주장을 더 짧게 다시 써보세요.",
        strengths: ["핵심 장점을 명확하게 표현했습니다."],
        summary: "서버 상태 전이의 장점을 잘 설명했습니다.",
      },
    })
  },
}

if (import.meta.main) {
  const e2eRunRoot = path.resolve(readRequiredE2eEnvironment("E2E_RUN_ROOT"))
  const authEmailDelivery = createE2eAuthEmailDelivery(e2eRunRoot)
  await startApiServer(process.env, {
    container: {
      aiFeedbackProvider: provider,
      authEmailDelivery,
      contentAssetStorage: createE2eContentAssetStorage(e2eRunRoot),
    },
    validateEnv(env) {
      if (env.nodeEnv !== "test") {
        throw new Error("E2E API는 NODE_ENV=test가 필요합니다.")
      }
    },
  })
}

function createE2eContentAssetStorage(
  e2eRunRoot: string
): ContentAssetStoragePort {
  const assetRoot = path.resolve(e2eRunRoot, "content-assets")
  const publicBaseUrl = e2eRuntimeOrigins.assetOrigin
  const resolveObjectPath = (objectKey: string): string => {
    const target = path.resolve(e2eRunRoot, objectKey)
    if (!target.startsWith(`${assetRoot}${path.sep}`)) {
      throw new Error(
        "E2E content asset object key가 허용 경로를 벗어났습니다."
      )
    }
    return target
  }
  const resolveUrl = (objectKey: string): string => {
    resolveObjectPath(objectKey)
    return new URL(objectKey, `${publicBaseUrl}/`).toString()
  }

  return {
    async deleteObjects(objectKeys) {
      try {
        await Promise.all(
          objectKeys.map((objectKey) =>
            rm(resolveObjectPath(objectKey), { force: true })
          )
        )
        return ok(undefined)
      } catch (cause) {
        return err({ cause, retryable: true })
      }
    },
    async putObject(input) {
      try {
        const target = resolveObjectPath(input.objectKey)
        await mkdir(path.dirname(target), { recursive: true })
        await writeFile(target, input.body, { mode: 0o600 })
        return ok({ url: resolveUrl(input.objectKey) })
      } catch (cause) {
        return err({ cause, retryable: true })
      }
    },
    resolveUrl,
  }
}

function createE2eAuthEmailDelivery(e2eRunRoot: string): AuthEmailDeliveryPort {
  const inMemoryDelivery = createInMemoryAuthEmailDelivery()
  const mailboxPath = path.join(e2eRunRoot, "auth-email.json")

  return {
    async deliverPasswordReset(input) {
      await inMemoryDelivery.deliverPasswordReset(input)
      await writeMailbox(mailboxPath, "password-reset", input)
    },
    async deliverVerification(input) {
      await inMemoryDelivery.deliverVerification(input)
      await writeMailbox(mailboxPath, "verification", input)
    },
  }
}

async function writeMailbox(
  mailboxPath: string,
  kind: "password-reset" | "verification",
  input: AuthEmailDeliveryInput
): Promise<void> {
  await writeFile(
    mailboxPath,
    JSON.stringify({ callbackUrl: input.callbackUrl, kind }),
    {
      encoding: "utf8",
      mode: 0o600,
    }
  )
}
