import { parseEnv, type AppEnvInput } from "@workspace/env/parse-env"
import { parseContentAssetPublicBaseUrl } from "@workspace/env/public-url"
import { defaultDeletedLearnerRetentionDays } from "@workspace/identity/ports"
import { z } from "@workspace/http-platform/openapi"

export type ApiEnv = {
  readonly assetPublicBaseUrl: string
  readonly adminAuthSecret: string
  readonly adminOrigin: string
  readonly authEmail: AuthEmailEnv
  readonly cursorSigningSecret: string
  readonly deletedLearnerRetentionDays: number
  readonly deploymentEnvironment:
    | "development"
    | "test"
    | "staging"
    | "production"
  readonly deploymentVersion: string
  readonly enableApiDocs: boolean
  readonly googleClientId: string | undefined
  readonly googleClientSecret: string | undefined
  readonly learnerAuthSecret: string
  readonly logLevel: string
  readonly nodeEnv: "development" | "test" | "production"
  readonly port: number
  readonly webOrigin: string
  readonly writingDailySuccessfulCheckLimit: number
}

type AuthEmailEnv =
  | Readonly<{ kind: "local" }>
  | Readonly<{ kind: "cloudflare"; from: string; replyTo: string | undefined }>

export function parseApiEnv(input: AppEnvInput): ApiEnv {
  const env = parseEnv(input)
  const cursorSigningSecret = readCursorSigningSecret(env)
  const assetUrl = parseContentAssetPublicBaseUrl(
    input["ASSET_PUBLIC_BASE_URL"] ?? env.WEB_ORIGIN + "/assets/content",
    { description: "ASSET_PUBLIC_BASE_URL", nodeEnvironment: env.NODE_ENV }
  )
  if (assetUrl === null) throw new Error("ASSET_PUBLIC_BASE_URL is required")

  validateSeparatedAuthConfiguration({
    adminAuthSecret: env.ADMIN_AUTH_SECRET,
    adminOrigin: env.ADMIN_ORIGIN,
    learnerAuthSecret: env.LEARNER_AUTH_SECRET,
    learnerOrigin: env.WEB_ORIGIN,
  })
  validateProviderConfiguration(env)

  const deploymentEnvironment = parseDeploymentEnvironment(
    env.NODE_ENV,
    input["DEPLOYMENT_ENVIRONMENT"]
  )

  return {
    assetPublicBaseUrl: assetUrl.href.replace(/\/$/u, ""),
    adminAuthSecret: env.ADMIN_AUTH_SECRET,
    adminOrigin: env.ADMIN_ORIGIN,
    authEmail: parseAuthEmailEnv(input, env.NODE_ENV),
    cursorSigningSecret,
    deletedLearnerRetentionDays: readDeletedLearnerRetentionDays(
      input["LEARNER_DELETION_RETENTION_DAYS"]
    ),
    deploymentEnvironment,
    deploymentVersion: parseDeploymentVersion(
      env.NODE_ENV,
      input["DEPLOYMENT_VERSION"]
    ),
    enableApiDocs: parseApiDocsEnabled(input["ENABLE_API_DOCS"], env.NODE_ENV),
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    learnerAuthSecret: env.LEARNER_AUTH_SECRET,
    logLevel: input["LOG_LEVEL"]?.trim() || "info",
    nodeEnv: env.NODE_ENV,
    port: env.API_PORT,
    webOrigin: env.WEB_ORIGIN,
    writingDailySuccessfulCheckLimit: readWritingDailySuccessfulCheckLimit(
      input["WRITING_DAILY_SUCCESSFUL_CHECK_LIMIT"]
    ),
  }
}

function parseApiDocsEnabled(
  value: string | undefined,
  nodeEnv: ApiEnv["nodeEnv"]
): boolean {
  const normalized = value?.trim()
  if (
    normalized !== undefined &&
    normalized !== "true" &&
    normalized !== "false"
  ) {
    throw new Error(
      "Invalid environment variables: ENABLE_API_DOCS: true 또는 false가 필요합니다."
    )
  }

  return nodeEnv === "production" ? normalized === "true" : true
}

function parseAuthEmailEnv(
  input: AppEnvInput,
  nodeEnv: ApiEnv["nodeEnv"]
): AuthEmailEnv {
  const from = readNonEmptyValue(input["AUTH_EMAIL_FROM"])
  const replyTo = readNonEmptyValue(input["AUTH_EMAIL_REPLY_TO"])
  if (nodeEnv !== "production" && from === undefined) return { kind: "local" }
  if (!z.email().safeParse(from).success)
    throw new Error("AUTH_EMAIL_FROM: 유효한 발신 이메일 주소가 필요합니다.")
  if (replyTo !== undefined && !z.email().safeParse(replyTo).success)
    throw new Error("AUTH_EMAIL_REPLY_TO: 유효한 이메일 주소가 필요합니다.")
  return { kind: "cloudflare", from: z.email().parse(from), replyTo }
}

