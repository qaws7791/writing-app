# 4단계 전체 코스 카탈로그 제안

## 상태와 판정 기준

- 상태: 2026-07-27 사용자 승인 완료
- 입력: 최종 역량 24개, 원자적 주장 75개, 역량군·카테고리 후보 5개
- 제안 결과: 코스 14개, 모든 최종 역량을 주역량으로 1회씩 배정
- 제품 반영: `content-seed-data.json` 변경 없음

주역량은 코스의 종료 성과로 직접 관찰하고 평가할 역량이고, 보조 역량은 그 성과를 위해 설명하거나 연습하지만 독립 평가하지 않는 역량이다. 후보는 주역량 1~3개, 독립적인 관찰 성과, 공백이 아닌 관련 근거, 일반 성인에게 유효한 맥락과 현행 스텝으로 표현 가능한 대표 활동을 모두 가져야 한다.

## 병합·분리 판정

| 검토한 경계                        | 판정 | 이유                                                                                                     |
| ---------------------------------- | ---- | -------------------------------------------------------------------------------------------------------- |
| 어휘 의미–문장 의미 구성           | 병합 | 둘 다 문맥과 언어 단서를 통합해 의미를 판별하며 한 코스에서 실패 지점을 구분해 연습할 수 있다.           |
| 읽기 의미 구성–근거 기반 추론      | 분리 | 읽기는 글 전체의 표상과 이해 점검을, 추론은 명시되지 않은 관계의 정당화를 종료 성과로 가진다.            |
| 문법·표기–명료하고 정확한 표현     | 분리 | 전자는 공식 규범의 정오·허용 판단을, 후자는 의미 보존과 독자 이해를 소유한다.                            |
| 비판적 판단–구조적 분석과 통합     | 병합 | 자료를 분해·통합하고 가정·대안·근거를 평가하는 하나의 판단 흐름으로 연습할 수 있다.                      |
| 창의적 사고–주제 설정–내용 생성    | 병합 | 문제 범위를 정하고 후보를 생성·평가·발전시키는 회귀적 발상 흐름이며 주역량도 3개를 넘지 않는다.          |
| 조직–일관성·응집성                 | 병합 | 정보의 거시 배열과 의미·표면 연결을 구분해 가르치되 같은 글의 흐름을 만드는 성과로 통합할 수 있다.       |
| 설명–근거 기반 논증                | 분리 | 설명은 독자의 이해와 검증을, 논증은 주장 정당화와 반론 처리를 소유한다.                                  |
| 독자 인식–목적·장르 판단           | 병합 | 실제 상황에서 독자, 사회적 목적과 장르 관습을 함께 분석해야 글의 선택을 조정할 수 있다.                  |
| 자기점검–수정–피드백 활용          | 병합 | 목표와 현재 글의 차이를 진단하고 조언을 판단해 실제 변화를 선택하는 하나의 개선 흐름으로 구성할 수 있다. |
| 정보 탐색–정보 신뢰성 판단         | 병합 | 정보 필요와 검색 전략을 반복 조정하고 찾은 출처·주장·근거를 외부 자료와 대조하는 연속 수행이다.          |
| 출처 통합·귀속–디지털·AI 매체 문해 | 병합 | 외부·AI 자료를 검증 후 통합하고 사용 범위와 책임을 공개하는 책임 있는 생산 성과로 연결된다.              |

## 제안 카탈로그

추천 순서는 범용성과 진입 용이성, 즉시 활용 가능성을 우선한다. 배열 순서는 선수 관계가 아니며 각 코스는 필요한 개념과 연습 맥락을 자체 제공한다.

