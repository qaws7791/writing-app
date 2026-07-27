# 근거 연결 인덱스

## 책임

이 디렉터리는 콘텐츠 판단을 `JSON 콘텐츠 ID → 내부 주장 ID → 출처 ID` 순서로 추적할 수 있게 한다. 연결은 검수 근거이며 연구 문서나 콘텐츠의 권위 경계를 바꾸지 않는다.

## 식별자

- 출처 ID는 `sources`에 등록된 `src-0001` 형식을 사용한다.
- 주장 ID는 `clm-주제-001` 형식으로 부여한다. `주제`는 주장을 소유한 synthesis 또는 competency 문서의 kebab-case 주제와 같게 하고, 번호는 그 주제 안에서 중복 없이 증가시킨다.
- 임시 역량 ID는 초기 조사 동안 `cmp-000-주제` 형식을 사용하고 최종 역량 체계 확정 시 대응 관계를 기록한다.
- 콘텐츠 ID는 [`content-seed-data.json`](../../../packages/modules/content/src/infrastructure/persistence/content-seed-data.json)의 ID를 그대로 사용한다. 문구나 배열 위치를 식별자로 사용하지 않는다.
- 한번 인용된 출처·주장 ID는 문구나 파일명 변경 때문에 재사용하거나 바꾸지 않는다. 잘못 등록한 ID는 삭제·재할당하지 않고 폐기 상태와 대체 ID를 기록한다.

## 주장과 출처 연결

주제별 근거 문서는 kebab-case 파일로 만들고 다음 두 표를 둔다. 하나의 주장은 주된 판단 대상과 같은 slug의 문서 하나만 소유하며 다른 주제에서는 주장 ID를 참조한다.

| 주장 등록 필드 | 내용                                                               |
| -------------- | ------------------------------------------------------------------ |
| 주장 ID        | 전역에서 의미가 분명한 `clm-주제-001`                              |
| 주장           | 콘텐츠 설계를 뒷받침할 수 있는 한 문장의 원자적 진술               |
| 유형           | 규범 / 개념·이론 / 수행 절차 / 경험적 관계 / 중재 효과 / 설계 추론 |
| 관련 역량      | 최종 역량 ID                                                       |
| 상태           | 단일 출처 / 교차 확인 / 상충 / 근거 공백                           |
| 강도           | 높음 / 보통 / 낮음 / 공백                                          |
| 한계           | 적용 대상, 조건, 확인 범위와 확실성의 제한                         |

| 근거 연결 필드 | 내용                                                                     |
| -------------- | ------------------------------------------------------------------------ |
| 주장 ID        | 연결할 내부 주장                                                         |
| 출처 ID        | 자료 노트의 출처                                                         |
| 관계           | 지지 / 제한 / 상충                                                       |
| 근거 계열      | 같은 연구진·데이터·원연구 재사용을 독립 근거로 중복 계산하지 않는 식별자 |
| 정확한 위치    | 쪽·장·절·문단·표·타임코드 등                                             |
| 확인 메모      | 출처의 접근 수준 안에서 실제로 확인한 내용                               |

`교차 확인`은 서로 다른 근거 계열 두 개 이상이 같은 원자적 주장을 지지할 때만 사용한다. 같은 데이터의 파동·재분석·후속 보고서나 같은 원연구를 포함한 종합은 관계를 보존하되 독립 계열로 중복 계산하지 않는다. 한 계열만 있으면 `단일 출처`, 대상·조건에 따라 결론이 갈리면 `상충`, 필요한 직접 근거가 없으면 `근거 공백`으로 유지한다. 현행 공식 규범은 단일 권위 자료라도 적용 범위 안에서 `높음`으로 판정할 수 있다.

제한적 근거는 실제로 확인한 초록·첫 면·공식 소개의 범위만 연결한다. 제한적 근거만으로 `교차 확인`이나 강한 중재 효과를 만들지 않으며, 상관·단일집단·횡단·자기보고 결과를 인과로 승격하지 않는다.

## 주제별 근거 문서

| 주제                        | 근거 문서                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------- |
| 언어 규범·문장 명료성       | [`language-norms-sentence-clarity.md`](./language-norms-sentence-clarity.md)           |
| 읽기·의미 구성              | [`reading-meaning-construction.md`](./reading-meaning-construction.md)                 |
| 추론·비판적 판단            | [`inference-critical-judgment.md`](./inference-critical-judgment.md)                   |
| 창의성·주제·내용 생성       | [`creativity-topic-content-generation.md`](./creativity-topic-content-generation.md)   |
| 쓰기 과정·자기조절          | [`writing-process-self-regulation.md`](./writing-process-self-regulation.md)           |
| 조직·일관성·응집성·표현     | [`organization-coherence-expression.md`](./organization-coherence-expression.md)       |
| 독자·목적·장르·수사         | [`audience-purpose-genre-rhetoric.md`](./audience-purpose-genre-rhetoric.md)           |
| 피드백·수정·평가            | [`feedback-revision-assessment.md`](./feedback-revision-assessment.md)                 |
| 정보 탐색·출처·매체·AI 문해 | [`information-source-media-ai-literacy.md`](./information-source-media-ai-literacy.md) |
| 교수·연습·전이              | [`instruction-practice-transfer.md`](./instruction-practice-transfer.md)               |

## 콘텐츠 연결

코스 집필을 시작하면 코스별 근거 문서에 `콘텐츠 ID`, `주장 ID`, `적용 방식`, `근거 한계`를 기록한다. 하나의 콘텐츠가 여러 주장에 의존하면 행을 나누며, 같은 문구나 최종 코스 구조를 복제하지 않는다. 주장 없이 작성자의 선택으로 만든 예시·활동은 외부 근거가 있는 것처럼 연결하지 않고 `자체 설계`로 구분한다.

- [`course-word-sentence-meaning.md`](./course-word-sentence-meaning.md) — 어휘와 문장의 의미 정확히 읽기
