import { randomUUID } from "node:crypto"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

import type {
  AdminCourseThumbnailContentType,
  AdminCreateCourseThumbnailUploadDto,
  AdminCreateCourseThumbnailUploadRequestDto,
} from "@workspace/core/admin"

type CreateUploadUrlInput = {
  bucket: string
  key: string
  contentType: AdminCourseThumbnailContentType
}

type CreateCourseThumbnailUploadDependencies = {
  bucket: string
  createId?: () => string
  createUploadUrl: (input: CreateUploadUrlInput) => Promise<string>
  publicBaseUrl: string
}

export type CourseThumbnailStorageConfig = {
  accessKey: string
  bucket: string
  endpoint: string
  publicBaseUrl: string
  region: string
  secretKey: string
}

const extensionByContentType: Record<AdminCourseThumbnailContentType, string> =
  {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  }

export function getCourseThumbnailObjectKey(input: {
  contentType: AdminCourseThumbnailContentType
  id: string
}) {
  return `course-thumbnails/${input.id}.${extensionByContentType[input.contentType]}`
}

export async function createCourseThumbnailUpload(
  input: AdminCreateCourseThumbnailUploadRequestDto,
  dependencies: CreateCourseThumbnailUploadDependencies
): Promise<AdminCreateCourseThumbnailUploadDto> {
  const key = getCourseThumbnailObjectKey({
    contentType: input.contentType,
    id: dependencies.createId?.() ?? randomUUID(),
  })
  const uploadUrl = await dependencies.createUploadUrl({
    bucket: dependencies.bucket,
    key,
    contentType: input.contentType,
  })

  return {
    uploadUrl,
    method: "PUT",
    headers: {
      "content-type": input.contentType,
    },
    thumbnailPath: `${dependencies.publicBaseUrl.replace(/\/+$/, "")}/${key}`,
  }
}

export function createS3CourseThumbnailUploadUrlFactory(
  config: CourseThumbnailStorageConfig
) {
  const client = new S3Client({
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
    endpoint: config.endpoint,
    forcePathStyle: true,
    region: config.region,
  })

  return async (input: CreateUploadUrlInput) =>
    getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: input.bucket,
        Key: input.key,
        ContentType: input.contentType,
      }),
      {
        expiresIn: 300,
        signableHeaders: new Set(["content-type"]),
      }
    )
}
