# 관리자 MCP 1~3단계 전체 Tool 구현 계획

## 상태

- 기준일: 2026-08-10
- 상태: 로컬 구현 완료, 저장소 기준선 gate 장애 확인
- 기준 커밋: `f7fb789f01e5515cf33f4dc5f7849b9f5d125004`
- 제외 범위: 이미지 업로드와 이미지 연결

## 목표

관리자 MCP의 1단계 조회 Tool을 유지한다.

2단계 Tool인 코스 생성, 초안 저장, 코스 복원을 별도 OAuth scope와 멱등성 검증을 적용한 제한적 자동 실행으로 제공한다.

3단계 Tool인 코스 발행, 코스 보관, 사용자 상태 변경, 사용자 삭제를 요청마다 관리자 승인을 받은 뒤 실행한다.

## 구현 순서

1. Tool 입력·출력 계약과 단계별 OAuth scope를 확정한다.
2. 자동 실행 영수증과 승인 대상의 영속 구조를 append-only migration으로 확장한다.
3. 코스 생성·저장·복원의 멱등 자동 실행을 content application에 연결한다.
4. 코스 발행·보관과 사용자 상태 변경·삭제를 승인 coordinator에 연결한다.
5. 승인 화면과 감사 provenance를 코스·사용자 대상 및 자동·승인 실행에 맞게 확장한다.
6. 제품·디자인·엔지니어링 권위 문서와 ADR을 현재 구현에 맞게 갱신한다.
7. 계약, persistence, MCP runtime, UI 문서 검증과 저장소 품질 gate를 실행한다.

## 완료 조건

- 기존 1단계 조회 Tool 7개가 그대로 동작한다.
- 2단계 Tool 3개는 관리자 확인 화면 없이 실행된다.
- 2단계 재시도는 동일한 변경 효과로 수렴하며 다른 입력에 같은 멱등성 키를 사용하면 실패한다.
- 3단계 Tool 4개는 유효한 관리자 승인 전에는 변경을 실행하지 않는다.
- 모든 변경 Tool은 실행 주체, OAuth client, 입력 digest, 대상, 결과를 감사 기록에 남긴다.
- 이미지 업로드와 이미지 연결 Tool은 등록되지 않는다.
- 변경 범위에 해당하는 테스트와 저장소 필수 품질 gate가 통과한다.

## 검증 상태

- MCP 집중 테스트 42개, 변경 package 타입 검사, lint, format과 architecture 검사가 통과했다.
- `bun run ci:static`은 저장소 기준선의 누락된 Oxlint 테스트 파일, `http-platform` Node 타입 설정과 기존 Knip 항목 때문에 실패했다.
- `bun run ci:tests`의 workspace 테스트 42개는 통과했다. repository tier는 `scripts` 아래 테스트 파일이 없어서 실패했다.
- `bun run build`는 Web production origin이 없어서 실패했다. API build와 Admin TypeScript 단계는 통과했다.
- `bun run check:route-bundles`는 기존 Web `/` 경로가 gzip 예산을 초과해 실패했다.
