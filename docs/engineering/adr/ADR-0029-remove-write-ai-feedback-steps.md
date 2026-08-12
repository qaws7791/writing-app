# ADR-0029: WRITE·AI_FEEDBACK 스텝 타입 제거

## 상태

채택됨

## 날짜

2026-08-12

## 맥락

레슨 스텝 타입은 `READING`, `COMPARE`, `MULTIPLE_CHOICE`, `FILL_BLANK`, `SELECT`, `ORDER`, `WRITE`, `AI_FEEDBACK`, `MATCH`, `CATEGORIZE` 10개로 운영됐다. `WRITE`는 레슨 안에서 글을 작성하고, `AI_FEEDBACK`은 같은 레슨의 앞선 `WRITE` 답안을 대상으로 OpenAI 코칭을 제공했다.

제품은 레슨과 독립된 집중형 쓰기(focused writing)를 별도 기능으로 이미 제공한다. 레슨 안 쓰기와 AI 코칭은 집중형 쓰기와 역할이 겹치고, 운영·개인정보·관찰 경계가 복잡해졌다. 콘텐츠 시드와 편집기·런타임·계약·마이그레이션 전반에 두 타입을 유지하는 비용도 커졌다.

## 결정

- `WRITE`와 `AI_FEEDBACK` 스텝 타입을 제거한다.
- 확정 스텝 타입은 8개(`READING`, `COMPARE`, `MULTIPLE_CHOICE`, `FILL_BLANK`, `SELECT`, `ORDER`, `MATCH`, `CATEGORIZE`)로 고정한다.
- 레슨과 독립된 집중형 쓰기(`writing` module)는 유지한다. 레슨 스텝 쓰기를 대체하지 않으며 별도 사용자 여정과 데이터 경계를 가진다.
- `@workspace/ai-feedback` module, 관련 환경 변수(`OPENAI_*`, `AI_FEEDBACK_*`), attempt·quota table과 AI 코칭 HTTP 경계를 제거한다.
- 기존 `req-lrn-6` 요구사항은 보관하고 제품·엔지니어링 권위 문서에서 AI 코칭 기준을 제거한다.

## 대안과 트레이드오프

- **WRITE만 제거하고 AI_FEEDBACK 유지**: 대상 답안이 사라져 의미가 없다.
- **AI_FEEDBACK만 제거하고 WRITE 유지**: 레슨 안 쓰기와 집중형 쓰기 중복이 남는다.
- **집중형 쓰기를 레슨 스텝으로 흡수**: 독립 글 작성·자기 점검 흐름을 레슨 진행 모델에 억지로 맞추게 된다.

## 결과

- 콘텐츠 모델, 어드민 편집기, 학습자 레슨 런타임이 8개 타입만 다룬다.
- OpenAI provider 의존성과 AI 코칭 운영 지표·개인정보 처리 경계가 사라진다.
- 글쓰기 연습은 집중형 쓰기 기능으로 일원화된다.
