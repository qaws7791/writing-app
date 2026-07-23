import { describe, expect, test } from "bun:test"

import { validateComposeSmokeServices } from "./test-deployment-images"

describe("production image smoke 계약", () => {
  test("정의된 네 service만 실행한다", () => {
    expect(validateComposeSmokeServices("api\nadmin\ncaddy\nweb\n")).toEqual([])
    expect(
      validateComposeSmokeServices(
        "api\nadmin\nadmin-api\ncaddy\ncloudflared\nweb\n"
      )
    ).toEqual([
      "admin-api: Compose smoke 외부 service를 실행하면 안 됩니다.",
      "cloudflared: Compose smoke 외부 service를 실행하면 안 됩니다.",
    ])
  })
})
