import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { err, ok, ResultAsync, type Result } from "@workspace/kernel/result"
import { z } from "zod"

const privateObjectStorageConfigSchema = z.object({
  accessKeyId: z.string().min(1),
  bucket: z.string().min(1),
  endpoint: z.url(),
  region: z.string().min(1),
  secretAccessKey: z.string().min(1),
})

export type PrivateObjectStorageConfig = z.input<
  typeof privateObjectStorageConfigSchema
>

export type PrivateObjectStorageError = Readonly<{
  cause?: unknown
  kind: "configuration-invalid" | "operation-failed"
  operation: "configure" | "get-object" | "list-objects" | "put-object"
  retryable: boolean
}>

export type PrivateObjectStorage = Readonly<{
  getObject: (
    objectKey: string
  ) => ResultAsync<Uint8Array, PrivateObjectStorageError>
  listObjectKeys: (
    prefix: string
  ) => ResultAsync<readonly string[], PrivateObjectStorageError>
  putObject: (input: {
    readonly body: Uint8Array
    readonly contentType: string
    readonly objectKey: string
  }) => ResultAsync<void, PrivateObjectStorageError>
}>

type PrivateObjectStorageSdkClient = Readonly<{
  send: (command: unknown) => Promise<unknown>
}>

export function createS3PrivateObjectStorage(
  input: PrivateObjectStorageConfig,
  options: { readonly client?: PrivateObjectStorageSdkClient } = {}
): Result<PrivateObjectStorage, PrivateObjectStorageError> {
  const parsed = privateObjectStorageConfigSchema.safeParse(input)
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
    getObject(objectKey) {
      return ResultAsync.fromPromise(
        readObject(client, config.bucket, objectKey),
        (cause): PrivateObjectStorageError => ({
          cause,
          kind: "operation-failed",
          operation: "get-object",
          retryable: true,
        })
      )
    },
    listObjectKeys(prefix) {
      return ResultAsync.fromPromise(
        listObjectKeys(client, config.bucket, prefix),
        (cause): PrivateObjectStorageError => ({
          cause,
          kind: "operation-failed",
          operation: "list-objects",
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
          .then(() => undefined),
        (cause): PrivateObjectStorageError => ({
          cause,
          kind: "operation-failed",
          operation: "put-object",
          retryable: true,
        })
      )
    },
  })
}

async function listObjectKeys(
  client: PrivateObjectStorageSdkClient,
  bucket: string,
  prefix: string
): Promise<readonly string[]> {
  const keys: string[] = []
  let continuationToken: string | undefined

  do {
    const response = (await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
        Prefix: prefix,
      })
    )) as {
      readonly Contents?: readonly Readonly<{ Key?: string }>[]
      readonly IsTruncated?: boolean
      readonly NextContinuationToken?: string
    }
    keys.push(
      ...(response.Contents ?? []).flatMap(({ Key }) =>
        Key === undefined ? [] : [Key]
      )
    )
    if (
      response.IsTruncated === true &&
      response.NextContinuationToken === undefined
    ) {
      throw new Error("S3 pagination token is missing.")
    }
    continuationToken =
      response.IsTruncated === true ? response.NextContinuationToken : undefined
  } while (continuationToken !== undefined)

  return keys
}

async function readObject(
  client: PrivateObjectStorageSdkClient,
  bucket: string,
  objectKey: string
): Promise<Uint8Array> {
  const response = (await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: objectKey })
  )) as {
    readonly Body?: Readonly<{
      transformToByteArray?: () => Promise<Uint8Array>
    }>
  }
  const body = response.Body
  if (body?.transformToByteArray === undefined) {
    throw new Error("S3 object body is missing.")
  }
  return body.transformToByteArray()
}
