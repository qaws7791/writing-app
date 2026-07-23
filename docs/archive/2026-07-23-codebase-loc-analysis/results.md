# 코드베이스 LOC 분석 및 판정 결과

## 기준과 전체 결과

기준 commit은 `50304e23f13960e79ece5fcc755993a3a819e792`, 실행 시각은 `2026-07-23T13:34:04.239Z`, 환경은 Windows x64다. 공식 `scc v3.7.0`의 `scc_Windows_x86_64.zip` SHA-256 `97abf9d55d4b79d3310536d576ccbdf5017aeb425780e850336120b6e67622e1`을 검증했고, 실행 binary SHA-256은 `122c379b537ac5c168e12a9d87c218bdea00f53129f21912f3cca283584f6994`다. raw artifact는 `output/loc-analysis/50304e23f13960e79ece5fcc755993a3a819e792/`에 있다.

| 분류                 |  파일 |    CLOC |
| -------------------- | ----: | ------: |
| source               |   722 |  72,405 |
| test/typecheck       |   254 |  34,096 |
| fixture/test-support |    74 |   4,266 |
| story                |    44 |   5,040 |
| migration/generated  |    12 |   3,640 |
| docs                 |   293 |  18,984 |
| config/operations    |   147 |   8,107 |
| 합계                 | 1,546 | 146,538 |

Git 추적 파일 1,577개 중 `scc`가 1,546개를 집계했다. 미집계 31개는 PNG 18개, env example 4개와 ignore·lock·Caddyfile·Ansible config·log 등 9개이며 `inventory.csv`에 모두 남겼다. file, 재귀 directory, owner와 category 합계는 raw 결과와 일치했다.

## 판정

source 파일 분포는 중앙값 51 CLOC, P95 344 CLOC, P99 670 CLOC이며 complexity P99는 약 80이다. 다음 우선순위는 검증된 수치와 역할 문서를 함께 판정한 결과다.

1. `scripts/check-package-interfaces.ts`가 가장 강한 분리 후보다. 1,938 CLOC로 scripts source의 17.8%이며 P99의 2.9배다. P3부터 P13까지 package export, module 소유권, schema, frontend와 runtime safety를 한 파일에서 검증한다. 이는 역할 집중이라는 추론을 직접 뒷받침한다. 단기적으로 기존 root entry와 공통 helper는 유지하고 정책 영역별 validator로만 나누는 것이 안전하다. 장기적으로는 각 규칙의 권위 도구를 바꾸지 않아야 하며 분리 과정에서 같은 정책 parser를 중복시키면 안 된다. `scc` complexity가 이 파일을 0으로 계산했으므로 complexity 수치는 과소 측정으로 보고 LOC와 책임 목록을 근거로 삼았다.
2. learning module은 6,269 source CLOC로 module 6개 중 1위이며 중앙값의 1.90배다. 다만 학습 조회·진행·답안·채점·활동·HTTP·persistence를 소유하는 현재 제품 역할이 넓어 module 자체 분리는 정당화되지 않는다. 실제 집중은 `learning-transition-drizzle-repository.ts`의 1,165 CLOC, complexity 103, module source 18.6%다. 이 파일이 lesson 시작, step 완료, AI feedback, 진행 조회, course 완료와 활동 기록을 함께 다룬다. transaction 원자성과 성능을 보존하면서 workflow별 private implementation을 같은 module 안에서 분리하는 조사가 우선이다.
3. `packages/shared/resource-document`는 2,481 source CLOC 중 `resource-lexical-validation.ts`가 933 CLOC(37.6%), `resource-markdown-ast.ts`가 660 CLOC·complexity 124를 차지한다. 공개 export는 5개이고 consumer는 2개라 package surface보다 내부 구현이 집중됐다. untrusted document 검증의 보안 감사 가능성을 높이기 위해 list·table·text·media validator와 Markdown AST 변환을 내부 파일로 나누는 것이 유효하다. 별도 package 분리는 consumer와 변경 수명이 독립됐다는 증거가 없어 현재는 권고하지 않는다.
4. Web의 `lesson-session` feature는 2,207 source CLOC로 Web source의 34.3%, complexity 316으로 Web source complexity의 55.6%다. 핵심 학습 흐름이라는 역할과 UI·state machine·draft adapter 분리는 타당하지만 `use-lesson-session.ts`는 252 CLOC·complexity 75다. package 분리보다 hook의 orchestration과 effect adapter 경계를 먼저 검토하는 편이 변경 범위와 상태 결합 위험이 작다.

다음 항목은 크지만 현재 증거로 과대 경계라고 판정하지 않는다.

- `packages/shared/ui`는 10,308 source CLOC로 shared 중앙값의 303배지만, 이 비교군에는 20~30 CLOC primitive package와 디자인 시스템이 함께 있어 배수 자체가 왜곡된다. source의 91.5%가 component이고 가장 큰 파일도 6.5%이며 92개 공개 subpath를 Web·Admin·Storybook이 소비한다. 현재 책임과 일치하므로 분리하지 않는다. 독립 consumer·변경 수명이 생기기 전 package 분리는 의존성과 공개 표면만 늘린다.
- auth infra는 864 source, 898 test, 110 migration CLOC로 infra 중앙값의 5.13배다. learner 398, admin 239, schema 143 CLOC로 이미 분리되어 있고 credential·session과 vendor integration이라는 문서화된 역할에 부합한다. 보안 경계를 LOC만으로 쪼개면 interface가 늘어날 수 있으므로 제품 role policy가 유입되는지만 감시한다.
- Admin은 9,236 source CLOC로 app 4개 중 1위지만 feature가 7,109 CLOC를 소유하고 가장 큰 파일 비중은 6.8%라 app shell에 책임이 집중됐다는 증거가 없다. API는 전체 18,112 CLOC로 가장 크지만 source는 6,082 CLOC이고 나머지 대부분이 test 5,833, fixture 3,894, migration 2,132 CLOC다. 전체 LOC만으로 API runtime을 과대하다고 보는 것은 오판이다.

## 결론

후속 작업은 package 재편보다 세 파일 경계에 집중한다. 우선순위는 package interface 검사 분리, learning transition persistence 분리, resource document validator·AST 내부 분리 순서다. 첫 baseline에는 LOC budget이나 CI 실패 조건을 두지 않는다. 동일 분류 규칙으로 최소 세 번 측정한 뒤 증감 추세만 정보성 artifact로 검토한다.
