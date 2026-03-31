/** 런타임 DI 키와 컴파일타임 타입을 함께 운반하는 인젝션 토큰 */
export type InjectionToken<T = unknown> = {
  readonly key: string
  /** @internal phantom type – 런타임에 접근 불가 */
  readonly __type: T
}

export function createToken<T>(key: string): InjectionToken<T> {
  return { key } as InjectionToken<T>
}
