import { parseEnv, type AppEnvInput } from "@workspace/env/parse-env"
import { parseContentAssetPublicBaseUrl } from "@workspace/env/public-url"
import { shouldUsePrettyLogging } from "@workspace/observability/logger"
import { defaultDeletedLearnerRetentionDays } from "@workspace/identity/ports"
import { z } from "@workspace/http-platform/openapi"

import {
  parseAdminMcpConfiguration,
  type AdminMcpConfiguration,
} from "@/mcp/admin/admin-mcp-configuration"

export type ApiEnv = {
  readonly adminAssetStore: AdminAssetStoreEnv | undefined
  readonly adminAuthSecret: string
  readonly adminMcp: AdminMcpConfiguration | undefined
  readonly adminOrigin: string
  readonly authEmail: AuthEmailEnv
  readonly cursorSigningSecret: string
  readonly databaseUrl: string | undefined
  readonly deletedLearnerRetentionDays: number
  readonly deletionMarkerStore: DeletionMarkerStoreEnv | undefined
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
  readonly logPretty: boolean
  readonly nodeEnv: "development" | "test" | "production"
  readonly port: number
  readonly webOrigin: string
}

type AuthEmailEnv =
  | Readonly<{
      kind: "in-memory"
    }>
  | Readonly<{
      apiKey: string
      from: string
      kind: "resend"
      replyTo: string | undefined
    }>

const adminAssetStoreEnvSchema = z.object({
  accessKeyId: z.string().min(1),
  bucket: z.string().min(1),
  endpoint: z.url(),
  publicBaseUrl: z.url(),
  region: z.string().min(1),
  secretAccessKey: z.string().min(1),
})

const deletionMarkerStoreEnvSchema = z.object({
  accessKeyId: z.string().min(1),
  bucket: z.string().min(1),
  endpoint: z.url(),
  prefix: z.string().min(1),
  region: z.string().min(1),
  secretAccessKey: z.string().min(1),
})

export type AdminAssetStoreEnv = z.infer<typeof adminAssetStoreEnvSchema>
type DeletionMarkerStoreEnv = z.infer<typeof deletionMarkerStoreEnvSchema>

export function parseApiEnv(input: AppEnvInput): ApiEnv {
  const env = parseEnv(input)
  const cursorSigningSecret = readCursorSigningSecret(env)
  const adminAssetStore = parseAdminAssetStore(input, env.NODE_ENV)
  const deletionMarkerStore = parseDeletionMarkerStore(
    input,
    env.NODE_ENV,
    adminAssetStore
  )

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
  const adminMcp = parseAdminMcpConfiguration(
    input,
    deploymentEnvironment,
    env.ADMIN_ORIGIN
  )
  validateAdminMcpRequestStateSecret({
    adminAuthSecret: env.ADMIN_AUTH_SECRET,
    adminMcp,
    cursorSigningSecret,
    learnerAuthSecret: env.LEARNER_AUTH_SECRET,
  })

  return {
    adminAssetStore,
    adminAuthSecret: env.ADMIN_AUTH_SECRET,
    adminMcp,
    adminOrigin: env.ADMIN_ORIGIN,
    authEmail: parseAuthEmailEnv(input, env.NODE_ENV),
    cursorSigningSecret,
    databaseUrl: env.DATABASE_URL,
    deletedLearnerRetentionDays: readDeletedLearnerRetentionDays(
      input["LEARNER_DELETION_RETENTION_DAYS"]
    ),
    deletionMarkerStore,
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
    logPretty: shouldUsePrettyLogging({
      LOG_PRETTY: input["LOG_PRETTY"],
      NODE_ENV: env.NODE_ENV,
    }),
    nodeEnv: env.NODE_ENV,
    port: env.API_PORT,
    webOrigin: env.WEB_ORIGIN,
  }
}

