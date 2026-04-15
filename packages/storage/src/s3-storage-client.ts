import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

import type { StorageClient, StorageConfig } from "./storage-client"

export function createS3StorageClient(config: StorageConfig): StorageClient {
  const s3 = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
    forcePathStyle: true,
  })

  return {
    async uploadFile({ key, body, contentType, contentLength }) {
      await s3.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          ContentLength: contentLength,
        })
      )

      const url = `${config.publicUrl.replace(/\/$/, "")}/${config.bucket}/${key}`
      return { url }
    },
  }
}
