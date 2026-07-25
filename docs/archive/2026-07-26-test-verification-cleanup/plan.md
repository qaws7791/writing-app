# 테스트·검증 코드 정돈

## 목표

외부 제안서의 8개 우선순위에 따라 선언 설정을 다시 해석하는 테스트, 검증 도구의 자체 테스트, 중복 실행기와 정적 UI 테스트를 정리한다. 보안·데이터 무결성·도메인 정책·실제 사용자 흐름 검증은 유지한다.

## 범위

1. CI workflow 구조 테스트 제거
2. 배포 image·metadata·취약점 검증 단순화
3. 로컬 setup·doctor 선형화
4. architecture fixture 제거
5. Playwright·Lighthouse 실행기 단순화
6. 앱의 정적 markup·중복 framework 테스트 제거
7. 공통 Vitest 설정 통합
8. E2E 시나리오 분리와 공통 실행 계약 통합

## 완료 조건

- 유지 대상으로 지정된 보안·도메인·release 무결성 검증이 남는다.
- 공개 검증 명령, CI와 문서가 제거된 파일을 참조하지 않는다.
- format, lint, architecture, dependency, typecheck, repository·workspace test, build와 핵심 Playwright smoke가 통과한다.
- 영구 원칙은 `docs/engineering/testing.md`에 반영하고 이 작업 단위를 archive로 이동한다.