function validateAdminMcpRequestStateSecret(input: {
  readonly adminAuthSecret: string
  readonly adminMcp: AdminMcpConfiguration | undefined
  readonly cursorSigningSecret: string
  readonly learnerAuthSecret: string
}): void {
  const requestStateSecret = input.adminMcp?.changes?.requestStateSecret
  if (requestStateSecret === undefined) return
  if (
    requestStateSecret === input.adminAuthSecret ||
    requestStateSecret === input.cursorSigningSecret ||
    requestStateSecret === input.learnerAuthSecret
  ) {
    throw new Error(
      "Invalid environment variables: ADMIN_MCP_REQUEST_STATE_SECRET: 다른 인증 및 서명 secret과 구분된 값을 사용해야 합니다."
    )
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
  const apiKey = readNonEmptyValue(input["RESEND_API_KEY"])
  const from = readNonEmptyValue(input["AUTH_EMAIL_FROM"])
  const replyTo = readNonEmptyValue(input["AUTH_EMAIL_REPLY_TO"])
  const hasAnyConfiguration =
    apiKey !== undefined || from !== undefined || replyTo !== undefined

  if (!hasAnyConfiguration) {
    if (nodeEnv === "production") {
      throw new Error(
        "Invalid environment variables: RESEND_API_KEY, AUTH_EMAIL_FROM: production에서는 인증 메일 전송 설정이 필요합니다."
      )
    }

    return { kind: "in-memory" }
  }

  if (apiKey === undefined || from === undefined) {
    throw new Error(
      "Invalid environment variables: RESEND_API_KEY, AUTH_EMAIL_FROM: 인증 메일 전송 설정은 함께 지정해야 합니다."
    )
  }

  if (replyTo !== undefined && !z.email().safeParse(replyTo).success) {
    throw new Error(
      "Invalid environment variables: AUTH_EMAIL_REPLY_TO: 유효한 이메일 주소가 필요합니다."
    )
  }

  return {
    apiKey,
    from,
    kind: "resend",
    replyTo,
  }
}

function readNonEmptyValue(value: string | undefined): string | undefined {
  const normalized = value?.trim()
  return normalized === undefined || normalized === "" ? undefined : normalized
}

function parseAdminAssetStore(
  input: AppEnvInput,
  nodeEnv: ApiEnv["nodeEnv"]
): AdminAssetStoreEnv | undefined {
  const assetValues = [
    input["ADMIN_ASSET_S3_ACCESS_KEY"],
    input["ADMIN_ASSET_S3_BUCKET"],
    input["ADMIN_ASSET_S3_ENDPOINT"],
    input["ADMIN_ASSET_PUBLIC_BASE_URL"],
    input["ADMIN_ASSET_S3_SECRET_KEY"],
  ]
  const hasAssetValue = assetValues.some((value) => value !== undefined)
  const hasCompleteAssetConfiguration = assetValues.every(
    (value) => value !== undefined
  )

  if (hasAssetValue && !hasCompleteAssetConfiguration) {
    throw new Error("자료 이미지 저장소 환경 변수는 모두 함께 설정해야 합니다.")
  }
  if (nodeEnv === "production" && !hasCompleteAssetConfiguration) {
    throw new Error("production에서는 자료 이미지 저장소 설정이 필요합니다.")
  }

  const assetStore = adminAssetStoreEnvSchema.optional().parse(
    hasCompleteAssetConfiguration
      ? {
          accessKeyId: input["ADMIN_ASSET_S3_ACCESS_KEY"],
          bucket: input["ADMIN_ASSET_S3_BUCKET"],
          endpoint: input["ADMIN_ASSET_S3_ENDPOINT"],
          publicBaseUrl: input["ADMIN_ASSET_PUBLIC_BASE_URL"],
          region: input["ADMIN_ASSET_S3_REGION"] ?? "auto",
          secretAccessKey: input["ADMIN_ASSET_S3_SECRET_KEY"],
        }
      : undefined
  )

  const publicBaseUrl = parseContentAssetPublicBaseUrl(
    assetStore?.publicBaseUrl,
    {
      description: "ADMIN_ASSET_PUBLIC_BASE_URL",
      nodeEnvironment: nodeEnv,
    }
  )
  if (
    nodeEnv === "production" &&
    assetStore !== undefined &&
    new URL(assetStore.endpoint).protocol !== "https:"
  ) {
    throw new Error("production 자료 이미지 저장소는 HTTPS URL이 필요합니다.")
  }

  return assetStore === undefined || publicBaseUrl === null
    ? undefined
    : {
        ...assetStore,
        publicBaseUrl:
          publicBaseUrl.pathname === "/"
            ? publicBaseUrl.origin
            : publicBaseUrl.href,
      }
}

function parseDeletionMarkerStore(
  input: AppEnvInput,
  nodeEnv: ApiEnv["nodeEnv"],
  adminAssetStore: AdminAssetStoreEnv | undefined
): DeletionMarkerStoreEnv | undefined {
  const markerValues = [
    input["DELETION_MARKER_S3_ACCESS_KEY"],
    input["DELETION_MARKER_S3_BUCKET"],
    input["DELETION_MARKER_S3_ENDPOINT"],
    input["DELETION_MARKER_S3_REGION"],
    input["DELETION_MARKER_S3_SECRET_KEY"],
  ]
  const hasMarkerValue =
    markerValues.some((value) => value !== undefined) ||
    input["DELETION_MARKER_S3_PREFIX"] !== undefined
  const hasCompleteMarkerConfiguration = markerValues.every(
    (value) => value !== undefined
  )

  if (hasMarkerValue && !hasCompleteMarkerConfiguration) {
    throw new Error(
      "Invalid environment variables: DELETION_MARKER_S3_ENDPOINT, DELETION_MARKER_S3_REGION, DELETION_MARKER_S3_BUCKET, DELETION_MARKER_S3_ACCESS_KEY, DELETION_MARKER_S3_SECRET_KEY: private 삭제 marker 저장소 설정은 모두 함께 지정해야 합니다."
    )
  }
  if (nodeEnv === "production" && !hasCompleteMarkerConfiguration) {
    throw new Error(
      "Invalid environment variables: DELETION_MARKER_S3_ENDPOINT, DELETION_MARKER_S3_REGION, DELETION_MARKER_S3_BUCKET, DELETION_MARKER_S3_ACCESS_KEY, DELETION_MARKER_S3_SECRET_KEY: production에서는 private 삭제 marker 저장소 설정이 필요합니다."
    )
  }

  const markerStore = deletionMarkerStoreEnvSchema.optional().parse(
    hasCompleteMarkerConfiguration
      ? {
          accessKeyId: input["DELETION_MARKER_S3_ACCESS_KEY"],
          bucket: input["DELETION_MARKER_S3_BUCKET"],
          endpoint: input["DELETION_MARKER_S3_ENDPOINT"],
          prefix:
            input["DELETION_MARKER_S3_PREFIX"] ?? "privacy/deletion-markers",
          region: input["DELETION_MARKER_S3_REGION"],
          secretAccessKey: input["DELETION_MARKER_S3_SECRET_KEY"],
        }
      : undefined
  )

  if (
    nodeEnv === "production" &&
    markerStore !== undefined &&
    new URL(markerStore.endpoint).protocol !== "https:"
  ) {
    throw new Error(
      "Invalid environment variables: DELETION_MARKER_S3_ENDPOINT: production private 삭제 marker 저장소는 HTTPS URL이 필요합니다."
    )
  }
  if (
    markerStore !== undefined &&
    adminAssetStore !== undefined &&
    markerStore.bucket === adminAssetStore.bucket
  ) {
    throw new Error(
      "Invalid environment variables: DELETION_MARKER_S3_BUCKET: public asset bucket과 다른 private bucket을 사용해야 합니다."
    )
  }

  return markerStore
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
