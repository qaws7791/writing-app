import fs from "node:fs"
import path from "node:path"
import { z } from "zod"

export const imageReleaseServices = ["web", "api", "admin"] as const
export type ImageReleaseService = (typeof imageReleaseServices)[number]

const revision = z
  .string()
  .regex(/^[0-9a-f]{40}$/u, "40자리 lowercase Git SHA가 필요합니다.")
const repository = z
  .string()
  .regex(
    /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/u,
    "owner/repository 형식이 필요합니다."
  )
const digest = z
  .string()
  .regex(
    /^sha256:[0-9a-f]{64}$/u,
    "sha256:<64 lowercase hex> 형식이 필요합니다."
  )
const service = z.enum(imageReleaseServices)
const image = (name: ImageReleaseService) =>
  z
    .string()
    .regex(
      new RegExp(
        `^ghcr\\.io/[a-z0-9._-]+/[a-z0-9._-]+-${name}@sha256:[0-9a-f]{64}$`,
        "u"
      ),
      `${name}의 lowercase GHCR digest가 필요합니다.`
    )
const recordSchema = z
  .object({ image: z.string(), service, sourceRevision: revision })
  .strict()
  .superRefine((value, context) => {
    const result = image(value.service).safeParse(value.image)
    if (!result.success) {
      context.addIssue({
        code: "custom",
        message: result.error.issues[0]?.message ?? "",
      })
    }
  })
const manifestSchema = z
  .object({
    images: z
      .object({ admin: image("admin"), api: image("api"), web: image("web") })
      .strict(),
    sourceRevision: revision,
  })
  .strict()
  .refine(
    (value) =>
      new Set(
        imageReleaseServices.map((name) =>
          value.images[name].replace(
            /-(?:web|api|admin)@sha256:[0-9a-f]{64}$/u,
            ""
          )
        )
      ).size === 1,
    "세 image는 같은 GHCR repository여야 합니다."
  )
type Record = z.infer<typeof recordSchema>
export type ImageReleaseManifest = z.infer<typeof manifestSchema>

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) throw new Error(z.prettifyError(result.error))
  return result.data
}

export function readImageReleaseManifest(file: string): ImageReleaseManifest {
  return parse(manifestSchema, JSON.parse(fs.readFileSync(file, "utf8")))
}

function env(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} 환경 변수가 필요합니다.`)
  return value
}

function write(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function aggregate(directory: string): ImageReleaseManifest {
  const records = fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) =>
      parse<Record>(
        recordSchema,
        JSON.parse(fs.readFileSync(path.join(directory, entry.name), "utf8"))
      )
    )
  const byService = new Map(records.map((value) => [value.service, value]))
  if (records.length !== 3 || byService.size !== 3) {
    throw new Error("중복 없이 세 image record가 필요합니다.")
  }
  if (new Set(records.map((value) => value.sourceRevision)).size !== 1) {
    throw new Error("세 image의 source revision이 같아야 합니다.")
  }
  return parse(manifestSchema, {
    images: Object.fromEntries(
      imageReleaseServices.map((name) => [name, byService.get(name)?.image])
    ),
    sourceRevision: records[0]?.sourceRevision,
  })
}

function run(): void {
  const command = process.argv[2]
  if (command === "preflight") {
    const input = parse(z.object({ repository, revision }), {
      repository: env("GITHUB_REPOSITORY"),
      revision: env("IMAGE_RELEASE_REVISION"),
    })
    fs.appendFileSync(
      env("GITHUB_OUTPUT"),
      `image-prefix=ghcr.io/${input.repository.toLowerCase()}\nrelease-tag=sha-${input.revision}\n`
    )
    return
  }
  if (command === "write-record") {
    const input = parse(z.object({ digest, repository, revision, service }), {
      digest: env("IMAGE_RELEASE_DIGEST"),
      repository: env("GITHUB_REPOSITORY"),
      revision: env("IMAGE_RELEASE_REVISION"),
      service: env("IMAGE_RELEASE_SERVICE"),
    })
    write(env("IMAGE_RELEASE_OUTPUT"), {
      image: `ghcr.io/${input.repository.toLowerCase()}-${input.service}@${input.digest}`,
      service: input.service,
      sourceRevision: input.revision,
    })
    return
  }
  const input = process.argv[3] ?? "output/image-release-manifest.json"
  const output = process.argv[4] ?? "infra/ansible/release-vars.json"
  if (command === "aggregate") write(output, aggregate(input))
  else if (command === "write-ansible-vars") {
    const value = readImageReleaseManifest(input)
    write(output, {
      writing_app_admin_image: value.images.admin,
      writing_app_api_image: value.images.api,
      writing_app_source_revision: value.sourceRevision,
      writing_app_web_image: value.images.web,
    })
  } else {
    throw new Error(
      "preflight, write-record, aggregate 또는 write-ansible-vars 명령을 사용해야 합니다."
    )
  }
}

if (import.meta.main) {
  try {
    run()
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
