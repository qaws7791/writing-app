# SCR-107 분석

## 라우트

- `apps/admin`: `/analytics`

## 목적

관리자가 가입, 완료, 연속 학습일, 레슨별 완료율과 이탈률을 분석한다.

## 주요 사용자

- 운영자
- 콘텐츠 개선 담당자

## 정보 구조

- `PageHeader`
- 최근 30일 가입 추이
- 연속 학습일 분포
- `DataTable` 레슨별 완료율

## UI 기준

- 요약 영역은 2열 responsive grid와 `Surface variant="panel"`을 사용한다.
- 시계열과 bucket은 Recharts 기반 차트로 표시할 수 있다.
- 차트 영역에는 수치 단위와 데이터 의미를 텍스트로 보완한다.
- 레슨별 분석은 `DataTableContainer`와 `DataTable`로 제공한다.

## 상태

- 분석 요약 조회 성공
- 분석 요약 조회 실패
- 레슨별 분석 조회 실패 시 빈 목록
- 분석 row 없음

## 접근성

- table에는 `aria-label="레슨별 분석"`을 제공한다.
- 수치 단위는 `%`, `명`, `개`처럼 텍스트에 포함한다.
- 오류는 `role="alert"`로 표시한다.
