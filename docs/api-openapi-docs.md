# API OpenAPI 문서 통합

## 2026-05-26 시작

- `apps/api`가 OpenAPI JSON 파일을 생성하고, `apps/docs`가 이 파일을 읽어 Fumadocs API 문서로 생성하는 파이프라인을 구축한다.
- docs 앱은 현재 정적 export 구조를 유지하므로 실행 중인 API 서버를 fetch하지 않는다.
- OpenAPI 입력 파일은 docs 앱 내부에 저장해 빌드와 리뷰에서 재현 가능한 산출물로 관리한다.
- 문서 생성에는 `fumadocs-openapi`를 사용한다.
- 범위 제외: API 클라이언트 SDK 생성, 별도 Swagger UI/Scalar 런타임 콘솔, API 계약 변경, `/prototype` 변경.
