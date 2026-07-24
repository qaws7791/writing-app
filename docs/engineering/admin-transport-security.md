# 관리자 transport 보안 가이드

이 문서는 HTTP 외의 새로운 transport가 관리자 application use case를 호출할 때 지켜야 하는 인증 경계를 정의한다.

## 단일 관리자 인증 경계

관리자는 한 종류만 존재한다. transport는 별도 관리자 인증 경계의 유효한 session을 확인한 뒤 application use case를 호출한다. identity module은 별도 관리자 profile을 조회하거나 권한 등급을 변경하지 않는다.

## actor 구성

- `AdminActor.id`는 검증이 끝난 session 또는 같은 수준으로 신뢰할 수 있는 서버 인증 주체에서만 만든다.
- 요청 body, query, 임의 header에 담긴 관리자 ID로 actor를 만들지 않는다.
- actor는 감사와 변경 주체 식별용이며 관리자 종류나 권한 단계를 표현하지 않는다.

## transport 구현 절차

1. transport 고유 방식으로 세션의 유효성과 만료를 검증한다.
2. 인증된 관리자 ID로 `AdminActor`를 만든다.
3. 조회와 변경 모두 같은 관리자 session 정책을 적용한다.
4. 변경 command에 actor를 넣어 호출한다.
5. 비인증은 `401/UNAUTHORIZED`, 도메인 상태상 허용할 수 없는 요청은 해당 안정 오류로 변환한다.

## 검증 체크리스트

- 비인증 요청이 application use case에 도달하기 전에 거부되는가?
- actor ID가 요청 입력이 아니라 검증된 관리자 session에서 오는가?
- 별도 관리자 cookie·origin·session 저장소가 학습자 인증과 분리되는가?
- 관리자 session과 응답에 private no-store가 적용되는가?
