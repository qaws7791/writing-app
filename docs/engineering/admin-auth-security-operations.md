# 관리자 인증 보안 운영

이 문서는 관리자 계정 생성, 감사와 세션 폐기의 운영 기준을 정의한다. 현재 seed 입력, audit 도구와 인증 endpoint는 환경 parser·automation·API source가 소유한다.

## 관리자 생성 정책

- 공개 관리자 가입을 제공하지 않는다.
- 관리자는 승인된 운영 절차로만 생성한다.
- 생성 입력은 강한 credential, 명시적인 대상 데이터 저장소 확인과 production 승인을 요구한다.
- credential은 secret 관리 경계로 전달하고 명령 인자, 로그, artifact에 원문을 남기지 않는다.
- 계정과 credential 저장은 원자적으로 처리하고 일부 실패 시 남은 계정을 만들지 않는다.
- 최초 전달 credential은 별도의 안전한 절차로 교체한다.

## 감사와 세션 폐기

1. 감사는 운영 데이터의 변경 없이 승인된 관리자를 확인한다.
2. 감사 출력은 password, session token, secret과 불필요한 개인 정보를 포함하지 않는다.
3. credential 변경, 계정 정지·삭제가 확인되면 영향을 받는 session을 폐기할지 명시적으로 결정한다.
4. session 폐기는 audit 결과를 검토한 승인된 관리자가 별도 승인으로 실행한다.
5. 실행 결과는 기준 commit, 운영 환경, 명령, 영향 범위와 결과를 고정한 archive 보고서로 남긴다.

## 변경 검토

관리자 생성 방식, credential 수명, session 폐기 규칙, audit 범위 또는 관리자 권한 모델을 바꾸면 인증·권한 정책, 보안, deployment·rollback 절차와 함께 검토한다.
