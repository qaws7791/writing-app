# course-admin 블록 설계안 반영

## 목적

어드민 코스 상세 레지스트리 블록(`course-admin`, `curriculum-builder`)을 첨부 설계안(탭·행위 분리, 트리+마스터디테일, 스텝 Sheet, 이중 검증, 게시 상태 게이팅)에 맞게 재구성한다.

## 범위

- 포함: `packages/shared/ui` 블록과 `apps/ui` registry 미러, 데모 fixture
- 제외: `apps/admin` 코스 편집기, API·영속화, SCR-104 / REQ-ADM-3 / US-ADM-3 권위 문서 갱신

## 권위와의 관계

제품 화면 권위는 계속 `docs/design/screens/SCR-104-admin-course-detail.md`다. 이번 작업은 UI 문서용 프로토타입이며, 설계안과 SCR-104가 다르면 제품 권위를 바꾸지 않고 이 work 문서에만 분기를 기록한다.

주요 분기:

- 전역 `미리보기` / `게시하기` 버튼과 코스 게시 상태 뱃지(`초안` / `게시됨` / `게시됨·변경있음`)
- 스텝 편집을 인라인·접이식 미리보기 대신 우측 Sheet로 처리
- `검증·게시` 단일 패널과 인라인 검증 요약

## 완료 조건

- 블록이 설계안의 IA(3탭 + 전역 버튼 + 트리 + Sheet + 검증 리포트)를 데모 데이터로 충족한다.
- `source:validate`와 관련 lint·typecheck가 통과한다.
- 완료 시 이 디렉터리를 `docs/archive/2026-08-11-course-admin-redesign/`로 이동한다. 제품 권위 문서로 승격할 결론이 생기면 그때 SCR-104 등을 별도로 갱신한다.
