# 변경 요약

-

## 확인한 문서

- [ ] 관련 `/docs` 문서를 작업 시작 시점에 확인했다.
- [ ] 구현 변경과 함께 `/docs` 문서를 최신 상태로 갱신했다.
- [ ] 되돌리기 어렵거나 경계를 바꾸는 결정은 ADR로 남겼다.
- [ ] 확정 범위 밖 기능을 추가하지 않았다. 범위를 바꿨다면 별도 범위 변경 티켓을 연결했다.

## 연결 티켓

- GG-

## 디자인 시스템 이관 체크리스트

- [ ] 새 `admin-*` 디자인 class를 추가하지 않았다.
- [ ] 새 정적 inline typography(`fontSize`, `lineHeight`, `letterSpacing`)를 추가하지 않았다.
- [ ] 새 raw hex를 앱 소스에 추가하지 않았다. 예외가 있으면 이유를 본문에 적었다.
- [ ] 새 수동 dialog, menu, accordion, segmented control을 만들지 않았다.
- [ ] `packages/shared/ui`에 도메인 이름이나 앱 runtime 책임을 넣지 않았다.
- [ ] 공용 컴포넌트 변경에는 Storybook story 또는 interaction test를 함께 추가했다.

## 검증

- [ ] `bun run lint`
- [ ] `bun run typecheck`
- [ ] `bun run test`
- [ ] 필요한 경우 `bun --filter storybook build`
