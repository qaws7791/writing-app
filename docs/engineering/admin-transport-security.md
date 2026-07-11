# 관리자 transport 보안 가이드

이 문서는 HTTP 외의 새로운 transport가 관리자 application use case를 호출할 때 지켜야 하는 인증·인가 경계를 정의한다.

## 이중 인가 경계

owner 변경은 두 경계에서 검증한다.

1. transport는 인증된 관리자 세션을 확인하고 owner가 아니면 빠르게 거부한다.
2. application use case는 command의 `AdminActor`를 다시 확인하고 owner가 아니면 repository 호출 전에 `{ kind: "forbidden" }`을 반환한다.

transport 검사는 불필요한 요청 처리를 줄이는 장치이고 application 검사는 우회 호출을 막는 최종 정책이다. 어느 한쪽도 다른 쪽을 대체하지 않는다.

## actor 구성

- `AdminActor.id`와 `AdminActor.role`은 검증이 끝난 세션 또는 같은 수준으로 신뢰할 수 있는 서버 인증 주체에서만 만든다.
- 요청 body, query, header에 담긴 관리자 ID나 role로 actor를 만들지 않는다.
- owner 변경 command는 actor가 필수이므로 actor 없는 command를 type assertion으로 우회하지 않는다.
- actor는 repository 입력에 전달하지 않는다. application use case가 인가 후 영속성 입력과 분리한다.

## transport 구현 절차

1. transport 고유 방식으로 세션의 유효성과 만료를 검증한다.
2. 인증된 관리자 ID와 role로 `AdminActor`를 만든다.
3. 조회는 기존 관리자 세션 정책을 적용하고 owner 변경은 transport 경계에서도 owner 여부를 확인한다.
4. application command에 actor를 넣어 호출한다.
5. `forbidden`은 `403/FORBIDDEN`, `not-found`는 `404/NOT_FOUND`, `ok`는 성공 응답으로 변환한다.
6. 권한 부족 응답에 내부 정책 구조나 대상 존재 여부를 추가로 노출하지 않는다.

## 검증 체크리스트

- operator가 transport를 거치지 않고 use case를 직접 호출해도 변경이 거부되는가?
- owner의 기존 변경 결과와 부수 효과가 유지되는가?
- actor 없는 고권한 command가 TypeScript에서 구성되지 않는가?
- transport의 빠른 거부와 application의 거부가 같은 외부 오류 의미를 사용하는가?
- 인가 실패 시 repository가 호출되지 않는가?
