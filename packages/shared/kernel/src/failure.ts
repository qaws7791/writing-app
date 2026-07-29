/**
 * 실패는 판별 가능한 `kind`와 함께, 예외에서 만들어진 경우 그 원인을 보존한다.
 * `cause`가 없으면 장애 원인을 코드 밖에서 되짚을 방법이 사라진다.
 */
export type Failure<
  TKind extends string,
  TDetail extends object = Record<never, never>,
> = Readonly<
  {
    cause?: unknown
    kind: TKind
  } & TDetail
>
