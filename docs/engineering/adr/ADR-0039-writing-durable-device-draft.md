# ADR-0039: 작성 세션 본문의 내구 경계는 기기 초안이다

## 상태

채택됨

## 날짜

2026-09-03

## 맥락

작성 세션은 서버 `PUT`과 화면 메모리에만 본문을 두었다. idle debounce, blur, hidden, pagehide는 네트워크 전송을 돕지만 내구 경계가 아니다. 같은 문서의 클라이언트 라우팅 뒤로가기는 `pagehide`가 없고, unmount는 대기 중인 저장을 버린다. 강제 종료는 unload 계열을 생략할 수 있다. 다시 열면 `GET`만 보므로 미전송 타자가 사라진다.

Notion·Google Docs의 블록 트랜잭션과 OT는 실시간 협업 문서용이다. 이 제품의 글은 학습자 1명의 일반 텍스트이고, 점검은 서버가 저장한 본문 전체를 외부 AI에 전달한다.

## 결정

- 작성 세션 본문의 내구 경계는 학습자 ID와 글 ID로 키를 잡은 브라우저 IndexedDB 스냅샷이다.
- 서버는 일반 텍스트 본문 전체와 `expectedVersion`의 `PUT` replica다. 연산 로그, 문단 PATCH, WebSocket, OT, CRDT를 도입하지 않는다.
- 화면, 기기, 서버는 서로 다른 시계를 가진다. 기기 커밋은 서버 ACK를 기다리지 않는다. 서버 전송은 idle debounce, 계속 입력 중 `maxWait`, blur·hidden·freeze·pagehide·라우트 unmount flush를 겹친다.
- 다시 열면 기기 스냅샷과 서버 글을 대조한 뒤에 편집기를 채운다. 같은 `baseVersion`의 dirty 본문은 대화상자 없이 복구하고 서버에 맞춘다. 서버 `version`이 앞서면 기존 충돌 UI를 쓴다.
- 점검하기, 새 글 시작, 글 삭제는 기기 큐에 넣지 않는다.
- 로그아웃, 글 삭제, 학습자 데이터 정리는 해당 기기 초안을 지운다.
- 기기는 정본이 아니다. Safari 축출과 사용자 저장소 삭제 뒤에는 서버 글로 복구한다.

## 고려한 대안

### 대안 1. 서버 `PUT`만 강화한다

- 장점: 브라우저 저장소가 없다.
- 단점: 강제 종료와 SPA 뒤로가기는 네트워크보다 먼저 끝난다.

### 대안 2. Yjs 또는 블록 트랜잭션을 도입한다

- 장점: 협업 편집기와 같은 델타 전송을 쓴다.
- 단점: 협업이 비범위다. 점검과 글자 수는 평문 전체 본문이 필요하다.

### 대안 3. 전체 오프라인 퍼스트로 카탈로그와 점검을 큐에 넣는다

- 장점: 연결 없이 과제를 시작하고 점검할 수 있다.
- 단점: 발행본 고정, 하루 한도, 외부 AI는 서버가 거절권을 가진다.

## 선택 근거

단일 작성자 일반 텍스트는 최신 본문 스냅샷이 가장 작다. 이탈 복구는 기기 커밋이 맡고, 서버는 백업 정본과 점검 입력만 맡는다.

## 결과

- `apps/web` 작성 세션 feature가 기기 store와 autosave 시계를 소유한다.
- HTTP 계약과 writing module schema는 본문 전체 `PUT`을 유지한다.

## 검증

```bash
bun run ci:static
bun run ci:tests
bun run build
```

## 관련 문서

- `docs/product/requirements/platform/req-lrn-11-purpose-writing.md`
- `docs/product/user-stories/platform/us-lrn-12-write-purpose-task.md`
- `docs/product/learner-journey.md`
- `docs/design/screens/SCR-009-learner-writing-studio.md`
- `docs/engineering/frontend-development.md`
- `docs/engineering/privacy.md`
