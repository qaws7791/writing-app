# Luma UI 문서

모노레포 내부용 Astro 디자인 시스템 문서 사이트입니다.

`@workspace/ui`의 UI 컴포넌트, block과 hook을 문서와 실행 예제로 제공합니다.
구현 소스는 `packages/shared/ui`가 소유합니다.

## 기술 구성

- Astro와 React
- Tailwind CSS v4
- Base UI 기반 Luma 스타일
- TypeScript
- Pretendard Variable
- Hugeicons Free
- Bun
- Oxlint와 Oxfmt

## 시작하기

```bash
bun install
bun run dev
```

모노레포 root에서는 `bun run dev:ui`를 사용합니다.

## 검증

```bash
bun run verify
bun run audit
```

## 컴포넌트 문서

`/docs/components/accordion`부터 전체 컴포넌트별 정적 문서 페이지를
제공합니다. 각 페이지에는 실제 Luma 프리뷰, workspace import 경로, 사용 예제,
자주 사용하는 Props와 현재 소스의 export 목록이 포함됩니다.

새 문서를 추가하거나 수정할 때는 [`DOCS_GUIDELINES.md`](./DOCS_GUIDELINES.md)의
예제, 상태, 조합, 접근성 기준을 따릅니다. `bun run docs:validate`로 전체 문서의
최소 품질 조건과 관련 컴포넌트 링크를 확인할 수 있습니다.
