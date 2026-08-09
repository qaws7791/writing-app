# 기여 가이드

## 준비

1. [README](README.md)의 전제 조건과 빠른 시작을 완료한다.
2. [문서 인덱스](docs/_index.md)에서 변경 대상의 권위 문서를 찾는다.
3. [사실별 권위 지도](docs/authority-map.md)에서 현재 코드 사실의 소유자를 확인한다.

## 변경

1. [Git 워크플로우](docs/engineering/git-workflow.md)에 따라 작업 브랜치를 만든다.
2. 요청 범위에 필요한 파일만 변경한다.
3. 코드 사실이 바뀌면 같은 변경에서 권위 문서를 갱신한다.

## 검증

코드나 설정을 변경하면 저장소 루트에서 다음 명령을 실행한다.

```bash
bun run verify
```

Markdown만 변경하면 touched 파일의 Oxfmt 검사와 `/docs` 검사를 실행한다. UI 문서, E2E 또는 성능 경계를 변경하면 [테스트 전략](docs/engineering/testing.md)이 지정한 관련 tier를 추가한다.

로컬 환경에서 browser tier를 처음 실행하기 전에 다음 명령으로 저장소 Playwright가 요구하는 engine을 설치한다.

```bash
bunx playwright install chromium webkit
```

## Pull request

[Git 워크플로우](docs/engineering/git-workflow.md)의 PR 본문과 merge 정책을 따른다. 실패한 검증이나 실행하지 못한 외부 검증은 영향과 함께 명시한다.
