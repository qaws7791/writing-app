# UI Registry

개인용 공개 shadcn 레지스트리와 Astro 데모 사이트입니다.

현재 registry source의 모든 Luma UI 컴포넌트, block과 `use-mobile` 훅을
포함합니다. 각 registry item은 독립적인 `/r/{name}.json` URL로 설치할 수
있습니다. 현재 item 목록과 수는 `registry/luma/registry.json`이 소유합니다.

## 기술 구성

- Astro와 React
- Tailwind CSS v4
- shadcn Luma 스타일과 Base UI
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

## 레지스트리 사용

`registry.json`의 `YOUR_GITHUB_ID`를 실제 GitHub 사용자 이름으로 변경한 뒤
저장소를 공개하세요.

```bash
bunx shadcn@latest add https://YOUR_GITHUB_ID.github.io/ui/r/button.json
```

GitHub Pages 배포 시 `bun run build`가 레지스트리 JSON을 `public/r`에 생성하고,
Astro가 데모와 함께 정적 파일로 배포합니다. 로컬에서 레지스트리 산출물만 만들려면:

```bash
bun run registry:build
```

## 컴포넌트 문서

`/docs/components/accordion`부터 전체 컴포넌트별 정적 문서 페이지를
제공합니다. 각 페이지에는 실제 Luma 프리뷰, 설치 명령, 사용 예제,
자주 사용하는 Props와 현재 소스의 export 목록이 포함됩니다.

새 문서를 추가하거나 수정할 때는 [`DOCS_GUIDELINES.md`](./DOCS_GUIDELINES.md)의
예제, 상태, 조합, 접근성 기준을 따릅니다. `bun run docs:validate`로 전체 문서의
최소 품질 조건과 관련 컴포넌트 링크를 확인할 수 있습니다.
