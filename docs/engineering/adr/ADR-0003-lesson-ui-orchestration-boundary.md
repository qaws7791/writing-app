# ADR-0003: 레슨 UI와 오케스트레이션 경계

## 상태

채택됨

## 날짜

2026-07-04

## 맥락

기존 lesson 공유 패키지는 스텝 프레젠테이션, 채점 정책, 앱 모델 타입, `LessonStepRenderer`를 한곳에 묶었다. 학습자 앱과 어드민 step-debug가 이를 공유했지만, API 호출·세션·OpenAPI 타입 소유권은 이미 앱에 있었고 패키지 경계가 불명확했다.

ADR-0002는 도메인 이름을 가진 module을 공용 UI API로 올리지 않는다고 정했다. 다만 스텝 답안 UI처럼 앱 간 시각·상호작용이 동일한 순수 프레젠테이션은 프리미티브와 폴더만 구분해 `packages/ui`에 두는 편이 중복과 drift를 줄인다.

## 결정

- lesson 공유 패키지를 제거한다.
- `packages/ui/src/components/ui`는 shadcn/Base UI 프리미티브를 유지한다.
- `packages/ui/src/components/lesson`은 순수 도메인 프레젠테이션만 둔다. 표시 props, 로컬 인터랙션 상태, 단순 변경 콜백만 허용한다.
- 레슨 앱 모델, 답안 payload, 채점/제출 정책, 세션, API 호출, `LessonStepRenderer` 타입 분기는 `apps/web/src/features/lessons`가 소유한다.
- 어드민 step-debug는 동일 UI를 쓰되 policy/renderer는 앱 로컬로 둔다. 공유 lesson 패키지는 만들지 않는다.
- 학습자 프론트 wire 타입은 openapi-typescript 생성물과 `writing-app-api-contract.ts`에 격리한다. `packages/core`는 백엔드만 의존한다.
- ADR-0002의 “도메인 이름 module을 공용 UI API로 올리지 않는다”는 **비즈니스 로직·라우팅·데이터 조회가 섞인 feature module**에 적용한다. 순수 프레젠테이션은 `components/<domain>` 경로 import로 허용한다.

## 고려한 대안

### 대안 1. lesson 공유 패키지 유지

- 장점: web/admin 공유가 단순하다.
- 단점: UI와 정책이 한 패키지에 남아 오케스트레이션 경계가 흐려진다.

### 대안 2. 정책까지 `packages/ui`에 포함

- 장점: 앱 코드가 짧아진다.
- 단점: 채점·payload가 UI 패키지로 새어 들어가고 OpenAPI/앱 모델과 결합된다.

## 결과

- 공유 UI는 순수 컴포넌트만 제공한다.
- 앱은 OpenAPI mapper 결과와 feature policy로 레슨 경험을 조립한다.
- workspace inventory에서 lesson 공유 패키지 항목이 사라진다.