| 순서 | 코스 ID                                 | 제목                                | 설명                                                                                                  | 카테고리         | visualKey                |
| ---: | --------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------- | ------------------------ |
|    1 | `course-word-sentence-meaning`          | 어휘와 문장의 의미 정확히 읽기      | 문맥, 문장 구조, 지시와 논리 관계를 함께 살펴 단어와 문장의 가능한 의미를 구별합니다.                 | 언어와 읽기      | `basic-sentence-writing` |
|    2 | `course-reading-structure-main-ideas`   | 글의 핵심과 구조 읽기               | 글의 목적과 구조를 따라 핵심, 세부와 관계를 통합하고 이해가 끊긴 지점을 점검합니다.                   | 언어와 읽기      | `basic-sentence-writing` |
|    3 | `course-clear-accurate-expression`      | 의미를 살려 명료하게 쓰기           | 필수 의미를 보존하면서 어휘, 호응, 지시 대상과 문장 관계를 더 분명하게 다듬습니다.                    | 구성과 표현      | `expression`             |
|    4 | `course-grammar-orthography`            | 한국어 문법과 표기 판단하기         | 현행 규범의 원칙, 허용과 예외를 문맥에 적용해 표기와 문법 판단의 근거를 설명합니다.                   | 언어와 읽기      | `grammar-complete`       |
|    5 | `course-idea-topic-development`         | 생각을 넓혀 쓸거리 만들기           | 목적과 독자, 제약을 바탕으로 쓸 문제의 범위를 정하고 다양한 내용 후보를 만들어 평가하고 발전시킵니다. | 사고와 발상      | `creative-writing`       |
|    6 | `course-organization-coherence`         | 정보를 조직해 글의 흐름 만들기      | 정보를 목적에 맞게 선택하고 배열하며 문장과 문단 사이의 의미 관계를 드러내어 흐름을 구성합니다.       | 구성과 표현      | `essay-writing`          |
|    7 | `course-audience-purpose-genre`         | 독자와 목적에 맞춰 쓰기             | 실제·예상 독자와 사회적 목적을 살펴 장르 관습과 표현 선택을 상황에 맞게 조정합니다.                   | 독자와 쓰기 과정 | `creative-writing`       |
|    8 | `course-reader-centered-explanation`    | 독자가 이해하는 설명 쓰기           | 독자가 개념, 과정과 관계를 재구성할 수 있도록 핵심, 구조, 근거와 예시를 조정합니다.                   | 구성과 표현      | `essay-writing`          |
|    9 | `course-evidence-based-inference`       | 근거를 연결해 추론하기              | 텍스트와 자료의 단서를 연결해 명시되지 않은 결론을 도출하고 근거와 불확실성을 구분합니다.             | 언어와 읽기      | `basic-sentence-writing` |
|   10 | `course-information-search-credibility` | 정보를 찾고 신뢰성을 판단하기       | 정보 필요에 맞춰 검색 전략을 바꾸고 출처, 주장과 근거를 독립 자료와 비교해 신뢰 범위를 판단합니다.    | 정보와 AI 문해   | `essay-writing`          |
|   11 | `course-critical-analysis-integration`  | 자료를 구조화해 비판적으로 판단하기 | 자료의 요소와 관계를 목적에 맞게 분해·통합하고 가정, 대안과 근거의 한계를 점검합니다.                 | 사고와 발상      | `essay-writing`          |
|   12 | `course-evidence-based-argumentation`   | 근거와 반론으로 주장 세우기         | 주장과 근거, 보증, 반론의 관계를 세우고 결론이 성립하는 범위를 설명합니다.                            | 구성과 표현      | `essay-writing`          |
|   13 | `course-revision-feedback`              | 초고를 진단하고 개선하기            | 목표와 기준으로 초고를 진단하고 자기·동료·도구의 피드백을 판단해 의미 있는 수정을 선택합니다.         | 독자와 쓰기 과정 | `expression`             |
|   14 | `course-responsible-source-ai-use`      | 출처와 AI를 책임 있게 활용하기      | 외부·AI 자료의 의미와 한계를 보존해 글에 통합하고 출처, 변형, 사용 범위와 책임을 투명하게 표시합니다. | 정보와 AI 문해   | `expression`             |

## 역량×코스 행렬

대표 활동은 5단계의 상세 레슨 설계가 아니라 현행 10개 스텝으로 핵심 성과를 표현할 수 있는지 확인하는 기술 타당성 기준이다.

