import type { ContentAssetImageProcessorPort } from "@workspace/content/ports"
import { err, ok } from "@workspace/kernel/result"

export function createCloudflareContentAssetImageProcessor(
  images: ImagesBinding
): ContentAssetImageProcessorPort {
  return {
    async process(input) {
      try {
        const source = new Blob([Uint8Array.from(input.bytes)])
        const metadata = await images.info(source.stream())
        if (
          !("width" in metadata) ||
          metadata.format !== input.contentType ||
          metadata.width * metadata.height > 40_000_000
        ) {
          return err({ reason: "image-decode-failed" })
        }
        const transformed = await images
          .input(source.stream())
          .transform(
            input.kind === "course-cover"
              ? { width: 1600, height: 900, fit: "cover" }
              : { width: 1440, height: 1440, fit: "scale-down" }
          )
          .output({ format: input.contentType, quality: 85, anim: false })
        const bytes = new Uint8Array(await transformed.response().arrayBuffer())
        if (bytes.byteLength > 5 * 1024 * 1024)
          return err({ reason: "processed-image-too-large" })
        return ok({ bytes, contentType: input.contentType })
      } catch (cause) {
        return err({ cause, reason: "image-decode-failed" })
      }
    },
  }
}
