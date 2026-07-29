import sharp from "sharp"
import { err, ok } from "@workspace/kernel/result"
import type { ContentAssetImageProcessorPort } from "@workspace/content/ports"

const maxInputPixels = 40_000_000

export function createSharpContentAssetImageProcessor(): ContentAssetImageProcessorPort {
  return {
    async process(input) {
      try {
        const sourceBytes = Buffer.from(input.bytes)
        const metadata = await sharp(sourceBytes, {
          failOn: "warning",
          limitInputPixels: maxInputPixels,
          sequentialRead: true,
        }).metadata()
        if (
          !matchesContentType(metadata.format, input.contentType) ||
          (metadata.pages ?? 1) !== 1
        ) {
          return err({ reason: "image-decode-failed" })
        }

        const profile = contentAssetResizeProfile(input.kind)
        let pipeline = sharp(sourceBytes, {
          failOn: "warning",
          limitInputPixels: maxInputPixels,
          sequentialRead: true,
        })
          .rotate()
          .resize(profile)

        switch (input.contentType) {
          case "image/jpeg":
            pipeline = pipeline.jpeg({ mozjpeg: true, quality: 85 })
            break
          case "image/png":
            pipeline = pipeline.png({ compressionLevel: 9 })
            break
          case "image/webp":
            pipeline = pipeline.webp({ quality: 85 })
            break
        }

        const output = await pipeline.toBuffer()
        if (output.byteLength > 5 * 1024 * 1024) {
          return err({ reason: "processed-image-too-large" })
        }

        return ok({
          bytes: Uint8Array.from(output),
          contentType: input.contentType,
        })
      } catch (cause) {
        return err({ cause, reason: "image-decode-failed" })
      }
    },
  }
}

function contentAssetResizeProfile(
  kind: Parameters<ContentAssetImageProcessorPort["process"]>[0]["kind"]
) {
  return kind === "course-cover"
    ? {
        fit: "cover" as const,
        height: 900,
        width: 1_600,
      }
    : {
        fit: "inside" as const,
        height: 1_440,
        width: 1_440,
        withoutEnlargement: true,
      }
}

function matchesContentType(
  format: string | undefined,
  contentType: Parameters<
    ContentAssetImageProcessorPort["process"]
  >[0]["contentType"]
): boolean {
  return (
    (format === "jpeg" && contentType === "image/jpeg") ||
    (format === "png" && contentType === "image/png") ||
    (format === "webp" && contentType === "image/webp")
  )
}
