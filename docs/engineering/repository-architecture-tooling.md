# 저장소 아키텍처 검증 도구

## 책임

정적 import graph 검사는 다음 세 실패만 차단한다.

- type-only edge를 제외한 runtime 순환 의존성
- source에서 import하지만 package manifest에 선언하지 않은 외부 의존성
- web·admin에서 module, DB, ORM 또는 server 전용 환경 parser로 향하는 의존성

규칙의 권위 source는 `dependency-cruiser.config.mjs`이고 실행 진입점은 `scripts/check-architecture.ts`다. 실행기는 root manifest의 workspace glob을 읽고 각 workspace TypeScript 설정으로 Dependency Cruiser를 호출할 뿐, 별도 package inventory나 허용·금지 가상 저장소를 유지하지 않는다.

## 의도적으로 강제하지 않는 구조

`domain`, `application`, `interface`, `infrastructure` 같은 폴더 배치, feature 내부 방향, package export 모양과 vendor별 소유권은 별도 규칙 엔진으로 강제하지 않는다. 이러한 구조는 package의 공개 표면, TypeScript 접근 가능성, 제품 테스트와 코드 리뷰에서 판단한다.

이 선택은 정적 검사만으로 발견하던 일부 내부 결합을 리뷰 단계까지 늦출 수 있다. 반면 구조를 바꿀 때 정책 parser, fixture와 snapshot을 함께 수정하던 유지보수 비용을 제거하고, 보안상 중요한 frontend server·DB 경계와 실제 dependency 정합성은 계속 자동 차단한다.

## 실행

root `lint`는 Oxlint만 실행한다. import graph 검사는 별도 root task로 실행하며 CI의 정적 검사 job이 둘을 함께 호출한다. 형식, 타입, 동작과 배포 가능성은 각각 Oxfmt, TypeScript, 제품 테스트, production build와 Compose smoke가 소유한다.

정적 검사의 통과는 source graph만 증명하며 production traffic, 외부 provider와 실제 배포 상태를 증명하지 않는다.
