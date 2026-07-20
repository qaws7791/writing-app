# 데이터 모델 원칙

## 목적

이 문서는 데이터 의미, 불변식과 변경 원칙을 정의한다. 현재 schema, table, column, index, migration과 seed는 `packages/db`가 소유한다.

## 모델 원칙

- 제품 문서의 콘텐츠 계층과 사용자·학습 상태 의미를 persistence 표현보다 먼저 유지한다.
- 식별자는 다른 도메인과 혼동되지 않도록 타입과 관계에서 의미를 드러낸다.
- 인증 데이터, 콘텐츠 원본, 학습 진행, 운영 설정, 감사 기록은 서로 다른 접근·보존 정책을 적용한다.
- 읽기 projection은 원본 데이터의 권위를 대체하지 않으며, 손상되거나 불완전한 persisted 값은 부분 성공으로 숨기지 않는다.
- 상태 전이는 허용된 이전 상태와 actor를 명시하고, 경쟁 요청에서도 중복 효과가 생기지 않게 한다.

## 변경 원칙

1. 제품 불변식과 사용자 영향부터 정의한다.
2. schema·migration·seed·adapter·contract·테스트를 하나의 호환성 단위로 변경한다.
3. 기존 데이터와 이전 application version이 공존할 수 있는 기간을 판단한다.
4. destructive 변경은 backup, restore와 rollback 한계를 먼저 검토한다.
5. 현재 table과 관계는 schema source에서, 과거 변경 이유는 ADR와 archive에서 확인한다.

## Seed와 보존

- seed는 개발·검증을 재현 가능하게 만들되 사용자의 학습 기록을 암묵적으로 삭제하지 않는다.
- 운영 데이터의 보존·삭제·익명화 정책은 제품·보안 요구와 함께 명시한다.
- 특정 seed 결과나 현재 row 수는 문서에 기록하지 않는다.
