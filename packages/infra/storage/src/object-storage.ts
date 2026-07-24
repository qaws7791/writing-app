import {
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { err, ok, ResultAsync, type Result } from "@workspace/kernel/result"
import { z } from "zod"

const maxDeleteObjectsPerRequest = 1_000

const objectStorageConfigSchema = z.object({
  accessKeyId: z.string().min(1),
  bucket: z.string().min(1),
  endpoint: z.url(),
  publicBaseUrl: z.url(),
  region: z.string().min(1),
  secretAccessKey: z.string().min(1),
})

export type ObjectStorageConfig = z.input<typeof objectStorageConfigSchema>

export type ObjectStorageError = Readonly<{
  cause?: unknown
  kind: "configuration-invalid" | "operation-failed"
  operation: "configure" | "delete-objects" | "put-object"
  retryable: boolean
}>

export type ObjectStorage = {
  readonly deleteObjects: (
    objectKeys: readonly string[]
  ) => ResultAsync<void, ObjectStorageError>
  readonly putObject: (input: {
    readonly body: Uint8Array
    readonly contentType: string
    readonly objectKey: string
  }) => ResultAsync<{ readonly url: string }, ObjectStorageError>
  readonly resolveUrl: (objectKey: string) => string
}

type ObjectStorageSdkClient = {
  readonly send: (command: unknown) => Promise<unknown>
}

export function createS3ObjectStorage(
  input: ObjectStorageConfig,
  options: { readonly client?: ObjectStorageSdkClient } = {}
): Result<ObjectStorage, ObjectStorageError> {
  const parsed = objectStorageConfigSchema.safeParse(input)
  if (!parsed.success) {
    return err({
      cause: parsed.error,
      kind: "configuration-invalid",
      operation: "configure",
      retryable: false,
    })
  }

  const config = parsed.data
  const endpoint = new URL(config.endpoint)
  const sdkClient = new S3Client({
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: config.endpoint,
    forcePathStyle:
      endpoint.hostname === "localhost" || endpoint.hostname === "127.0.0.1",
    maxAttempts: 3,
    region: config.region,
  })
  const client = options.client ?? {
    send: (command: unknown) => sdkClient.send(command as never),
  }

  return ok({
    deleteObjects(objectKeys) {
      return ResultAsync.fromPromise(
        deleteObjectBatches(client, config.bucket, objectKeys),
        (cause): ObjectStorageError => ({
          cause,
          kind: "operation-failed",
          operation: "delete-objects",
          retryable: true,
        })
      )
    },
    putObject(object) {
      return ResultAsync.fromPromise(
        client
          .send(
            new PutObjectCommand({
              Body: object.body,
              Bucket: config.bucket,
              ContentType: object.contentType,
              Key: object.objectKey,
            })
          )
          .then(() => ({
            url: createPublicObjectUrl(config.publicBaseUrl, object.objectKey),
          })),
        (cause): ObjectStorageError => ({
          cause,
          kind: "operation-failed",
          operation: "put-object",
          retryable: true,
        })
      )
    },
    resolveUrl(objectKey) {
      return createPublicObjectUrl(config.publicBaseUrl, objectKey)
    },
  })
}

async function deleteObjectBatches(
  client: ObjectStorageSdkClient,
  bucket: string,
  objectKeys: readonly string[]
): Promise<void> {
  for (
    let offset = 0;
    offset < objectKeys.length;
    offset += maxDeleteObjectsPerRequest
  ) {
    const response = (await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: objectKeys
            .slice(offset, offset + maxDeleteObjectsPerRequest)
            .map((Key) => ({ Key })),
          Quiet: true,
        },
      })
    )) as { readonly Errors?: readonly unknown[] }

    if ((response.Errors?.length ?? 0) > 0) {
      throw new Error("Object provider reported partial deletion failure.")
    }
  }
}

function createPublicObjectUrl(baseUrl: string, objectKey: string): string {
  const encodedKey = objectKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")
  return `${baseUrl.replace(/\/$/u, "")}/${encodedKey}`
}
