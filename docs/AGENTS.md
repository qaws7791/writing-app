# docs 에이전트 안내

## 범위

이 문서는 `docs` 디렉토리에서 작업하는 에이전트를 위한 최소 안내이다.

## 구조

- `docs/_index.md`: 문서 전체의 진입점과 탐색 지도.
- `docs/product/`: 문제, 비전, 사용자, 유저 스토리, 요구사항, 콘텐츠, 운영 기준.
- `docs/design/`: 정보 구조, 화면 명세, 디자인 토큰, UI 패턴, 접근성, 에셋 기준.
- `docs/engineering/`: 시스템 구조, 기술 스택, API와 데이터 계약, 인증, 테스트, 운영 기준.
- `docs/work/`: 진행 중인 한시적 계획, 조사, 감사와 검증.
- `docs/archive/`: 완료되거나 폐기된 작업 기록. 현재 사실 판정에서 제외.

## 기능 추가 플로우

1. `docs/_index.md`와 `docs/authority-map.md`에서 질문의 종류와 사실 소유자를 확인한다.
2. 제품 기준을 먼저 확인한다.
   - 사용자 가치: `docs/product/user-stories/`
   - 구현 요구사항: `docs/product/requirements/`
3. 화면이나 흐름이 바뀌면 디자인 문서를 확인한다.
   - 라우트와 정보 구조: `docs/design/ia-spec.md`
   - 화면 명세: `docs/design/screens/`
   - 공통 UI 기준: `docs/design/components.md`, `docs/design/patterns.md`
4. API, 데이터, 권한, 운영 방식이 바뀌면 엔지니어링 문서와 코드 권위 소스를 확인한다.
   - 시스템 경계: `docs/engineering/system-overview.md`
   - API 계약: `docs/engineering/api-contract.md`
   - 데이터 모델: `docs/engineering/data-model.md`
   - 인증과 권한: `docs/engineering/auth-permissions.md`
   - 테스트 기준: `docs/engineering/testing.md`
5. 변경한 문서가 속한 디렉토리의 `_index.md`를 함께 갱신해야 하는지 확인한다.
6. 현재 작업 문맥이 필요할 때만 `docs/work`를 읽고, `docs/archive`는 과거 증거가 명시적으로 필요할 때만 읽는다.

## 작성 기준

- 모든 문서는 한국어로 작성한다.
- 변경 범위는 필요한 문서에만 한정한다.
- 제품 기준과 디자인, 엔지니어링 기준이 충돌하면 제품 기준을 먼저 정리한다.
- 새 결정이 되돌리기 어렵거나 여러 경계를 바꾸면 `docs/engineering/adr/`에 ADR을 추가한다.
- 새 계획·조사·감사 문서는 `docs/work/<yyyy-mm-dd-name>/`에 두고 완료하면 같은 디렉터리 이름으로 `docs/archive`에 이동한다.
- `docs/work`, `docs/archive`와 ADR을 현재 topology의 권위 소스로 사용하지 않는다.
- 한시 문서에서 확인한 영구 결론은 완료 전에 권위 지도에 지정된 현재 문서에 반영한다.
- package, port, 환경 변수 기본값, route, service, image, network, schema, 테스트 대상처럼 코드·설정이 소유하는 현재 사실을 living 문서에 복제하지 않는다. 필요한 경우 권위 소스에 직접 링크한다.
- 검증 보고서는 기준 commit, 실행 시각·환경, 명령, 결과와 artifact 위치를 고정한다.
