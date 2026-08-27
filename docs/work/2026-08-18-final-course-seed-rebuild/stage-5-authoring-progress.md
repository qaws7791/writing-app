# 5단계 진행 기록: 코스별 스텝 집필

이 문서는 진행 중인 작업의 재개 지점을 적어 둔 기록이다. 현재 제품 사실의 권위 소스가 아니다. 채워진 스텝 값은 [`content-seed-data.json`](../../../packages/modules/content/src/infrastructure/persistence/content-seed-data.json)이, 스텝 계약은 [스텝 계약](../../../packages/shared/contracts/src/content/steps/index.ts)이 소유한다.

## 현재 상태

코스 1 `course-precise-powerful-sentence`를 마쳤다. 유닛 7개, 레슨 42개, 스텝 829개를 집필해 시드에 병합했고 빈 레슨은 없다.

코스 2부터 코스 10까지 레슨 266개의 `steps`는 빈 배열로 남아 있다. 308개 레슨 전부가 빈 배열이던 상태와 같은 형태이므로 부분 병합이 기존 동작을 바꾸지 않는다.

## 다음 대상

| 코스                                 | 레슨 | 상태      |
| ------------------------------------ | ---- | --------- |
| `course-precise-powerful-sentence`   | 42   | 집필 완료 |
| `course-accurate-word-choice`        | 34   | 집필 대기 |
| `course-orthography-principles`      | 40   | 집필 대기 |
| `course-paragraph-text-design`       | 30   | 집필 대기 |
| `course-logical-connection-cohesion` | 22   | 집필 대기 |
| `course-explanatory-power`           | 28   | 집필 대기 |
| `course-argumentation-craft`         | 32   | 집필 대기 |
| `course-observation-description`     | 24   | 집필 대기 |
| `course-summary-critical-reading`    | 30   | 집필 대기 |
| `course-idea-topic-framing`          | 26   | 집필 대기 |

`TRANSCRIBE`·`PARAGRAPH_ORGANIZE`는 계약하지 않기로 확정했다(`content-model.md`의 제외 스텝 타입). 두 유형을 쓰던 템플릿을 [`stage-2-step-templates.md`](./stage-2-step-templates.md)에서 확정 유형으로 다시 배치했으므로 코스 3·4·9도 계약 대기 없이 집필할 수 있다.

코스 1의 마지막 유닛 `unit-sentence-diagnosis-synthesis`는 앞선 여섯 유닛의 판정을 묶는 종합 유닛이었다. 다른 코스에서도 종합 유닛은 앞 유닛을 모두 마친 뒤 집필한다.

## 작업 방식

레슨 하나를 서브에이전트 하나에 배정한다. 서브에이전트에게 주는 지시는 세 부분이다.

1. 공통 지시서와 스텝 JSON 규칙 두 파일을 먼저 읽게 한다.
2. 레슨 ID, 제목, 유닛, 유닛 통과 기준, 배정 템플릿, 스텝 수, 판별 지점, 형제 레슨 목록을 준다.
3. 검증 명령을 통과할 때까지 고치게 한다.

한 번에 다섯에서 여섯 레슨까지 병렬로 돌렸다. 그보다 늘리면 서브에이전트 실행이 고부하로 실패한다. 실패한 레슨은 같은 지시로 다시 돌리면 된다.

## 작업 파일

작업 파일은 `.artifacts/course-1-steps/`에 있고 `.artifacts`는 gitignore 대상이므로 커밋되지 않았다. 집필한 스텝 값 자체는 시드에 병합해 커밋했으므로 유실되지 않는다. 작업 파일을 잃으면 아래대로 다시 만든다.

| 파일                   | 내용                                                                        |
| ---------------------- | --------------------------------------------------------------------------- |
| `AUTHORING-BRIEF.md`   | 역할, 목표, 코스 맥락, 배치 읽는 방침, 작업 절차, 계약 제약, 보고 형식      |
| `SEED-STEP-JSON.md`    | 유형 11종의 시드 JSON 형태와 제약, 산출물 경로, 검증 명령                   |
| `work-orders.json`     | 레슨 42개의 유닛·통과 기준·템플릿·컨셉·배치·스텝 수·`time`                  |
| `build-work-orders.ts` | 2단계와 3단계 문서와 시드에서 `work-orders.json`을 뽑아낸다                 |
| `validate.ts`          | 스텝 수와 유형 순서가 배정 템플릿과 같은지, 스텝 계약을 통과하는지 확인한다 |
| `merge-into-seed.ts`   | 집필을 마친 레슨을 시드에 병합한다. 파일이 없는 레슨은 건드리지 않는다      |
| `<레슨 ID>.json`       | 레슨별 스텝 배열. 코스 1의 42개 전부가 시드에도 들어 있다                   |

