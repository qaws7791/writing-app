# 제품 문서

## 목적

- `docs/product`는 `글결` 제품 판단의 기준 문서다.
- 화면, 기능, 콘텐츠, 운영 범위를 제품 언어로 정리한다.
- 구현 계획, 조사 로그, 회고 기록은 이 디렉터리의 원천이 아니다.

## 문서 지도

- [product-vision.md](./product-vision.md): 제품 비전과 비목표.
- [product-research.md](./product-research.md): 코드와 기존 문서에서 확인한 제품 사실.
- [personas.md](./personas.md): 학습자와 관리자 유형.
- [problem-definition.md](./problem-definition.md): 해결 문제와 제약.
- [product-requirements.md](./product-requirements.md): 현재 제품 요구사항.
- [feature-specification.md](./feature-specification.md): 학습자 기능과 어드민 기능.
- [product-behavior.md](./product-behavior.md): 전체 기능의 단일 Gherkin 행동 명세.
- [content-model.md](./content-model.md): 코스, 유닛, 레슨, 스텝 모델.
- [user-flows.md](./user-flows.md): 주요 사용자 흐름.
- [user-stories.md](./user-stories.md): 사용자 스토리와 인수 기준.
- [screen-specification.md](./screen-specification.md): 화면별 명세.
- [admin-operations.md](./admin-operations.md): 관리자 권한과 운영 동작.
- [metrics.md](./metrics.md): 현재 지표와 후보 지표.

## 근거 우선순위

- 1순위: 현재 코드, schema, seed 데이터.
- 2순위: `CONTEXT.md`, `DOMAIN.md`, `ARCHITECTURE.md`, `FRONTEND.md`, `BACKEND.md`.
- 3순위: `docs` 루트의 최신 완료 기록.
- 4순위: `docs/superpowers`의 설계, 계획, 증거 문서.
- 충돌 시 현재 코드와 schema를 우선한다.

## 현재 기준선

- 제품명: `글결`.
- 제품 영역: 한국어 글쓰기 학습 플랫폼.
- 학습자 앱: 랜딩, 로그인, 홈, 코스 목록, 코스 상세, 레슨, 프로필.
- 어드민 앱: 로그인, 대시보드, 콘텐츠 관리, 사용자 관리, 분석, 운영 설정.
- 콘텐츠: 5개 코스, 15개 유닛, 44개 레슨, 136개 스텝.
- 확정 스텝 타입: `READING`, `COMPARE`, `MULTIPLE_CHOICE`, `FILL_BLANK`, `SELECT`, `ORDER`, `WRITE`, `AI_FEEDBACK`, `MATCH`, `CATEGORIZE`.
- 콘텐츠 상태: `active`, `archived`.
- 레슨 진행 상태: `available`, `completed`, `locked`.

## 문서 관리 규칙

- 모든 문서는 한국어로 작성한다.
- 파일명은 케밥 케이스를 사용한다.
- 문장은 짧게 쓴다.
- 기능은 실제 코드에 있는 단어로 설명한다.
- 확인되지 않은 시장 가설은 확정 기능처럼 쓰지 않는다.
- 새 기능이 추가되면 관련 제품 문서와 구현 문서를 함께 갱신한다.
