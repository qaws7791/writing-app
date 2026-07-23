# 코드베이스 LOC 통계와 역할 대비 과대 영역 분석 계획

## 목표

[`scc`](https://github.com/boyter/scc) 파일 단위 결과를 단일 원본으로 삼아 저장소, app·package, 재귀 디렉터리와 파일별 LOC를 집계한다. 크기 자체를 결함으로 판정하지 않고, 같은 역할의 경계와 비교했을 때 유지보수 책임이 과도하게 집중된 후보를 찾아 후속 아키텍처 검토의 우선순위를 정한다.

LOC는 비용·품질·응집도를 직접 증명하지 않는다. 수치는 검증된 사실로, 역할 불일치와 분리 필요성은 근거를 붙인 추론으로 구분한다.

## 측정 계약

- 공식 안정 릴리스 `scc v3.7.0`을 고정하고 release checksum을 검증한다. 현재 로컬에는 `scc`가 없으므로 분석 진입점은 버전 불일치와 미설치를 설명 가능한 오류로 중단한다.
- clean checkout의 commit, 실행 시각, OS, `scc` 버전과 전체 명령을 metadata에 기록한다. workspace와 package 이름은 하드코딩하지 않고 루트·workspace `package.json`과 `scripts/workspace-inventory.ts`에서 찾는다.
- 기준 원본은 `scc --by-file --format csv --no-cocomo --gen --min --sort code .` 결과로 한다. 중복 파일, generated·minified 파일을 수집 단계에서 제거하지 않고 분류 단계에서 별도 표시한다.
- `git ls-files`와 대조해 `scc`가 센 추적 텍스트 파일, 인식하지 못한 파일과 binary asset을 구분한다. 따라서 “전체”는 모든 추적 파일의 inventory를 뜻하고, LOC 합계는 `scc`가 인식한 텍스트 파일만 뜻한다.
- 경로는 `/`로 정규화한 뒤 서로 배타적인 `source`, `test/typecheck`, `fixture/test-support`, `story`, `migration/generated`, `docs`, `config/operations`로 분류한다. generated·migration·문서 LOC는 전체 표에는 남기되 유지보수 대상 source 분모에서는 분리한다.

## 집계와 분석

한 번 수집한 파일 행에서 다음 계층을 만든다.

1. `apps/*`, `packages/{modules,infra,shared,config}/*` workspace와 `scripts`, `e2e`, `infra`, `deploy`, `.github`, root configuration 소유 경계를 결정한다.
2. 각 소유 경계 아래 모든 디렉터리 prefix를 재귀 집계하고 파일 행까지 drill-down할 수 있게 한다.
3. files, lines, code, comments, blanks, bytes, complexity와 전체·소유 경계 내 비중을 계산한다. source/test/generated 분리 합계, test-to-source 비율, complexity per 100 CLOC, 가장 큰 파일의 집중도도 함께 낸다.
4. app, module, infra, shared, config와 비-workspace tooling을 서로 다른 비교군으로 둔다. module은 `domain`, `application`, `infrastructure`, `interface` 계층도 같은 역할끼리 비교한다.

후보는 비교군의 CLOC 중앙값 대비 배수, 순위, P90과 MAD 기반 이상치를 함께 보여준다. 표본이 5개 미만이면 통계적 이상치라는 표현을 쓰지 않고 순위와 배수만 제시한다. 자동 후보는 결론이 아니며 다음 맥락을 확인한 뒤 판정한다.

- 큰 비중이 제품 책임의 폭, test·fixture 또는 migration 때문에 정당한가
- shared·config·infra처럼 좁아야 하는 경계에 구현 책임이나 공개 표면이 모였는가
- app 전체가 아니라 특정 feature·layer·파일에 크기와 복잡도가 집중됐는가
- 시스템 책임 문서, manifest export와 import graph가 실제 역할 불일치를 뒷받침하는가

단일 종합 점수는 만들지 않는다. 서로 다른 신호를 한 숫자로 합치면 정밀해 보이는 오판을 만들기 쉽기 때문에, 결과 표는 `검증된 수치`, `역할 근거`, `추론`, `추가 확인`, `권고`를 분리한다.

## 실행 순서

1. `scripts/analyze-loc.ts`에 tool preflight, clean-tree 확인, raw capture와 metadata 기록을 구현하고 root manifest에 수동 실행 script를 연결한다.
2. workspace 발견, 경로 분류, 계층 집계와 percentile·MAD 계산을 작은 순수 함수로 구현하고 Windows·POSIX 경로, test·fixture·migration 우선순위와 합계 보존을 test한다.
3. `output/loc-analysis/<commit>/`에 `metadata.json`, `scc-files.csv`, `owners.csv`, `directories.csv`, `files.csv`를 생성한다. raw `scc` 합계, 모든 child 합계와 repository 합계가 일치하지 않으면 실패한다.
4. 상위 후보를 역할 문서와 import graph에 대조해 `results.md`에 사실과 추론을 분리해 기록한다. 이 단계에서는 리팩터링하거나 LOC budget을 품질 게이트로 만들지 않는다.
5. 재현 명령과 검증 결과를 남기고 완료된 작업 디렉터리를 같은 이름으로 `docs/archive`에 이동한다.

## 완료 기준과 장기 방향

- 모든 workspace와 비-workspace 파일에 소유 경계가 하나만 지정되고, 미분류·미인식 파일이 별도 공개된다.
- file → directory → owner → repository 합계와 source/test/generated 분해 합계가 원본과 일치한다.
- 과대 후보마다 정량 근거, 역할 근거, 정당화 가능성, 유지보수·성능·보안 영향과 최소 범위의 후속 조사가 있다.
- 단기 산출물은 한 시점의 감사 보고서로 유지한다. 최소 세 번의 비교 가능한 baseline이 쌓인 뒤에만 default branch의 증감 추세를 정보성 CI artifact로 승격하며, 절대 LOC 증감만으로 실패시키는 gate는 두지 않는다.