`AUTHORING-BRIEF.md`의 역할과 목표는 [`stage-4-step-authoring-prompt.md`](./stage-4-step-authoring-prompt.md)의 시스템 프롬프트를 그대로 쓴다. `build-work-orders.ts`는 [`stage-2-step-templates.md`](./stage-2-step-templates.md)의 배치 표와 [`stage-3-template-assignment.md`](./stage-3-template-assignment.md)의 코스 1 배정 표를 파싱하고, 산정 규칙으로 `time`을 다시 계산해 시드 값과 어긋나지 않는지 확인한다.

## 검증

레슨 단위 검증은 `bun .artifacts/course-1-steps/validate.ts <레슨 ID>`이고 인자를 비우면 42개를 모두 검사한다. 이 검증은 스텝 수, 유형 순서, `lessonStepDtoSchema` 통과, `fill_blank`의 빈칸 수와 정답 수 일치를 본다. 코스 1의 42개가 전부 통과한다.

병합 뒤 검증은 content 모듈의 seed 테스트가 맡는다. 이 테스트가 `seedContentDatabase`를 호출하므로 시드 정규화 경로를 실제로 지나간다.

코스 1을 병합한 상태에서 `bun run ci:tests`는 54개 파일 245개 테스트와 저장소 테스트 15개가 통과하고, `bun run build`는 6개 작업이 통과한다. `bun run ci:static`은 typecheck 25/25와 lint·knip·dependencies·architecture가 통과한다. `format:check`만 저장소 루트의 추적되지 않은 파일 하나 때문에 실패하며 이번 작업과 무관하다.

## 집필 판단 기록

서브에이전트 보고에서 반복해 확인된 사항이다.

프롬프트의 유형 개수 설명과 `work-orders.json`의 `layout`이 어긋나는 경우가 여러 번 있었다. 공통 지시서가 `layout`을 따르라고 정해 두었고 검증기가 `layout`을 강제하므로 산출물은 모두 배정과 일치한다. 다음 코스에서는 프롬프트에 유형 개수를 적지 않고 `layout`만 가리키는 편이 낫다.

규범 조항을 인용한 스텝은 없다. 코스 1의 판별 지점은 문장 성분과 결합 관계여서 한글 맞춤법·표준어 규정이 조항으로 규정하는 대상이 아니다. 사전 뜻풀이에 기댄 스텝은 `source` 필드에 그 사실을 적었다. 예문은 전부 새로 지었고 전문가 검수를 받지 않았다.

`sentence_build`와 `order`는 순서로 채점하므로 어순이 자유로운 부사어를 타일이나 항목으로 두지 않았다.

## 후속

코스 2부터 같은 방식으로 이어 간다.

`TRANSCRIBE`와 `PARAGRAPH_ORGANIZE`는 계약하지 않기로 확정했다(`content-model.md`의 제외 스텝 타입). 두 유형을 쓰던 템플릿 `A4` `A8` `C6` `G4` `I6`(`Tr`)과 `D2` `D3` `D5` `I5` `I6`(`PO`)은 [`stage-2-step-templates.md`](./stage-2-step-templates.md)에서 같은 판별 지점을 확정 11개 유형으로 다시 확인하도록 배치를 바꿨다. 코스 3·4·9는 계약 대기 없이 이 배치대로 집필한다.

`true_false`·`sentence_build`·`error_correct` 세 유형의 `shared/ui` 응답 컴포넌트는 `explanation` prop을 받지만 렌더링하지 않는다. 다만 이는 결함이 아니다. 해설은 콘텐츠 영역이 아니라 `lesson-shell.tsx`의 `LessonFeedback` 하단 오버레이가 서버 evaluation의 `explanation`을 그대로 표시하며(`docs/design/screens/SCR-006-learner-lesson.md`), SELECT·ORDER·MATCH·CATEGORIZE 같은 기존 확정 유형도 같은 구조다. 세 유형의 시드 `explanation` 값은 학습자에게 정상적으로 전달되므로 `packages/shared/ui` 편집은 필요하지 않다.
