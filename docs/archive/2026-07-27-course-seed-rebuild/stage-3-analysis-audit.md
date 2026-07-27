# 3단계 자료 분석·역량 체계 감사

## 기준과 범위

- 기준 커밋: `1baa864e`
- 분석일: `2026-07-27`
- 활성 출처: 168건(`직접 근거` 164건, `제한적 근거` 4건)
- 3단계 신규 출처: 0건
- 다음 신규 출처 ID: `src-0175`
- 제품 코드·코스 설계·`content-seed-data.json` 변경: 없음

2단계의 168건과 1,992개 추출 행은 역사적 수집 기준으로 보존했다. 3단계에서는 이를 10개 주제로 라우팅해 75개 원자적 주장과 200개 근거 행으로 종합했다. 최종 재검색에서 현재 주장·관계·역량 판정을 바꿀 독립 근거를 확인하지 못했으므로 새 출처를 추가하지 않았다.

## 주장 통계

| 구분 | 값          |  수 |
| ---- | ----------- | --: |
| 유형 | 개념·이론   |  25 |
|      | 수행 절차   |  18 |
|      | 설계 추론   |  12 |
|      | 중재 효과   |  11 |
|      | 경험적 관계 |   6 |
|      | 규범        |   3 |
| 상태 | 교차 확인   |  52 |
|      | 단일 출처   |  19 |
|      | 상충        |   1 |
|      | 근거 공백   |   3 |
| 강도 | 높음        |  29 |
|      | 보통        |  39 |
|      | 낮음        |   4 |
|      | 공백        |   3 |
| 관계 | 지지        | 185 |
|      | 제한        |  14 |
|      | 상충        |   1 |

근거 행은 144개 근거 계열로 구분했다. 같은 연구진·자료·조사 주기의 재사용은 독립 계열로 중복 계산하지 않았다.

| 소유 주제                   | 주장 수 |
| --------------------------- | ------: |
| 언어 규범·문장 명료성       |       7 |
| 읽기·의미 구성              |       7 |
| 추론·비판적 판단            |       8 |
| 창의성·주제·내용 생성       |       7 |
| 쓰기 과정·자기조절          |       7 |
| 조직·일관성·응집성·표현     |       7 |
| 독자·목적·장르·수사         |       7 |
| 피드백·수정·평가            |       8 |
| 정보 탐색·출처·매체·AI 문해 |      10 |
| 교수·연습·전이              |       7 |

## 고위험 재대조

- 현행 규범: 국립국어원 한국어 어문 규범 서비스와 국가법령정보센터에서 `한글 맞춤법`이 문화체육관광부 고시 제2017-12호, 2017년 3월 28일 시행 상태임을 다시 확인했다. 공식 264쪽 해설의 제1항과 [`src-0001`](../../research/sources/src-0001-hangeul-orthography-explanation.md)의 위치·적용 한계가 일치했다.
- 수치·효과: 40년간 미디어 문해 중재 160편을 종합한 [`src-0159`](../../research/sources/src-0159-media-literacy-interventions-meta-analysis.md)의 결과별 효과, 넓은 신빙구간과 이질성을 원문 표·논의와 다시 대조했다. 평균 효과를 특정 성인 코스의 강한 인과 효과로 사용하지 않았다.
- 상충 주장: [`src-0161`](../../research/sources/src-0161-psychological-inoculation-misinformation.md)의 단기 무작위 실험 결과와 [`src-0172`](../../research/sources/src-0172-bad-news-game-replication.md)의 판별 향상 비재현·반응 편향 결과를 다시 대조했다. 따라서 `clm-information-source-media-ai-literacy-008`은 `상충·보통`으로 유지했다.
- 제한적 근거: `src-0005`, `src-0011`, `src-0030`, [`src-0034`](../../research/sources/src-0034-research-on-revision.md)는 확인 가능한 초록·공개 범위에만 `제한` 관계로 연결했다. 본문 정의·수치·효과의 직접 근거로 승격하지 않았다.
- 역량 독립성: 피드백의 생성·해석·처리 결정과 실제 수정 결과를 구별한 복수 계열, 외부·AI 자료의 통합·귀속과 탐색·신뢰성 판단을 구별한 복수 계열을 재확인했다. 이는 `cmp-031-feedback-use`, `cmp-032-source-integration-attribution` 추가의 직접 근거이며 장기 효과를 뜻하지 않는다.

