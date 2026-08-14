# Lexical 작성 캔버스 도입

## 문서 상태

- 상태: 구현 중
- 영구 결정: [ADR-0037](../../engineering/adr/ADR-0037-lexical-compose-canvas.md)

이 문서는 한시 작업 범위다. 현재 제품 사실은 권위 문서를 따른다.

## 범위

- `@workspace/ui`에 `ComposeCanvas`를 추가한다.
- 작성 세션과 writing-studio block만 교체한다.
- 저장·점검·글자 수는 일반 텍스트 `body`를 유지한다.
- `ComposeEditor`와 받아쓰기는 바꾸지 않는다.

## 완료 기준

- 문단 간격이 작성 세션에 보인다.
- 평문 왕복이 빈 문자열, 한글, 연속 개행, 끝 개행을 유지한다.
- 320px와 텍스트 200% 확대에서 가로 스크롤이 생기지 않는다.
- 관련 권위 문서와 ADR-0037이 구현과 같다.
