import { parseApiEnv } from "@/config/env"

function checkEnvironment(): void {
  const environment = parseApiEnv(process.env)
  const googleOAuth =
    environment.googleClientId === undefined
      ? "- Google OAuth: 비활성"
      : "- Google OAuth: 활성"
  const authEmail =
    environment.authEmail.kind === "in-memory"
      ? environment.nodeEnv === "development"
        ? "- 인증 메일: data/local-auth-email.json에 최신 확인 또는 비밀번호 재설정 메일을 저장"
        : "- 인증 메일: 격리된 메모리 adapter 사용"
      : "- 인증 메일: Resend 사용"
  const contentAssetUpload =
    environment.adminAssetStore === undefined
      ? "- 콘텐츠 asset 업로드: 비활성. 기본 코스는 bundled thumbnail 사용"
      : "- 콘텐츠 asset 업로드: S3 adapter 사용"
  process.stdout.write(
    [
      "✓ API 환경 변수 계약을 통과했습니다.",
      googleOAuth,
      authEmail,
      contentAssetUpload,
    ].join("\n") + "\n"
  )
}

if (import.meta.main) {
  try {
    checkEnvironment()
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`
    )
    process.exitCode = 1
  }
}
