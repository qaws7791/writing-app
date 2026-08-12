# WRITE·AI_FEEDBACK 제거 작업 보고

## 요약

레슨 스텝 타입 `WRITE`와 `AI_FEEDBACK`을 제거하고 확정 타입을 8개로 축소했다. 레슨과 독립된 집중형 쓰기는 유지한다.

## 변경 범위

- 제품·디자인·엔지니어링 권위 문서에서 두 타입과 AI 코칭 흐름 참조 제거
- `OPENAI_*`, `AI_FEEDBACK_*` 환경 변수와 배포 템플릿 정리
- `req-lrn-6` 요구사항을 `docs/archive/2026-08-12-remove-write-ai-feedback/`로 이동
- [ADR-0029](../engineering/adr/ADR-0029-remove-write-ai-feedback-steps.md)로 결정 기록

## 비범위

- 집중형 쓰기(`writing` module) 기능과 지표
- 관리자 MCP·콘텐츠 운영 흐름
