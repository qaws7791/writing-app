---
title: "UI 패키지 설계 및 구성"
description: "공용 컴포넌트, 스타일, 훅을 포함하는 프레젠테이션 계층의 기술 스택과 설계 원칙을 정의합니다."
---

## 역할

`packages/ui`는 공용 컴포넌트, 스타일, 훅을 제공하는 프레젠테이션 계층입니다.

## 현재 구성

- `src/components`
- `src/hooks`
- `src/lib`
- `src/styles/globals.css`

## 기술 기반

- `@base-ui/react`
- shadcn 기반 구성
- Tailwind CSS 4
- Hugeicons
- Sonner, Vaul, Zod 등 UI 조합 라이브러리

## 원칙

- UI 패키지는 앱의 비즈니스 정책을 직접 알지 않는다.
- 재사용 가능한 조합과 스타일 토큰을 우선한다.
- Storybook과 함께 시각적 기준을 유지한다.
