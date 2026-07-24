import type { Page } from "@playwright/test"

export async function installAiFeedbackFailures(
  page: Page,
  failures: readonly ("provider" | "quota")[]
): Promise<void> {
  await page.evaluate((failureSequence) => {
    const originalFetch = window.fetch.bind(window)
    let failureIndex = 0

    window.fetch = async (input, init) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url
      if (url.endsWith("/ai-feedback")) {
        const failure = failureSequence[failureIndex]
        if (failure !== undefined) {
          failureIndex += 1
          const quota = failure === "quota"
          return new Response(
            JSON.stringify({
              code: quota
                ? "AI_FEEDBACK_DAILY_QUOTA_EXCEEDED"
                : "PROVIDER_UNAVAILABLE",
              message: quota
                ? "오늘 사용할 수 있는 AI 코칭 요청량을 모두 사용했습니다."
                : "AI 코칭을 잠시 사용할 수 없습니다.",
              requestId: `e2e-${failureIndex}`,
              violations: [],
            }),
            {
              headers: {
                "Content-Type": "application/json",
                ...(quota ? { "Retry-After": "3600" } : {}),
              },
              status: quota ? 429 : 503,
            }
          )
        }
      }

      return originalFetch(input, init)
    }
  }, failures)
}
