# 저장소 아키텍처 검증 도구

## 책임

정적 import graph 검사는 다음 실패를 차단한다.

- type-only edge를 제외한 runtime 순환 의존성
- source에서 import하지만 package manifest에 선언하지 않은 외부 의존성
- web·admin에서 허용되지 않은 workspace package 또는 다른 frontend app으로 향하는 의존성
- module의 `domain`·`application`에서 framework, DB infra, ORM 또는 module infrastructure로 향하는 의존성
- module 외부에서 해당 module manifest가 공개하지 않은 `src` target으로 향하는 의존성
- operations reporting에서 다른 module 구현으로 향하는 의존성

규칙의 권위 source는 [Dependency Cruiser 설정](../../dependency-cruiser.config.mjs)이고 실행 진입점은 [root manifest](../../package.json)의 `check:architecture`다. root TypeScript 설정으로 `apps`와 `packages`의 실제 graph를 한 번 검사한다. module의 공개 target은 각 module manifest의 `exports`에서 읽으므로 별도 package·export inventory를 복제하지 않는다.

TypeScript 7은 안정된 programmatic API를 제공하지 않으므로 CLI 타입 검사는 TypeScript 7 native compiler가 소유하고, Dependency Cruiser의 source parser에는 공식 호환 package의 TypeScript 6 API만 제공한다. 두 실행 경로는 root manifest에서 서로 다른 package 이름으로 고정한다. Dependency Cruiser가 TypeScript 7의 안정 API를 지원하면 TypeScript 6 호환 package를 제거하고 정상 graph와 의도적 위반 fixture를 다시 검증한다.

의도적 위반 fixture는 frontend 허용 목록·cross-app, module layer와 외부·module 간 private target 규칙이 각각 실제로 실패하는지 확인한다. 동일 app 내부 import, Next.js framework와 module public target import가 허용되는지도 같은 graph 결과에서 검증한다. fixture의 source 문자열을 검사하거나 규칙 구현을 snapshot으로 고정하지 않는다.

## Knip

[Knip 설정](../../knip.json)은 root와 각 workspace의 entry·project 경계를 명시한다. Orval 산출물은 `http-client` manifest의 공개 export target에서 시작하고 `.generated`에만 unused file·symbol 진단 예외를 둔다. 생성 source의 dependency와 unresolved import 진단은 유지한다. formatter 제외는 [Oxfmt 설정](../../.oxfmtrc.json)이 별도로 소유한다.

Knip은 사용되지 않는 파일·의존성·export와 중복 public symbol을 판정한다. package export target의 해석 가능성과 실제 조립 가능성은 TypeScript와 consumer build가 최종 검증한다.

## 의도적으로 강제하지 않는 구조

feature 내부 방향, 폴더 존재 여부와 vendor별 소유권은 별도 규칙 엔진으로 복제하지 않는다. module layer 규칙은 실제 `domain`·`application` source의 금지 import만 판정하고 폴더 구성을 강제하지 않는다. frontend의 같은 app 내부 방향은 코드 리뷰와 제품 테스트가 판단한다.

## 실행

root `lint`는 Oxlint만 실행한다. architecture와 Knip은 별도 root task로 실행하며 CI의 정적 검사 job이 호출한다. 형식, 타입, 동작과 배포 가능성은 각각 Oxfmt, TypeScript, 제품 테스트, production build와 Compose smoke가 소유한다.

정적 검사의 통과는 source graph만 증명하며 production traffic, 외부 provider와 실제 배포 상태를 증명하지 않는다.
