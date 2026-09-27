# 한글쓰기 학습 플랫폼

한글쓰기 학습 플랫폼 모노레포다.

확정 제품 범위는 [제품 범위](docs/product/product-scope.md)에서, 제품·디자인·엔지니어링 기준은 [문서 인덱스](docs/_index.md)에서 시작한다. package, route, 환경 변수, 배포 topology처럼 현재 코드 사실은 [사실별 권위 지도](docs/authority-map.md)가 가리키는 코드와 설정에서 확인한다.

## 전제 조건

[Bun](https://bun.com/docs/installation)과 [Node.js](https://nodejs.org/en/download) 실행 파일을 `PATH`에 설치한다. 필요한 버전은 [package.json](package.json)의 `packageManager`와 `engines.node`가 소유한다. `setup`은 실제 실행 파일의 버전을 변경 작업 전에 검증한다.

## 빠른 시작

```bash
git clone https://github.com/qaws7791/writing-app.git
cd writing-app
bun run setup
bun run dev
```

`setup`은 설치, 생성, 환경 파일 보충, 로컬 D1 migration, 기본 seed와 진단을 실행한다. 기존 사용자 환경 값은 보존한다. API 비밀 값과 관리자 개발 계정은 Git에서 제외된 `apps/api/.dev.vars`에 저장한다. Cloudflare 로그인과 원격 자원은 로컬 실행에 필요하지 않다. 실행 방식과 제한은 [런타임 설정 원칙](docs/engineering/runtime-configuration.md)을 따른다.

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
bun run verify
```

`dev:ui`는 Luma 컴포넌트 문서, 격리 예제와 shadcn registry를 제공하는 Astro 앱을 실행한다.

테스트 전용 인증, 데이터 초기화, 배포 관련 검증은 [테스트 기준](docs/engineering/testing.md)과 [배포 절차](docs/engineering/deployment.md)를 먼저 확인한다.

## 문서

- `docs/product`: 제품 문제, 요구사항과 운영 정책
- `docs/design`: 화면 목적, 정보 구조, UI와 접근성 기준
- `docs/engineering`: 설계 원칙, 구현·운영 절차와 품질 기준

현재 코드 사실을 문서의 서술로 추정하지 않는다.
