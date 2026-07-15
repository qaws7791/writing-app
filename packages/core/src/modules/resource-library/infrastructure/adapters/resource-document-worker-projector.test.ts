import { describe, expect, it } from "vitest"

import { createResourceDocumentWorkerProjector } from "#core/modules/resource-library/infrastructure/adapters/resource-document-worker-projector"
import { createResourceDocumentSnapshot } from "@workspace/resource-document"

describe("자료 문서 Worker projector", () => {
  it("snapshot과 update를 Worker에서 투영하고 완료한다", async () => {
    const snapshot = createResourceDocumentSnapshot("Worker 본문")
    if (snapshot.status !== "valid") {
      throw new Error("Worker projector fixture 생성 실패")
    }

    await expect(
      createResourceDocumentWorkerProjector().project({
        snapshot: snapshot.snapshot,
        timeoutMilliseconds: 1_000,
        update: snapshot.snapshot,
      })
    ).resolves.toMatchObject({
      kind: "completed",
      projection: {
        markdown: "Worker 본문",
        status: "valid",
      },
    })
  })

  it("deadline을 넘긴 Worker를 종료하고 timeout을 반환한다", async () => {
    await expect(
      createResourceDocumentWorkerProjector().project({
        snapshot: new Uint8Array(),
        timeoutMilliseconds: 0,
        update: new Uint8Array(),
      })
    ).resolves.toMatchObject({ kind: "timeout" })
  })
})
