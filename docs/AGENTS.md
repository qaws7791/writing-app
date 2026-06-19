# docs 에이전트 안내

## 범위

이 문서는 `docs` 디렉토리에서 작업하는 에이전트를 위한 최소 안내이다.

## 구조

- `docs/_index.md`: 문서 전체의 진입점과 탐색 지도.
- `docs/product/`: 문제, 비전, 사용자, 유저 스토리, 요구사항, 콘텐츠, 운영 기준.
- `docs/design/`: 정보 구조, 화면 명세, 디자인 토큰, UI 패턴, 접근성, 에셋 기준.
- `docs/engineering/`: 시스템 구조, 기술 스택, API와 데이터 계약, 인증, 테스트, 운영 기준.

## 기능 추가 플로우

1. `docs/_index.md`에서 관련 문서 위치를 확인한다.
2. 제품 기준을 먼저 확인한다.
   - 사용자 가치: `docs/product/user-stories/`
   - 구현 요구사항: `docs/product/requirements/`
3. 화면이나 흐름이 바뀌면 디자인 문서를 확인한다.
   - 라우트와 정보 구조: `docs/design/ia-spec.md`
   - 화면 명세: `docs/design/screens/`
   - 공통 UI 기준: `docs/design/components.md`, `docs/design/patterns.md`
4. API, 데이터, 권한, 운영 방식이 바뀌면 엔지니어링 문서를 확인한다.
   - 시스템 경계: `docs/engineering/system-overview.md`
   - API 계약: `docs/engineering/api-contract.md`
   - 데이터 모델: `docs/engineering/data-model.md`
   - 인증과 권한: `docs/engineering/auth-permissions.md`
   - 테스트 기준: `docs/engineering/testing.md`
5. 변경한 문서가 속한 디렉토리의 `_index.md`를 함께 갱신해야 하는지 확인한다.

## 작성 기준

- 모든 문서는 한국어로 작성한다.
- 변경 범위는 필요한 문서에만 한정한다.
- 제품 기준과 디자인, 엔지니어링 기준이 충돌하면 제품 기준을 먼저 정리한다.
- 새 결정이 되돌리기 어렵거나 여러 경계를 바꾸면 `docs/engineering/adr/`에 ADR을 추가한다.
