import { bodyLimit } from "hono/body-limit"

export const BODY_LIMITS = {
  default: 100 * 1024, // 100KB
  document: 512 * 1024, // 512KB: 글 본문 / AI 리뷰 입력
  syncPush: 2 * 1024 * 1024, // 2MB: 오프라인 트랜잭션 배치
} as const

export function withBodyLimit(maxSize: number) {
  return bodyLimit({
    maxSize,
    onError: (c) =>
      c.json(
        {
          error: {
            code: "payload_too_large",
            message: "요청 본문이 너무 큽니다.",
          },
        },
        413
      ),
  })
}
