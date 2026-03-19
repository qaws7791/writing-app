---
title: 디자인
description: 플랫폼의 디자인 원칙과 정보 구조를 바탕으로 Phase 1 상세 설계 문서를 관리하는 허브입니다.
status: active
---

## 문서 목적

이 섹션은 기획자와 디자이너가 함께 사용하는 상세 설계 허브다.

여기서는 제품 의도, UX 구조, 화면 명세, 상태 정의까지 다루며 구현 방식, API, 데이터 모델, 프론트엔드 아키텍처 설명은 제외한다.

상세 설계는 [[01-product/user-journeys]]를 설계 관점으로 세분화한 것이며, 상위 기준은 [[02-design/design-principles]], [[02-design/information-architecture]], [[02-design/content-style-guide]]를 따른다.

## 1차 범위

- 범위: Phase 1. 쓰기 시작 만들기
- 포함: 홈에서 시작하기, 글감 탐색, 글감 상세, 새 글 시작, 이어서 쓰기, 에디터 초고 작성, 임시저장 인지 경험
- 제외: 학습 활동 상세 설계, AI 보조 고도화, 공개/운영 기능 상세 설계, 개발 구현 문서

## 문서 계층

- [[02-design/user-flows/README]]: 상위 경험 흐름 단위의 설계 문서
- [[02-design/features/README]]: 사용자 가치 단위의 기능 설계 문서
- [[02-design/screens/README]]: 페이지 단위의 화면 명세 문서

문서 관계는 아래 원칙으로 고정한다.

- 모든 user-flow는 하나 이상의 feature를 참조한다.
- 모든 feature는 하나 이상의 screen과 하나 이상의 user-flow를 참조한다.
- 모든 screen은 상위 feature와 user-flow를 역링크한다.

## 작성 규칙

- 파일명은 `lowercase-kebab-case`를 사용한다.
- 모든 문서는 한국어 `title`, `description`, `status` frontmatter를 가진다.
- 모든 문서는 N2 이하 제목만 사용한다.
- 모바일 우선으로 작성하고, 데스크톱은 차이점만 별도 섹션에 적는다.
- screen 문서는 페이지 기준으로 작성하고 기본 상태와 주요 예외 상태를 함께 다룬다.
- tone, microcopy 예시는 [[content-style-guide]]와 충돌하지 않도록 유지한다.

## 기준 문서

- [[02-design/design-principles]]: 디자인 판단 원칙
- [[02-design/information-architecture]]: 전체 구조와 네비게이션 구조
- [[02-design/content-style-guide]]: 화면 문구와 안내 문체 기준
- [[01-product/user-journeys]]: 제품 관점의 상위 사용자 여정

## 상세 설계 인덱스

- [[02-design/user-flows/README]]
- [[02-design/features/README]]
- [[02-design/screens/README]]
