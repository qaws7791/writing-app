import { applyResourceDocumentUpdate } from "@workspace/resource-document"

type ResourceDocumentProjectionWorkerInput = {
  readonly snapshot: Uint8Array
  readonly update: Uint8Array
}

self.onmessage = (
  event: MessageEvent<ResourceDocumentProjectionWorkerInput>
) => {
  self.postMessage(
    applyResourceDocumentUpdate(event.data.snapshot, event.data.update)
  )
}