위 항목 중 원문·공식 서비스에서 확인한 서지·수치·상태는 확인 사실이다. 한국어 모어 일반 성인 교육으로의 적용과 역량 경계는 근거의 적용 범위를 바탕으로 한 설계 판단이며, 직접 효과가 없는 부분은 추론 또는 공백으로 표시했다.

## 역량 판정

- 최종 역량: 24개
- 유지: 초기 ID 17개
- 병합: 초기 5개를 새 역량 2개로 통합
- 대체: 초기 3개를 관찰 가능한 경계로 재정의
- 제외/조건화: `cmp-022-background-knowledge` 1개
- 추가: `cmp-031-feedback-use`, `cmp-032-source-integration-attribution` 2개
- 분리: 0개

최종 의미 경계는 [`final-competency-framework.md`](../../research/competencies/final-competency-framework.md), 초기 26개별 판정은 [`competency-analysis.md`](../../research/competencies/competency-analysis.md), ID 보존 관계는 [`initial-to-final-map.md`](../../research/competencies/initial-to-final-map.md)가 소유한다. 역량군은 [`competency-groups-category-candidates.md`](../../research/competencies/competency-groups-category-candidates.md)에 4단계 입력 후보로만 기록했다.

## 남은 근거 공백

- `clm-language-norms-sentence-clarity-007`: 한국어 모어 일반 성인의 규범·명료성 편집 훈련이 새 실제 문서로 전이되는 정도
- `clm-writing-process-self-regulation-007`: 다양한 쓰기에서 자기조절 훈련이 장기·생활 전이되는 정도
- `clm-instruction-practice-transfer-007`: 여러 역량에서 한국어 모어 일반 성인의 장기 유지와 생활 전이

이 공백은 효과를 추정해 채우지 않는다. 이후 코스 설계에서는 효과 약속을 피하고 지연·변형 과제와 실제 사용 자료를 통한 검증 필요성으로 다룬다.

## 전수 감사 결과

| 항목                          | 결과                                                  |
| ----------------------------- | ----------------------------------------------------- |
| 활성 출처 연결                | 168/168건, 미연결 0건                                 |
| 출처 노트 역방향 연결         | 168/168건 일치                                        |
| 주장 ID                       | 75건, 중복·소유 주제 불일치 0건                       |
| 근거 행                       | 200건, 고아 주장·잘못된 출처·빈 위치·빈 계열 0건      |
| 교차 확인 독립 계열           | 52/52건이 서로 다른 계열 2개 이상                     |
| 허용 유형·상태·강도·관계      | 목록 밖 값 0건                                        |
| 초기 역량 대응                | 26/26건                                               |
| 최종 역량 필수 필드·주장 연결 | 24/24건                                               |
| 폐기·대체 ID 재사용           | 0건                                                   |
| 연구·작업 문서 로컬 링크      | 272개 중 끊어진 링크 0건                              |
| 미완료 표기                   | 출처 노트의 3단계 예정 표기 0건                       |
| 범위 밖 변경                  | 코스 설계·제품 코드·`content-seed-data.json` 변경 0건 |

## 저장소 검증

- `bunx oxfmt docs/research docs/work/2026-07-27-course-seed-rebuild docs/work/_index.md`: 통과
- 같은 범위의 `bunx oxfmt --check`: 통과
- `git diff --check`: 통과
- `bun lefthook run pre-commit`: 정상 종료. stage된 파일이 없어 format·lint 훅 대상은 없었다.
- `bun run lint`: 통과
- `bun run typecheck`: 24/24 작업 성공
- `bun run test`: 20/20 작업 성공
- `CONTENT_ASSET_PUBLIC_BASE_URL`과 `CONTENT_ASSET_IMAGE_ALLOWED_ORIGINS`을 설정한 `bun run build`: 6/6 작업 성공

빌드에는 Storybook 의존성의 `use client` 무시와 500 kB 초과 청크 경고가 있었으나 실패는 없었다. 이는 기존 의존성 번들 경고이며 이번 문서 변경에서 제품 코드 결함이 생겼다는 근거는 아니다.
