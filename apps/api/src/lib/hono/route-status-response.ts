export type SuccessStatusCode = 200 | 201 | 202 | 204

/**
 * 핸들러에서 특정 HTTP 상태 코드와 함께 데이터를 반환할 때 사용합니다.
 * 응답에 2xx 상태 코드가 여러 개 정의된 경우(예: 200 / 202) 동적으로 선택할 수 있습니다.
 *
 * @example
 * ```ts
 * handler: async ({ submitStep, ... }) =>
 *   (await submitStep(...)).map((v) =>
 *     withStatus(v.runtime, v.acceptedAi ? 202 : 200)
 *   )
 * ```
 */
export class RouteStatusResponse<TData> {
  readonly __routeStatusBrand = true as const
  constructor(
    readonly data: TData,
    readonly status: SuccessStatusCode
  ) {}
}

export function withStatus<TData>(
  data: TData,
  status: SuccessStatusCode
): RouteStatusResponse<TData> {
  return new RouteStatusResponse(data, status)
}
