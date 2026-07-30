export type AuthRuntimeLogLevel = "debug" | "error" | "info" | "warn"

/**
 * Better Auth runtime 로그의 목적지다. 주입하지 않으면 라이브러리 기본 logger가
 * 그대로 동작한다. 테스트는 로그를 버리는 port를 주입해 console 실패 gate와
 * 충돌하지 않게 한다.
 */
export type AuthRuntimeLogger = Readonly<{
  log: (level: AuthRuntimeLogLevel, message: string) => void
}>

export function readAuthRuntimeLoggerOption(
  logger: AuthRuntimeLogger | undefined
):
  | { readonly log: (_level: AuthRuntimeLogLevel, _message: string) => void }
  | undefined {
  if (logger === undefined) return undefined

  return {
    log(level, message) {
      logger.log(level, message)
    },
  }
}

/** 로그를 남기지 않는 port. 실패 경로를 의도적으로 실행하는 테스트가 사용한다. */
export const silentAuthRuntimeLogger: AuthRuntimeLogger = {
  log() {},
}