| 코스 ID                                 | 주역량                                                                             | 보조 역량                                                                                                                    | 핵심 주장                                                                                                                                                                                                                                                                                      | 대표 현행 활동                                 |
| --------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `course-word-sentence-meaning`          | `cmp-001-vocabulary`, `cmp-002-sentence-comprehension`                             | `cmp-027-reading-meaning-construction`, `cmp-029-clear-accurate-expression`                                                  | `clm-language-norms-sentence-clarity-001`, `clm-language-norms-sentence-clarity-002`, `clm-reading-meaning-construction-002`, `clm-reading-meaning-construction-005`                                                                                                                           | 문맥 대조, 의미 선택, 모호성 해소              |
| `course-reading-structure-main-ideas`   | `cmp-027-reading-meaning-construction`                                             | `cmp-001-vocabulary`, `cmp-002-sentence-comprehension`, `cmp-006-inference`, `cmp-021-self-monitoring`                       | `clm-reading-meaning-construction-001`, `clm-reading-meaning-construction-004`, `clm-reading-meaning-construction-005`, `clm-instruction-practice-transfer-004`                                                                                                                                | 핵심·세부 분류, 구조 순서화, 이해 점검         |
| `course-clear-accurate-expression`      | `cmp-029-clear-accurate-expression`                                                | `cmp-001-vocabulary`, `cmp-002-sentence-comprehension`, `cmp-003-grammar-orthography`, `cmp-019-audience-awareness`          | `clm-language-norms-sentence-clarity-004`, `clm-language-norms-sentence-clarity-005`, `clm-language-norms-sentence-clarity-006`, `clm-organization-coherence-expression-003`                                                                                                                   | 문장 비교, 의미 보존 편집, 선택 근거 설명      |
| `course-grammar-orthography`            | `cmp-003-grammar-orthography`                                                      | `cmp-002-sentence-comprehension`, `cmp-029-clear-accurate-expression`                                                        | `clm-language-norms-sentence-clarity-003`, `clm-language-norms-sentence-clarity-005`, `clm-language-norms-sentence-clarity-007`                                                                                                                                                                | 규범 사례 판정, 표기 교정, 허용형 구분         |
| `course-idea-topic-development`         | `cmp-011-creative-thinking`, `cmp-012-topic-setting`, `cmp-013-content-generation` | `cmp-007-critical-thinking`, `cmp-019-audience-awareness`, `cmp-020-purpose-genre-awareness`, `cmp-024-information-search`   | `clm-creativity-topic-content-generation-001`~`clm-creativity-topic-content-generation-004`, `clm-creativity-topic-content-generation-006`, `clm-audience-purpose-genre-rhetoric-001`                                                                                                          | 문제 범위 설정, 후보 분류, 아이디어 평가·쓰기  |
| `course-organization-coherence`         | `cmp-014-organization`, `cmp-015-coherence-cohesion`                               | `cmp-013-content-generation`, `cmp-027-reading-meaning-construction`, `cmp-029-clear-accurate-expression`                    | `clm-organization-coherence-expression-001`, `clm-organization-coherence-expression-002`, `clm-organization-coherence-expression-005`, `clm-organization-coherence-expression-007`, `clm-writing-process-self-regulation-004`                                                                  | 개요 순서화, 관계 분류, 문단 연결 수정         |
| `course-audience-purpose-genre`         | `cmp-019-audience-awareness`, `cmp-020-purpose-genre-awareness`                    | `cmp-012-topic-setting`, `cmp-017-explanation`, `cmp-029-clear-accurate-expression`                                          | `clm-audience-purpose-genre-rhetoric-001`~`clm-audience-purpose-genre-rhetoric-003`, `clm-audience-purpose-genre-rhetoric-005`, `clm-audience-purpose-genre-rhetoric-007`                                                                                                                      | 독자 조건 비교, 장르 선택, 같은 내용 다시 쓰기 |
| `course-reader-centered-explanation`    | `cmp-017-explanation`                                                              | `cmp-014-organization`, `cmp-019-audience-awareness`, `cmp-020-purpose-genre-awareness`, `cmp-029-clear-accurate-expression` | `clm-organization-coherence-expression-004`, `clm-audience-purpose-genre-rhetoric-004`                                                                                                                                                                                                         | 설명 구조 분석, 예시 선택, 짧은 설명 쓰기      |
| `course-evidence-based-inference`       | `cmp-006-inference`                                                                | `cmp-007-critical-thinking`, `cmp-027-reading-meaning-construction`                                                          | `clm-inference-critical-judgment-001`, `clm-reading-meaning-construction-003`                                                                                                                                                                                                                  | 단서–결론 연결, 추론 선택, 불확실성 다시 쓰기  |
| `course-information-search-credibility` | `cmp-024-information-search`, `cmp-025-source-credibility`                         | `cmp-007-critical-thinking`, `cmp-028-structured-analysis-integration`, `cmp-033-digital-ai-media-literacy`                  | `clm-information-source-media-ai-literacy-001`, `clm-information-source-media-ai-literacy-002`, `clm-information-source-media-ai-literacy-005`, `clm-information-source-media-ai-literacy-007`~`clm-information-source-media-ai-literacy-009`                                                  | 검색 경로 설계, 출처 대조, 신뢰 범위 판단      |
| `course-critical-analysis-integration`  | `cmp-007-critical-thinking`, `cmp-028-structured-analysis-integration`             | `cmp-006-inference`, `cmp-011-creative-thinking`, `cmp-025-source-credibility`                                               | `clm-inference-critical-judgment-002`, `clm-inference-critical-judgment-003`, `clm-inference-critical-judgment-005`~`clm-inference-critical-judgment-007`, `clm-instruction-practice-transfer-005`                                                                                             | 요소·관계 분류, 관점 비교, 판단 수정           |
| `course-evidence-based-argumentation`   | `cmp-030-evidence-based-argumentation`                                             | `cmp-006-inference`, `cmp-007-critical-thinking`, `cmp-025-source-credibility`, `cmp-032-source-integration-attribution`     | `clm-audience-purpose-genre-rhetoric-006`, `clm-inference-critical-judgment-004`                                                                                                                                                                                                               | 논증 요소 매칭, 반론 배치, 제한된 주장 쓰기    |
| `course-revision-feedback`              | `cmp-021-self-monitoring`, `cmp-023-revision`, `cmp-031-feedback-use`              | `cmp-015-coherence-cohesion`, `cmp-029-clear-accurate-expression`, `cmp-033-digital-ai-media-literacy`                       | `clm-writing-process-self-regulation-001`, `clm-writing-process-self-regulation-002`, `clm-writing-process-self-regulation-006`, `clm-feedback-revision-assessment-001`, `clm-feedback-revision-assessment-002`, `clm-feedback-revision-assessment-005`~`clm-feedback-revision-assessment-008` | 초고 진단, 피드백 판정, 수정 전후 비교         |
| `course-responsible-source-ai-use`      | `cmp-032-source-integration-attribution`, `cmp-033-digital-ai-media-literacy`      | `cmp-024-information-search`, `cmp-025-source-credibility`, `cmp-031-feedback-use`                                           | `clm-information-source-media-ai-literacy-003`~`clm-information-source-media-ai-literacy-006`, `clm-information-source-media-ai-literacy-009`, `clm-information-source-media-ai-literacy-010`, `clm-feedback-revision-assessment-007`                                                          | 자료 통합, 사용 표시, 위험·책임 사례 판단      |

