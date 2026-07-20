# 관리자 식별자 타입 계약

## 목적

관리자, 학습자 계정과 관리자 대화처럼 서로 다른 도메인의 식별자를 type level에서 구분한다. 현재 parser, 브랜드 타입과 wire schema는 contracts source가 소유한다.

## 원칙

- 외부 문자열은 HTTP·UI 입력 경계에서 검증한 뒤 의미 있는 식별자 타입으로 변환한다.
- domain과 application 경계는 raw string이 아닌 식별자 타입을 사용한다.
- HTTP와 persistence의 wire 표현을 바꾸지 않는 type 강화는 consumer 호환성을 깨지 않아야 한다.
- 화면은 feature 또는 entity model을 통해 식별자를 소비하고, 내부 wire schema를 넓게 재수출하지 않는다.

## 검증

유효·무효 입력, 도메인 간 식별자 교차 전달, route·repository 경계의 검증은 contracts와 consumer test가 소유한다. 현재 형식·길이 제한과 test file은 해당 source에서 확인한다.