function readNonEmptyValue(value: string | undefined): string | undefined {
  const normalized = value?.trim()
  return normalized === undefined || normalized === "" ? undefined : normalized
}

function validateProviderConfiguration(env: ReturnType<typeof parseEnv>): void {
  const hasGoogleClientId = env.GOOGLE_CLIENT_ID !== undefined
  const hasGoogleClientSecret = env.GOOGLE_CLIENT_SECRET !== undefined

  if (hasGoogleClientId !== hasGoogleClientSecret) {
    throw new Error(
      "Invalid environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET: Google OAuth 설정은 함께 지정해야 합니다."
    )
  }
  if (env.NODE_ENV === "production" && !hasGoogleClientId) {
    throw new Error(
      "Invalid environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET: production에서는 Google OAuth 설정이 필요합니다."
    )
  }
}

function validateSeparatedAuthConfiguration(input: {
  readonly adminAuthSecret: string
  readonly adminOrigin: string
  readonly learnerAuthSecret: string
  readonly learnerOrigin: string
}): void {
  if (input.adminAuthSecret === input.learnerAuthSecret) {
    throw new Error(
      "Invalid environment variables: ADMIN_AUTH_SECRET: 학습자 secret과 다른 값을 사용해야 합니다."
    )
  }

  if (
    new URL(input.adminOrigin).origin === new URL(input.learnerOrigin).origin
  ) {
    throw new Error(
      "Invalid environment variables: ADMIN_ORIGIN: 학습자 origin과 다른 값을 사용해야 합니다."
    )
  }
}

function readCursorSigningSecret(env: ReturnType<typeof parseEnv>): string {
  if (env.CURSOR_SIGNING_SECRET !== undefined) {
    return env.CURSOR_SIGNING_SECRET
  }
  if (env.NODE_ENV === "production") {
    throw new Error(
      "Invalid environment variables: CURSOR_SIGNING_SECRET: production에서는 cursor 서명 전용 secret이 필요합니다."
    )
  }

  return `${env.LEARNER_AUTH_SECRET}:cursor-signing`
}

/**
 * 보존 기간은 제품 요구사항이 소유하고 identity module이 기본값을 정본으로 둔다. env는
 * 같은 값을 두 소비자(purge command·marker 재적용)에 함께 주입하는 수단이다.
 */
export function readDeletedLearnerRetentionDays(
  value: string | undefined
): number {
  const normalized = value?.trim()
  if (normalized === undefined || normalized.length === 0) {
    return defaultDeletedLearnerRetentionDays
  }

  const parsed = z.coerce.number().int().min(1).max(365).safeParse(normalized)
  if (!parsed.success) {
    throw new Error(
      "Invalid environment variables: LEARNER_DELETION_RETENTION_DAYS: 1일 이상 365일 이하의 정수여야 합니다."
    )
  }

  return parsed.data
}

function readWritingDailySuccessfulCheckLimit(
  value: string | undefined
): number {
  const normalized = value?.trim()
  if (normalized === undefined || normalized.length === 0) {
    return 5
  }

  const parsed = z.coerce.number().int().min(1).max(50).safeParse(normalized)
  if (!parsed.success) {
    throw new Error(
      "Invalid environment variables: WRITING_DAILY_SUCCESSFUL_CHECK_LIMIT: 1 이상 50 이하의 정수여야 합니다."
    )
  }

  return parsed.data
}

function parseDeploymentVersion(
  nodeEnv: ApiEnv["nodeEnv"],
  value: string | undefined
): string {
  const normalized = value?.trim()

  if (normalized !== undefined && normalized.length > 0) {
    return normalized
  }

  if (nodeEnv === "production") {
    throw new Error(
      "Invalid environment variables: DEPLOYMENT_VERSION: production에서는 배포 버전이 필요합니다."
    )
  }

  return "local"
}

function parseDeploymentEnvironment(
  nodeEnv: ApiEnv["nodeEnv"],
  value: string | undefined
): ApiEnv["deploymentEnvironment"] {
  const normalized = value?.trim()

  if (normalized === undefined || normalized.length === 0) {
    if (nodeEnv === "production") {
      throw new Error(
        "Invalid environment variables: DEPLOYMENT_ENVIRONMENT: production 실행 모드에서는 staging 또는 production 대상 환경이 필요합니다."
      )
    }
    return nodeEnv
  }

  if (
    normalized !== "development" &&
    normalized !== "test" &&
    normalized !== "staging" &&
    normalized !== "production"
  ) {
    throw new Error(
      "Invalid environment variables: DEPLOYMENT_ENVIRONMENT: development, test, staging 또는 production이 필요합니다."
    )
  }

  if (
    (nodeEnv === "production" &&
      normalized !== "staging" &&
      normalized !== "production") ||
    (nodeEnv !== "production" && normalized !== nodeEnv)
  ) {
    throw new Error(
      "Invalid environment variables: DEPLOYMENT_ENVIRONMENT: NODE_ENV 실행 모드와 대상 환경 조합이 올바르지 않습니다."
    )
  }

  return normalized
}
