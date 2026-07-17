/**
 * Target 관리자 route를 직접 검증하는 fixture의 최소 계약이다.
 *
 * target contract runner와 route test가 동일한 최소 fixture 계약을 공유한다.
 */
export type AdminTargetRouteFixtureJson =
  | null
  | boolean
  | number
  | string
  | readonly AdminTargetRouteFixtureJson[]
  | { readonly [key: string]: AdminTargetRouteFixtureJson }

export type AdminTargetRouteFixture = {
  readonly fetch: (request: Request) => Promise<Response> | Response
  readonly readEffectJournal: () => readonly AdminTargetRouteFixtureJson[]
}
