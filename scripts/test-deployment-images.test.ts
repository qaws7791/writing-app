import { describe, expect, test } from "bun:test"

import {
  validateComposeRuntimeServices,
  validateComposeSmokeServices,
} from "./test-deployment-images"

describe("production image smoke 계약", () => {
  test("Caddy traffic smoke에 필요한 네 service만 실행한다", () => {
    expect(validateComposeSmokeServices("api\nadmin\ncaddy\nweb\n")).toEqual([])
    expect(
      validateComposeSmokeServices("api\nadmin\nadmin-api\ncaddy\nweb\n")
    ).toEqual(["admin-api: Compose smoke 외부 service입니다."])
  })

  test("상시 runtime을 web, admin, api, caddy, litestream으로 제한한다", () => {
    expect(
      validateComposeRuntimeServices("web\nadmin\napi\ncaddy\nlitestream\n")
    ).toEqual([])
    expect(
      validateComposeRuntimeServices(
        "web\nadmin\napi\ncaddy\nlitestream\nlegacy-proxy\n"
      )
    ).toEqual(["legacy-proxy: Compose runtime 외부 service입니다."])
  })
})
