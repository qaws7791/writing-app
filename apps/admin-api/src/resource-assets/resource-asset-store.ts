import {
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"

import type { AdminAssetStoreEnv } from "@/env"

const maxDeleteObjectsPerRequest = 1_000

export type ResourceAssetStore = {
  readonly deleteObjects: (objectKeys: readonly string[]) => Promise<void>
  readonly putObject: (input: {
    readonly body: Uint8Array
    readonly contentType: "image/jpeg" | "image/png" | "image/webp"
    readonly objectKey: string
  }) => Promise<{ readonly url: string }>
}

export function createR2ResourceAssetStore(
  config: AdminAssetStoreEnv
): ResourceAssetStore {
  const endpoint = new URL(config.endpoint)
  const client = new S3Client({
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: config.endpoint,
    forcePathStyle:
      endpoint.hostname === "localhost" || endpoint.hostname === "127.0.0.1",
    region: config.region,
  })

  return {
    async deleteObjects(objectKeys) {
      for (
        let offset = 0;
        offset < objectKeys.length;
        offset += maxDeleteObjectsPerRequest
      ) {
        const result = await client.send(
          new DeleteObjectsCommand({
            Bucket: config.bucket,
            Delete: {
              Objects: objectKeys
                .slice(offset, offset + maxDeleteObjectsPerRequest)
                .map((Key) => ({ Key })),
              Quiet: true,
            },
          })
        )
        if ((result.Errors?.length ?? 0) > 0) {
          throw new Error("R2 객체 일부를 삭제하지 못했습니다.")
        }
      }
    },
    async putObject(input) {
      await client.send(
        new PutObjectCommand({
          Body: input.body,
          Bucket: config.bucket,
          ContentType: input.contentType,
          Key: input.objectKey,
        })
      )
      return {
        url: createPublicAssetUrl(config.publicBaseUrl, input.objectKey),
      }
    },
  }
}

function createPublicAssetUrl(baseUrl: string, objectKey: string): string {
  const encodedKey = objectKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")
  return `${baseUrl.replace(/\/$/u, "")}/${encodedKey}`
}
