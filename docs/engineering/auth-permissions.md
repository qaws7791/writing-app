# 인증·권한 정책

## 목적

이 문서는 사용자 역할, 접근 정책과 권한 변경 절차를 정의한다. credential·session handler와 schema는 auth infra, 제품 사용자 상태는 identity module, endpoint 조립과 wire schema는 API source와 contracts가 소유한다.

## 역할과 접근

| 역할          | 허용 목적                              | 금지                                |
| ------------- | -------------------------------------- | ----------------------------------- |
| 비인증 사용자 | 공개 정보 확인과 자기 인증 시작        | 보호된 학습·운영 데이터 접근        |
| 학습자        | 자신의 프로필, 학습 콘텐츠와 진행 관리 | 다른 사용자의 데이터·운영 기능 접근 |
| owner 관리자  | 승인된 관리 작업                       | 자기 권한 우회와 감사 불가능한 변경 |

## 인증 경계 매트릭스

| 경계              | 자격 증명·provider                    | 사용자 생성·연결                                                                                               | 보호 자원 접근                                                                           |
| ----------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 학습자 Google     | Google이 검증한 이메일                | 신규 이메일은 학습자 user를 생성하고, 확인된 동일 이메일의 기존 credential user에는 Google account만 연결한다. | 학습자 cookie와 active identity가 모두 유효할 때만 허용한다.                             |
| 학습자 credential | 확인된 이메일과 비밀번호              | 가입 후 이메일 확인을 완료하며, 비밀번호 재설정은 기존 session을 모두 폐기한다.                                | 확인된 이메일의 학습자 cookie와 active identity가 모두 유효할 때만 허용한다.             |
| owner 관리자      | seed CLI가 만든 별도 credential       | self-signup과 학습자 account 연결을 허용하지 않는다.                                                           | 별도 관리자 cookie가 유효할 때 승인된 관리 기능만 허용한다.                              |
| owner 관리자 MCP  | 승인된 OAuth bearer token과 client ID | OAuth subject는 서버 설정의 기존 owner 관리자 ID에만 연결한다.                                                 | 조회 scope는 고정된 조회 도구를 허용한다. 기능별 변경 scope는 해당 변경 Tool만 허용한다. |

## 정책 원칙

- 학습자 인증과 관리자 인증은 credential, session, cookie와 감사 수명을 분리한다.
- 학습자 Google 로그인은 provider가 확인한 이메일을 사용하고, email/password 로그인은 이메일 확인을 완료한 사용자만 보호 API identity로 인정한다.
- 공개 이메일 가입과 확인 메일 재전송은 계정 존재 여부를 응답 차이로 드러내지 않는다.
- 비밀번호 재설정 요청은 계정 존재와 메일 provider 결과를 응답으로 구분하지 않으며, token은 만료 전 한 번만 소비한다.
- identity는 학습자의 현재 상태를 해석하며 suspended·deleted 학습자는 보호 API에서 거부한다.
- 학습자 상태 전이는 `active → suspended | deleted`, `suspended → active | deleted`만 허용한다. `deleted`는 복원할 수 없는 종단 상태이며 보존 기간 중 관리자 상세 조회만 허용한다.
- 삭제 전이는 같은 application command에서 해당 학습자의 모든 session을 즉시 폐기한다. session row가 남았거나 기존 cookie가 재사용되어도 현재 identity 상태 검증이 보호 API 접근을 거부한다.
- 공개 가입이 차단된 별도 관리자 인증 경계에는 한 종류의 관리자만 존재한다. 유효한 관리자 session을 확인하면 별도 제품 role 조회 없이 관리자 권한을 부여한다.
- 모든 보호 요청은 현재 session을 서버에서 다시 검증한다.
- UI의 메뉴 숨김은 보안 경계가 아니며, command와 query 모두 서버 인가를 거친다.
- 권한이 없는 요청은 존재 여부나 내부 상태를 불필요하게 노출하지 않는 안정된 오류로 거부한다.
- E2E는 별도 auth route를 추가하지 않고 fixture DB에 검증된 credential user를 직접 만든 뒤 실제 로그인 경계를 사용한다.
- 사용자 상태·삭제 같은 관리자 변경은 인증된 관리자 ID를 command actor로 전달하며 optimistic conflict를 성공으로 숨기지 않는다.
- 관리자 MCP는 이메일, 요청 입력의 관리자 ID와 MCP client 자체 식별자를 인증 주체로 사용하지 않는다.
- 관리자 MCP는 issuer, audience, 만료, subject, OAuth client ID와 조회 scope를 application 호출 전에 검증한다.
- 초안, lifecycle, 발행, 사용자 상태와 사용자 삭제 scope는 서로 대체할 수 없다.
- 모든 변경에는 조회 scope와 해당 변경 scope가 필요하다.
- 코스 초안 생성·저장과 코스 보관 해제는 별도 owner 승인 없이 제한적으로 자동 실행한다.
- 코스 발행·보관과 사용자 상태 변경·삭제는 영속 owner 승인을 추가로 요구한다.
- scope와 3단계 영속 승인은 client가 표시하는 확인이나 tool annotation으로 대체할 수 없다.

## 권한 변경 절차

1. 제품 운영 정책과 최소 권한 원칙에 맞는지 확인한다.
2. 관리자 session middleware, command actor와 UI 표현을 함께 검토한다.
3. 비인증, 유효한 관리자 session, session 만료와 credential 변경 후 session 폐기 경로를 테스트한다.
4. 관리자 종류를 늘리거나 권한을 분할해야 한다면 저장 모델·인가 정책·마이그레이션을 별도 설계하고 ADR 필요성을 판단한다.

## 현재 구현 탐색

현재 endpoint, 인증 provider, cookie 속성과 middleware 배치는 [사실별 권위 지도](../authority-map.md)의 API·인증 권위 소스에서 확인한다.
