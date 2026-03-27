---
title: 환경 변수 가이드
description: 이 모노레포에서 환경 변수를 저장, 노출, 검증, 캐시 안전성 측면에서 다루는 기준입니다.
---

## 상태

- 기준 시점: 2026-03-19
- 현재 코드베이스에서 `process.env`, `Bun.env`, `import.meta.env`를 직접 읽는 구현은 없습니다.
- `turbo.json`은 `build` 입력에 `.env*`를 포함하지만, 아직 `env` 또는 `globalEnv` 등록은 없습니다.

## 기본 정책

- 환경 변수는 가능한 한 사용하는 앱 패키지 가까이에 둡니다.
- 비밀 값은 서버 전용으로 두고, 브라우저에 노출되는 값만 `NEXT_PUBLIC_` 접두사를 허용합니다.
- 새 환경 변수를 추가하면 코드, `.env.example`, `turbo.json`, 문서를 같은 변경에서 갱신합니다.
- 런타임 중 환경 변수를 생성하거나 바꾸지 않습니다.

## 앱별 규칙

- `apps/web`: 브라우저에서 접근해야 하는 값만 `NEXT_PUBLIC_*`
- `apps/api`: 서버 전용 비밀 값, 외부 API 키, DB 연결 값
- 공용 패키지: 직접 환경 변수를 읽지 않고, 호출 앱에서 값을 주입받는 것을 기본으로 합니다.

## 파일 규칙

- 로컬 개발: 각 앱 아래 `.env.development.local`
- 공통 예시: 커밋 가능한 `.env.example`
- 실제 비밀 값: 저장소에 커밋하지 않음
- 루트 `.env`는 과도기에는 가능하지만 장기 기준으로는 권장하지 않음

## 구현 규칙

- Bun의 자동 `.env` 로딩을 전제로 하되, CI나 배포에서는 필요한 경우 명시적으로 제어합니다.
- Next.js에서 `NEXT_PUBLIC_*` 값은 빌드 시점에 고정되므로 배포 전략과 함께 관리합니다.
- Turborepo 캐시 안전성을 위해 실제로 동작을 바꾸는 값은 `env` 또는 `globalEnv`에 등록합니다.
- 첫 환경 변수가 생기면 앱 시작 시 스키마 검증을 추가합니다.

## 현재 변수 등록표

| 앱         | 변수                           | 상태   | 설명                                 |
| ---------- | ------------------------------ | ------ | ------------------------------------ |
| `apps/api` | `API_BASE_URL`                 | 사용중 | API 서버 기본 URL                    |
| `apps/api` | `API_AUTH_BASE_URL`            | 사용중 | 인증 서버 기본 URL                   |
| `apps/api` | `API_AUTH_SECRET`              | 사용중 | 인증 비밀 키 (32자 이상)             |
| `apps/api` | `API_DATABASE_PATH`            | 사용중 | SQLite 데이터베이스 파일 경로        |
| `apps/api` | `API_LOG_LEVEL`                | 사용중 | 로그 레벨 (기본: info)               |
| `apps/api` | `API_PORT`                     | 사용중 | API 서버 포트                        |
| `apps/api` | `API_WEB_BASE_URL`             | 사용중 | 프론트엔드 기본 URL                  |
| `apps/api` | `GOOGLE_GENERATIVE_AI_API_KEY` | 사용중 | Google Generative AI API 키          |
| `apps/api` | `RESEND_API_KEY`               | 사용중 | Resend 이메일 API 키 (프로덕션 필수) |
| `apps/api` | `RESEND_FROM_ADDRESS`          | 사용중 | 발신 이메일 주소 (프로덕션 필수)     |
| `apps/web` | 없음                           | 미사용 | 아직 API/분석/인증 환경 변수가 없음  |

## 새 변수 추가 절차

1. 변수의 사용 위치가 `apps/web`인지 `apps/api`인지 먼저 결정합니다.
2. 브라우저 노출 여부를 판단해 `NEXT_PUBLIC_` 접두사 사용 여부를 정합니다.
3. `.env.example`과 문서를 함께 갱신합니다.
4. `turbo.json`의 `env` 또는 `globalEnv`를 함께 갱신합니다.
5. 앱 시작 시 검증 규칙을 추가합니다.

## 관련 문서

- [[README]]
- [[local-development]]
- [[frontend-architecture-guide]]
- [[backend-architecture-guide]]

## 출처

- [Environment Variables - Bun](https://bun.sh/docs/runtime/environment-variables)
- [Guides: Environment Variables | Next.js](https://nextjs.org/docs/app/guides/environment-variables)
- [Using environment variables | Turborepo](https://turborepo.dev/docs/crafting-your-repository/using-environment-variables)
