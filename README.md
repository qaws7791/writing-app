# 한글쓰기 학습 플랫폼

한글쓰기 학습 플랫폼 모노레포다.

확정 제품 범위는 [제품 범위](docs/product/product-scope.md)에서, 제품·디자인·엔지니어링 기준은 [문서 인덱스](docs/_index.md)에서 시작한다. package, route, 환경 변수, 배포 topology처럼 현재 코드 사실은 [사실별 권위 지도](docs/authority-map.md)가 가리키는 코드와 설정에서 확인한다.

## 빠른 시작

```bash
git clone https://github.com/qaws7791/writing-app.git
cd writing-app
bun run setup
bun run dev
```

`setup`은 누락된 환경 파일을 생성하고 설치·migration·기본 seed·진단을 순서대로 실행하며 기존 환경 파일은 덮어쓰지 않는다. migration 전에 실행 중인 개발 서버를 종료하고 보존이 필요한 로컬 DB는 직접 백업한다. 실제 준비 절차와 실패 진단은 [런타임 설정 원칙](docs/engineering/runtime-configuration.md)을 따른다.

## 개발과 검증

필요한 범위에 맞는 공개 실행 진입점만 사용한다.

```bash
bun run dev:app
bun run dev:admin
bun run dev:ui
bun run doctor
bun run lint
bun run typecheck
bun run test
bun run build
```

`dev:ui`는 Luma 컴포넌트 문서, 격리 예제와 shadcn registry를 제공하는 Astro 앱을 실행한다.

테스트 전용 인증, 데이터 초기화, 배포 관련 검증은 [테스트 기준](docs/engineering/testing.md)과 [배포 절차](docs/engineering/deployment.md)를 먼저 확인한다.

## 문서

- `docs/product`: 제품 문제, 요구사항과 운영 정책
- `docs/design`: 화면 목적, 정보 구조, UI와 접근성 기준
- `docs/engineering`: 설계 원칙, 구현·운영 절차와 품질 기준
- `docs/work`: 진행 중인 한시적 작업 기록
- `docs/archive`: 날짜와 commit이 고정된 과거 기록과 검증 증거

현재 코드 사실을 문서의 서술로 추정하지 않는다. 작업 로그와 archive도 현재 사실의 근거로 사용하지 않는다.
