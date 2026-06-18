# ADR-0001 예시: 결정 제목

## 상태

제안됨

## 날짜

2026-06-19

## 맥락

어떤 문제가 있었고 왜 지금 결정이 필요한지 설명한다. 코드 위치, 운영 제약, 사용자 영향, 기존 문서와의 관계를 함께 적는다.

## 결정

선택한 방향을 명확히 쓴다.

예:

- `apps/api -> packages/core -> packages/db` 의존성 방향을 유지한다.
- `apps/api`는 Drizzle과 `@workspace/db`를 직접 import하지 않는다.
- 경계 위반은 Oxlint custom rule로 차단한다.

## 고려한 대안

### 대안 1. 현재 구조 유지

- 장점: 변경 비용이 작다.
- 단점: 경계 위반이 반복될 수 있다.

### 대안 2. 별도 service package 추가

- 장점: 조립 경계를 더 세밀하게 나눌 수 있다.
- 단점: 현재 규모에서는 package 수와 개념 수가 늘어난다.

## 선택 근거

왜 선택한 결정이 현재 문제에 가장 단순하고 안전한지 설명한다.

- 현재 요구를 해결한다.
- 되돌리기 어렵지 않다.
- 테스트와 lint로 관찰 가능하다.
- 새 개념을 과하게 늘리지 않는다.

## 결과

결정 후 생기는 변화와 비용을 적는다.

- 코드 변경 위치
- 문서 변경 위치
- 테스트와 검증 방법
- 운영상 주의점
- 후속 작업

## 검증

결정을 검증한 명령이나 테스트를 적는다.

```bash
bun run lint
bun run test
bun run typecheck
```

## 관련 문서

- `docs/engineering/system-overview.md`
- `docs/engineering/code-style.md`
- `docs/engineering/code-review.md`