## 감사 결과와 근거 한계

- 코스 수는 14개이며 각 코스의 주역량은 1~3개다.
- 최종 역량 24개는 모두 정확히 한 코스의 주역량이고, 배경지식은 독립 역량이나 코스로 만들지 않았다.
- 읽기 의미 구성과 정보 신뢰성 판단, 추론과 비판적 판단과 논증, 문법·표기와 명료한 표현의 평가 대상을 분리했다.
- 코스는 다른 코스 수강을 요구하지 않는다. 보조 역량이 필요한 경우 해당 코스가 필요한 개념과 제한된 연습을 자체 제공한다.
- 특정 직업, 입시, 문학 창작이나 학술 논문을 종료 성과로 삼은 코스는 없다.
- 규범·명료성, 자기조절과 여러 역량의 장기·생활 전이는 근거 공백이다. 코스 설명은 효과나 전이를 보장하지 않으며 5단계에서도 지연·변형 과제를 검증 수단으로만 사용한다.
- 오정보 중재와 AI 피드백 효과는 조건부이거나 상충한다. 특정 팁, 도구나 피드백 주체를 보편적 해결책으로 가르치지 않는다.

## 승인 결과

2026-07-27 첫 번째 사용자 검토에서 다음 세 항목을 모두 승인받았다.

1. 14개 코스의 병합·분리와 24개 주역량 배정
2. 제목, 설명, 카테고리와 추천 순서
3. 기존 5개 `visualKey`의 재사용 배정

4단계는 완료했다. 다음 작업은 첫 번째 코스 `course-word-sentence-meaning`의 근거 묶음을 재확인하고 유닛·레슨·스텝을 순차 구축하는 5단계다.
