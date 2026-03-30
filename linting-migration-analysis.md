# Prettier + ESLint → Biome / oxlint+oxfmt 마이그레이션 가능성 분석 보고서

> 작성일: 2026-03-29  
> 분석 대상: `writing-app` (Turborepo 기반 Bun 모노레포)

---

## 목차

1. [현재 설정 현황](#1-현재-설정-현황)
2. [Biome 마이그레이션 분석](#2-biome-마이그레이션-분석)
3. [oxlint + oxfmt 마이그레이션 분석](#3-oxlint--oxfmt-마이그레이션-분석)
4. [대안 비교표](#4-대안-비교표)
5. [결론 및 권장사항](#5-결론-및-권장사항)

---

## 1. 현재 설정 현황

### 1.1 Prettier 설정 (`.prettierrc`)

```json
{
  "endOfLine": "lf",
  "semi": false,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindStylesheet": "packages/ui/src/styles/globals.css",
  "tailwindFunctions": ["cn", "cva"]
}
```

**핵심 의존**: `prettier-plugin-tailwindcss` — Tailwind CSS 유틸리티 클래스 자동 정렬

### 1.2 ESLint 구성 (`packages/config/eslint/`)

| 구성 파일           | 적용 대상       | 사용 플러그인                                                                                                                                 |
| ------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `base.js`           | 전체 (API 포함) | `@eslint/js`, `typescript-eslint`, `eslint-config-prettier`, `eslint-plugin-only-warn`, `eslint-plugin-turbo`, `eslint-plugin-unused-imports` |
| `next.js`           | `apps/web`      | base + `@next/eslint-plugin-next`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `globals`                                              |
| `react-internal.js` | `packages/ui`   | base + `eslint-plugin-react`, `eslint-plugin-react-hooks`, `globals`                                                                          |

### 1.3 핵심 규칙 목록

| 플러그인                       | 주요 역할                                                                         |
| ------------------------------ | --------------------------------------------------------------------------------- |
| `typescript-eslint`            | TypeScript 타입 안전성 규칙                                                       |
| `eslint-plugin-react`          | JSX/React 컴포넌트 규칙, `react/react-in-jsx-scope: off`, `react/prop-types: off` |
| `eslint-plugin-react-hooks`    | `rules-of-hooks`, `exhaustive-deps`                                               |
| `@next/eslint-plugin-next`     | Next.js 전용 규칙 (recommended + core-web-vitals)                                 |
| `eslint-plugin-unused-imports` | `no-unused-imports: error`                                                        |
| `eslint-plugin-turbo`          | `no-undeclared-env-vars: warn`                                                    |
| `eslint-plugin-only-warn`      | 모든 error를 warn으로 다운그레이드                                                |
| `eslint-config-prettier`       | Prettier와 충돌하는 ESLint 규칙 비활성화                                          |

---

## 2. Biome 마이그레이션 분석

### 2.1 Biome 개요

Biome(구 Rome)은 하나의 바이너리로 포매터, 린터, 임포트 정렬을 통합한 Rust 기반 툴체인이다.  
현재 최신 버전은 **v2.x** (2025년 기준)로 모노레포 공식 지원이 추가됐다.

### 2.2 언어·프레임워크 지원

| 언어/환경             | 파싱       | 포매팅     | 린팅      |
| --------------------- | ---------- | ---------- | --------- |
| JavaScript/TypeScript | ✅         | ✅         | ✅        |
| JSX/TSX               | ✅         | ✅         | ✅        |
| CSS                   | ✅         | ✅         | ✅        |
| JSON/JSONC            | ✅         | ✅         | ✅        |
| HTML                  | ✅         | ✅         | ✅        |
| GraphQL               | ✅         | ✅         | ✅        |
| SCSS                  | ⌛ 진행 중 | ⌛ 진행 중 | 🚫        |
| YAML                  | ⌛ 진행 중 | ⌛ 진행 중 | 🚫        |
| Vue/Svelte/Astro      | 🟡 실험적  | 🟡 실험적  | 🟡 실험적 |

TypeScript 5.9 지원, JSX/TSX 완전 지원.

### 2.3 현재 ESLint 플러그인 → Biome 규칙 대응

#### `typescript-eslint` → Biome 내장

| ESLint 규칙                                  | Biome 동등 규칙      | 상태    |
| -------------------------------------------- | -------------------- | ------- |
| `@typescript-eslint/no-explicit-any`         | `noExplicitAny`      | ✅ 안정 |
| `@typescript-eslint/no-unused-vars`          | `noUnusedVariables`  | ✅ 안정 |
| `@typescript-eslint/no-non-null-assertion`   | `noNonNullAssertion` | ✅ 안정 |
| `@typescript-eslint/consistent-type-imports` | `useImportType`      | ✅ 안정 |
| `@typescript-eslint/no-empty-interface`      | `noEmptyInterface`   | ✅ 안정 |
| `@typescript-eslint/ban-types`               | `noBannedTypes`      | ✅ 안정 |

#### `eslint-plugin-react` + `eslint-plugin-react-hooks` → Biome 내장

| ESLint 규칙                     | Biome 동등 규칙             | 상태    |
| ------------------------------- | --------------------------- | ------- |
| `react-hooks/rules-of-hooks`    | `useHookAtTopLevel`         | ✅ 안정 |
| `react-hooks/exhaustive-deps`   | `useExhaustiveDependencies` | ✅ 안정 |
| `react/jsx-key`                 | `useJsxKeyInIterable`       | ✅ 안정 |
| `react/no-children-prop`        | `noChildrenProp`            | ✅ 안정 |
| `react/no-danger`               | `noDangerouslySetInnerHtml` | ✅ 안정 |
| `react/react-in-jsx-scope: off` | 자동 비활성 (불필요)        | ✅      |
| `react/prop-types: off`         | TypeScript 사용 시 불필요   | ✅      |

#### `@next/eslint-plugin-next` → Biome 내장

| ESLint 규칙                             | Biome 동등 규칙              | 상태               |
| --------------------------------------- | ---------------------------- | ------------------ |
| `@next/next/no-img-element`             | `noImgElement`               | ✅ 안정            |
| `@next/next/no-document-import-in-page` | `noDocumentImportInPage`     | ✅ 안정            |
| `@next/next/no-head-import-in-document` | `noHeadImportInDocument`     | ✅ 안정            |
| `@next/next/no-head-element`            | `noHeadElement`              | ✅ 안정            |
| `@next/next/google-font-display`        | `useGoogleFontDisplay`       | ✅ 안정            |
| `@next/next/google-font-preconnect`     | `useGoogleFontPreconnect`    | ✅ 안정            |
| `@next/next/no-async-client-component`  | `noNextAsyncClientComponent` | ✅ 안정            |
| **core-web-vitals 추가 규칙 일부**      | -                            | ⚠️ **부분 미지원** |

#### `eslint-plugin-unused-imports` → Biome 내장

| ESLint 규칙                        | Biome 동등        | 상태    |
| ---------------------------------- | ----------------- | ------- |
| `unused-imports/no-unused-imports` | `noUnusedImports` | ✅ 안정 |

#### ⚠️ 대응 불가 플러그인

| 현재 플러그인                                    | Biome 지원 여부                     | 대안                                           |
| ------------------------------------------------ | ----------------------------------- | ---------------------------------------------- |
| `eslint-plugin-turbo` (`no-undeclared-env-vars`) | ❌ 미지원                           | 별도 처리 필요 (아래 참고)                     |
| `eslint-plugin-only-warn`                        | ❌ 직접 미지원                      | Biome severity 설정으로 대체 (`"warn"/"info"`) |
| `prettier-plugin-tailwindcss`                    | ⚠️ **미지원** (nursery 규칙만 존재) | 대체 불가 — 핵심 제약                          |

### 2.4 포매터: Biome vs Prettier

| 항목                          | Prettier 현재 설정                        | Biome 대응 |
| ----------------------------- | ----------------------------------------- | ---------- |
| `semi: false`                 | ✅ 지원 (`"semicolons": "asNeeded"`)      |
| `singleQuote: false`          | ✅ 지원 (`"quoteStyle": "double"`)        |
| `tabWidth: 2`                 | ✅ 지원                                   |
| `trailingComma: "es5"`        | ✅ 지원 (`"trailingCommas": "es5"`)       |
| `printWidth: 80`              | ✅ 지원 (`"lineWidth": 80`)               |
| `endOfLine: "lf"`             | ✅ 지원 (`"lineEnding": "lf"`)            |
| `prettier-plugin-tailwindcss` | ❌ **미지원** — Tailwind 클래스 정렬 불가 |

Biome의 `biome migrate prettier` 명령으로 자동 변환 가능하나, Tailwind 클래스 정렬은 제공되지 않는다.

> **`useSortedClasses` (Biome nursery 규칙)**: Tailwind 클래스 정렬 기능이 존재하지만 **nursery** 카테고리 (불안정/실험적)이며, Prettier 플러그인처럼 자동 포매팅이 아닌 린트 경고 + 자동수정 방식으로 동작. 신뢰성이 보장되지 않음.

### 2.5 모노레포 지원

Biome v2부터 **공식 모노레포 지원**. `"extends": "//"` 구문으로 루트 설정에서 패키지별 설정 상속 가능.

```json
// apps/web/biome.json
{
  "root": false,
  "extends": "//",
  "linter": { "rules": { ... } }
}
```

### 2.6 마이그레이션 용이성

Biome는 다음 명령을 공식 제공:

```bash
biome migrate eslint --write           # ESLint 설정을 Biome 설정으로 변환
biome migrate prettier --write         # Prettier 설정을 Biome 설정으로 변환
```

단, YAML 형식의 ESLint 설정은 지원하지 않으며, 일부 플러그인 설정은 수동 조정 필요.

### 2.7 Biome 마이그레이션 결론

| 항목                     | 평가                              |
| ------------------------ | --------------------------------- |
| TypeScript 규칙          | ✅ 완전 대체 가능                 |
| React/React Hooks 규칙   | ✅ 완전 대체 가능                 |
| Next.js 규칙             | ✅ 대부분 대체 가능 (일부 미지원) |
| 사용하지 않는 임포트     | ✅ 대체 가능                      |
| **Tailwind 클래스 정렬** | ❌ **대체 불가** (nursery만 존재) |
| Turbo 환경변수 규칙      | ❌ 미지원                         |
| 모노레포 지원            | ✅ v2부터 지원                    |
| 마이그레이션 도구        | ✅ 공식 CLI 제공                  |

**🔴 핵심 장애물**: `prettier-plugin-tailwindcss` 완전 대체 불가.  
이 프로젝트는 `cn()`, `cva()` 함수까지 Tailwind 정렬 대상으로 지정하고 있어, 이 기능 없이는 코드 일관성 유지가 어렵다.

---

## 3. oxlint + oxfmt 마이그레이션 분석

### 3.1 oxlint + oxfmt 개요

**oxlint**: Oxc 컴파일러 스택 기반 Rust 고성능 린터. 701개 내장 규칙. ESLint 대비 50–100배 빠름.  
**oxfmt**: Oxc 컴파일러 스택 기반 고성능 포매터. Prettier 대비 약 30배 빠름. Prettier 호환.

두 도구는 독립적으로 배포되며, 함께 사용하면 ESLint + Prettier 조합을 대체한다.

### 3.2 언어·프레임워크 지원

| 언어/환경             | oxlint           | oxfmt            |
| --------------------- | ---------------- | ---------------- |
| JavaScript/TypeScript | ✅ 완전          | ✅ 완전          |
| JSX/TSX               | ✅ 완전          | ✅ 완전          |
| React / Next.js       | ✅ 완전          | ✅ 완전          |
| CSS/SCSS/Less         | 🚫 (스코프 외)   | ✅ 완전          |
| JSON/YAML/TOML        | 🚫 (스코프 외)   | ✅ 완전          |
| HTML                  | 🚫 (스코프 외)   | ✅ 완전          |
| Markdown/GraphQL      | 🚫 (스코프 외)   | ✅ 완전          |
| Vue/Svelte (템플릿)   | ⚠️ script 블록만 | 🚫 미지원 (예정) |

### 3.3 현재 ESLint 플러그인 → oxlint 내장 플러그인 대응

oxlint는 다음 플러그인들을 **내장 빌트인**으로 제공한다:

| 현재 ESLint 플러그인                                | oxlint 내장 플러그인 | 기본 활성    |
| --------------------------------------------------- | -------------------- | ------------ |
| ESLint 코어                                         | `eslint`             | ✅ 기본      |
| `typescript-eslint`                                 | `typescript`         | ✅ 기본      |
| `eslint-plugin-unicorn`                             | `unicorn`            | ✅ 기본      |
| `eslint-plugin-react` + `eslint-plugin-react-hooks` | `react`              | ❌ 별도 활성 |
| `@next/eslint-plugin-next`                          | `nextjs`             | ❌ 별도 활성 |
| `eslint-plugin-import` / `eslint-plugin-import-x`   | `import`             | ❌ 별도 활성 |
| `eslint-plugin-jsx-a11y`                            | `jsx-a11y`           | ❌ 별도 활성 |
| `eslint-plugin-jest`                                | `jest`               | ❌ 별도 활성 |
| `@vitest/eslint-plugin`                             | `vitest`             | ❌ 별도 활성 |

#### `typescript-eslint` → oxlint 내장 (typescript 플러그인)

| ESLint 규칙                                     | oxlint 규칙                             | 타입 인식    | 상태 |
| ----------------------------------------------- | --------------------------------------- | ------------ | ---- |
| `@typescript-eslint/no-explicit-any`            | `typescript/no-explicit-any`            | 기본         | ✅   |
| `@typescript-eslint/no-unused-vars`             | `eslint/no-unused-vars`                 | 기본         | ✅   |
| `@typescript-eslint/consistent-type-imports`    | `typescript/consistent-type-imports`    | 기본         | ✅   |
| `@typescript-eslint/no-floating-promises`       | `typescript/no-floating-promises`       | 💭 타입 필요 | ✅   |
| `@typescript-eslint/strict-boolean-expressions` | `typescript/strict-boolean-expressions` | 💭 타입 필요 | ✅   |
| `@typescript-eslint/no-misused-promises`        | `typescript/no-misused-promises`        | 기본         | ✅   |

#### React / React Hooks → oxlint `react` 플러그인

| ESLint 규칙                   | oxlint 규칙                | 상태 |
| ----------------------------- | -------------------------- | ---- |
| `react-hooks/rules-of-hooks`  | `react/rules-of-hooks`     | ✅   |
| `react-hooks/exhaustive-deps` | `react/exhaustive-deps`    | ✅   |
| `react/jsx-key`               | `react/jsx-key`            | ✅   |
| `react/no-danger`             | `react/no-danger`          | ✅   |
| `react/no-children-prop`      | `react/no-children-prop`   | ✅   |
| `react/react-in-jsx-scope`    | `react/react-in-jsx-scope` | ✅   |

#### `@next/eslint-plugin-next` → oxlint `nextjs` 플러그인

| ESLint 규칙                             | oxlint 규칙                         | 상태 |
| --------------------------------------- | ----------------------------------- | ---- |
| `@next/next/no-img-element`             | `nextjs/no-img-element`             | ✅   |
| `@next/next/no-document-import-in-page` | `nextjs/no-document-import-in-page` | ✅   |
| `@next/next/no-head-import-in-document` | `nextjs/no-head-import-in-document` | ✅   |
| `@next/next/google-font-display`        | `nextjs/google-font-display`        | ✅   |
| `@next/next/no-async-client-component`  | `nextjs/no-async-client-component`  | ✅   |
| `@next/next/no-sync-scripts`            | `nextjs/no-sync-scripts`            | ✅   |

#### `eslint-plugin-unused-imports` → oxlint

| ESLint 규칙                        | oxlint 대응                           | 상태 |
| ---------------------------------- | ------------------------------------- | ---- |
| `unused-imports/no-unused-imports` | `eslint/no-unused-vars` (import 감지) | ✅   |

#### ⚠️ 대응 불가 플러그인

| 현재 플러그인             | oxlint 지원 여부 | 대안                                    |
| ------------------------- | ---------------- | --------------------------------------- |
| `eslint-plugin-turbo`     | ❌ 내장 미지원   | JS 플러그인 (alpha) 또는 별도 유지      |
| `eslint-plugin-only-warn` | N/A              | oxlint 자체 severity 설정으로 대체 가능 |
| `eslint-config-prettier`  | N/A              | oxfmt 사용 시 불필요                    |
| `globals`                 | N/A              | oxlint 자체 globals 설정                |

### 3.4 oxfmt: Prettier 호환 포매터

oxfmt는 **Prettier 100% 호환**을 목표로 하며, 다음 내장 기능을 Prettier 플러그인 없이 제공한다:

| 기능                         | Prettier      | oxfmt            |
| ---------------------------- | ------------- | ---------------- |
| JS/TS 포매팅                 | ✅            | ✅ (100% 호환)   |
| **Tailwind CSS 클래스 정렬** | ✅ (플러그인) | ✅ **내장 지원** |
| import 정렬                  | ✅ (플러그인) | ✅ 내장 지원     |
| `package.json` 필드 정렬     | ✅ (플러그인) | ✅ 내장 지원     |
| CSS-in-JS 임베디드 포매팅    | ✅ (플러그인) | ✅ 내장 지원     |
| CSS/SCSS/Less                | ✅            | ✅               |
| YAML/TOML                    | 플러그인 필요 | ✅ 내장          |

**Tailwind CSS 정렬 설정 예시** (`.oxfmtrc.json`):

```json
{
  "tailwindCss": {
    "stylesheet": "packages/ui/src/styles/globals.css",
    "functions": ["cn", "cva"]
  }
}
```

Prettier에서 마이그레이션:

```bash
oxfmt --migrate prettier
```

### 3.5 oxfmt 성숙도

oxfmt는 **v1.0 이전** 단계이나, 이미 상용 가능 수준의 완성도를 지닌다:

- JavaScript/TypeScript Prettier 호환 테스트 100% 통과
- Sentry, Kibana, Renovate 등 대형 프로젝트에서 oxlint 운용 중
- XML/SVG 지원은 v1.0 예정 (현재 미지원)

### 3.6 모노레포 지원

oxlint는 **중첩 설정(Nested Config)** 기능으로 모노레포를 지원한다. 각 패키지 디렉터리에 `.oxlintrc.json` 파일을 두어 패키지별 설정이 가능하다. oxfmt도 `overrides` 패턴으로 파일별/디렉터리별 설정을 지원한다.

### 3.7 ESLint 마이그레이션 도구

`@oxlint/migrate` 패키지를 통해 기존 ESLint 설정을 자동 변환 가능:

```bash
npx @oxlint/migrate
```

점진적 마이그레이션을 위한 `eslint-plugin-oxlint`도 제공 — ESLint에서 oxlint와 겹치는 규칙을 자동으로 비활성화하여 두 도구를 동시 운영 가능.

### 3.8 oxlint + oxfmt 마이그레이션 결론

| 항목                     | 평가                                             |
| ------------------------ | ------------------------------------------------ |
| TypeScript 규칙          | ✅ 완전 대체 가능                                |
| React/React Hooks 규칙   | ✅ 완전 대체 가능                                |
| Next.js 규칙             | ✅ 완전 대체 가능                                |
| 사용하지 않는 임포트     | ✅ 대체 가능                                     |
| **Tailwind 클래스 정렬** | ✅ **oxfmt 내장 지원**                           |
| Turbo 환경변수 규칙      | ⚠️ 내장 미지원 (JS 플러그인 alpha)               |
| 모노레포 지원            | ✅ 중첩 설정 지원                                |
| 마이그레이션 도구        | ✅ `@oxlint/migrate`, `oxfmt --migrate prettier` |
| 점진적 마이그레이션      | ✅ `eslint-plugin-oxlint`으로 병행 운영 가능     |

---

## 4. 대안 비교표

### 4.1 전체 기능 비교

| 항목                     | 현재 (Prettier + ESLint)         | Biome                | oxlint + oxfmt                             |
| ------------------------ | -------------------------------- | -------------------- | ------------------------------------------ |
| **포매터**               | Prettier                         | Biome 포매터         | oxfmt                                      |
| **린터**                 | ESLint                           | Biome 린터           | oxlint                                     |
| **TypeScript 지원**      | ✅ (typescript-eslint)           | ✅                   | ✅ (type-aware 포함)                       |
| **React 규칙**           | ✅ (plugin)                      | ✅ (내장)            | ✅ (내장)                                  |
| **React Hooks 규칙**     | ✅ (plugin)                      | ✅ (내장)            | ✅ (내장)                                  |
| **Next.js 규칙**         | ✅ (plugin)                      | ✅ (내장, 일부)      | ✅ (내장)                                  |
| **Tailwind 클래스 정렬** | ✅ (prettier-plugin-tailwindcss) | ❌ nursery만         | ✅ (oxfmt 내장)                            |
| **Turbo 환경변수 규칙**  | ✅                               | ❌                   | ⚠️ (alpha)                                 |
| **미사용 Import 제거**   | ✅                               | ✅                   | ✅                                         |
| **CSS 포매팅**           | ✅                               | ✅                   | ✅                                         |
| **모노레포 지원**        | ✅                               | ✅ (v2+)             | ✅                                         |
| **단일 도구**            | ❌ (2개)                         | ✅                   | ❌ (2개)                                   |
| **설정 복잡도**          | 높음                             | 낮음                 | 중간                                       |
| **성능**                 | 기준                             | ~10–15배 빠름        | ~50–100배 빠름 (린터), ~30배 빠름 (포매터) |
| **생태계 성숙도**        | 매우 높음                        | 높음 (v2 stable)     | 중간 (oxfmt pre-1.0)                       |
| **마이그레이션 도구**    | -                                | ✅ (`biome migrate`) | ✅ (`@oxlint/migrate`, `oxfmt --migrate`)  |
| **점진적 마이그레이션**  | -                                | ⚠️ 어려움            | ✅ (`eslint-plugin-oxlint`)                |

### 4.2 현재 프로젝트 특수 의존성 해결

| 의존성                        | Biome                          | oxlint + oxfmt                       |
| ----------------------------- | ------------------------------ | ------------------------------------ |
| `prettier-plugin-tailwindcss` | ❌ **대체 불가** (핵심 장애물) | ✅ oxfmt 내장                        |
| `eslint-plugin-turbo`         | ❌ 미지원                      | ⚠️ JS 플러그인(alpha) 또는 별도 유지 |
| `eslint-plugin-only-warn`     | severity 설정으로 대체         | severity 설정으로 대체               |
| `eslint-config-prettier`      | 불필요 (통합 툴)               | 불필요 (oxfmt 사용 시)               |

---

## 5. 결론 및 권장사항

### 5.1 Biome 마이그레이션 가능성

**결론: 현재 시점에서 완전 마이그레이션 불가**

Biome 자체는 상당히 성숙했고, TypeScript·React·Next.js 규칙 커버리지는 충분하다.  
그러나 **`prettier-plugin-tailwindcss`의 대체재가 없는 것이 결정적 제약**이다.

이 프로젝트는 `cn()`, `cva()`를 Tailwind 정렬 함수로 지정하여 사용한다. Biome의 `useSortedClasses`는 nursery(실험적) 상태이며, Prettier 플러그인처럼 강제적이고 신뢰성 있는 정렬을 제공하지 않는다.

Biome 마이그레이션이 가능해지는 조건:

- `useSortedClasses`가 nursery를 졸업하고 stable로 승격될 때
- `cn()`, `cva()` 커스텀 함수 지원이 추가될 때

### 5.2 oxlint + oxfmt 마이그레이션 가능성

**결론: 기술적으로 가능하나, oxfmt의 성숙도 및 Turbo 규칙이 과제**

oxfmt는 Tailwind 클래스 정렬을 내장 지원하며 Prettier 100% 호환을 달성했다.  
oxlint는 React, Next.js, TypeScript 플러그인을 내장 지원한다.

**미해결 과제:**

1. **`eslint-plugin-turbo` (`turbo/no-undeclared-env-vars`)**: 내장 미지원. Turborepo 환경변수 안전성 체크를 위한 규칙으로, JS 플러그인(alpha) 으로 ESLint 플러그인을 불러오거나, `@t3-oss/env-core` / `@t3-oss/env-nextjs`를 통한 런타임 환경변수 검증으로 대체하는 방식을 검토해야 한다.

2. **oxfmt의 성숙도**: v1.0 이전이나 기능적으로 상용 수준이다. JavaScript/TypeScript 포매팅은 Prettier 호환 테스트 100% 통과. 다만 XML/SVG가 미지원이고 일부 엣지 케이스에서 차이가 있을 수 있다.

### 5.3 최종 권장사항

> **oxlint + oxfmt 조합이 더 낫다** — 단, Turbo 규칙 처리 전략 수립 후 마이그레이션 권장.

**근거:**

| 평가 기준                  | Biome        | oxlint + oxfmt          |
| -------------------------- | ------------ | ----------------------- |
| Tailwind 클래스 정렬       | ❌ 핵심 불가 | ✅                      |
| 전체 규칙 커버리지         | ✅           | ✅                      |
| 성능                       | 빠름         | 더 빠름                 |
| 마이그레이션 난이도        | 중간         | 낮음 (점진적 이행 가능) |
| **현재 마이그레이션 가능** | ❌           | ⚠️ 조건부 가능          |

**Biome**는 단일 도구로 개발 경험이 단순하지만, 이 프로젝트 핵심 의존성(`prettier-plugin-tailwindcss`)을 대체할 수 없어 현재 시점에서 완전 마이그레이션이 불가능하다.

**oxlint + oxfmt**는 두 도구를 함께 사용해야 하는 점이 다소 불편하지만, Tailwind 클래스 정렬을 포함한 모든 기능을 대체할 수 있으며 점진적 이행(`eslint-plugin-oxlint` 활용)도 지원한다. Turbo 규칙 미지원은 환경변수 검증을 `@t3-oss/env-*`의 런타임 검증 또는 커스텀 스크립트로 보완하면 해결 가능하다.

### 5.4 마이그레이션 로드맵 제안 (oxlint + oxfmt)

1. **Phase 1 — 포매터 교체**: `prettier` → `oxfmt`
   - `oxfmt --migrate prettier`로 설정 자동 변환
   - Tailwind 클래스 정렬 설정 (`cn`, `cva` 함수 지정)
   - `format` 스크립트 교체

2. **Phase 2 — 린터 병행 운영**: ESLint + oxlint 동시 운영
   - `eslint-plugin-oxlint`로 ESLint에서 oxlint와 겹치는 규칙 비활성화
   - oxlint에서 react, nextjs, typescript 플러그인 활성화

3. **Phase 3 — ESLint 제거**: oxlint로 완전 전환
   - Turbo 규칙 처리 방안 확정 후 ESLint 완전 제거
   - `packages/config/eslint/` → `packages/config/oxlint/`로 대체

---

_이 보고서는 2026년 3월 29일 기준 각 도구의 공식 문서 및 릴리즈 정보를 토대로 작성되었습니다._
