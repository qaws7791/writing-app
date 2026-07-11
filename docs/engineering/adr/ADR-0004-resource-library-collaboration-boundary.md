# ADR-0004: 자료실 Markdown 원본과 공동 편집 경계

## 상태

부분 대체됨 — 본문 transport 결정은 `ADR-0005 자료실 HTTP transaction 동기화`로 대체됨

## 날짜

2026-07-10

## 맥락

기존 관리자 자료실은 `admin_resource_documents`에 제한된 Tiptap JSON과 검색용 발췌문을 저장하고, Next.js server action과 어드민 API의 CRUD로 문서를 편집한다. 새 자료실은 무제한 폴더 트리, GFM WYSIWYG 편집, 저장 버튼 없는 실시간 공동 편집, 재연결 병합을 요구한다.

본문을 Markdown으로만 저장하면 이식성과 검색은 단순하지만 CRDT의 인과 관계를 서버 재시작 뒤 복구할 수 없다. 반대로 Yjs 상태만 원본으로 삼으면 일반 API 조회, 검색, 내보내기와 향후 다른 소비자가 편집기 구현에 종속된다. 트리까지 CRDT로 만들면 순환 이동 방지, 형제 이름 고유성, 재귀 휴지통 이동 같은 도메인 규칙을 단일 순서로 보장하기 어렵다.

## 결정

- `content_markdown`을 자료 본문의 유일한 도메인 원본으로 둔다.
- Yjs snapshot/update는 본문 병합과 재접속을 위한 복구 가능한 동기화 메타데이터로 별도 저장한다.
- Yjs room이 처음 열릴 때 동기화 상태가 없으면 Markdown에서 초기 상태를 만든다.
- 본문만 Yjs CRDT로 편집한다.
- 제목과 트리 변경은 어드민 API가 검증·직렬화한 명령으로 확정하고 이벤트를 브로드캐스트한다.
- 공동 편집 WebSocket 서버는 별도 관리형 서비스가 아니라 단일 `apps/admin-api` 런타임에 포함한다.
- 활성 문서만 공동 편집 room을 열 수 있고 관리자 세션과 origin을 검증한다.
- 본문 변경은 접속자 사이에 즉시 전파하고, Yjs 상태와 Markdown·검색 색인은 짧은 debounce 뒤 하나의 영속화 경계에서 갱신한다.
- 서버 종료, 마지막 접속 종료, 문서 휴지통 이동 전에는 해당 room을 강제로 flush한다.
- 트리 명령 이벤트는 단조 증가 revision을 포함한다. 클라이언트가 revision 간격을 놓치면 영향받은 부모를 다시 조회한다.
- 실행 취소는 Yjs의 사용자별 local origin을 기준으로 현재 탭에서 만든 변경만 대상으로 한다.
- 현재 단일 서버와 로컬 SQLite 배포를 전제로 문서당 동시 편집자 20명을 지원 목표로 둔다.
- 모든 Lexical 패키지는 정확히 `0.46.0`으로 고정한다. 클라이언트 import·붙여넣기와 headless 저장 투영은 하나의 좁은 패키지가 제공하는 정규 GFM AST mapper를 공유하고, `@lexical/markdown` transformer는 편집 shortcut에만 사용한다.
- 브라우저는 provider가 쓰는 네트워크 Y.Doc과 화면 Lexical에 연결하는 Y.Doc을 직접 공유하지 않는다. 원격 update를 별도 headless Y.Doc과 Lexical에 먼저 적용해 지원 node·계층·속성·NodeState 불변식을 검증하고, 유효한 전체 상태만 화면 Y.Doc으로 미러링한다.
- Markdown 저장 projection은 직렬화 결과를 새 headless editor에 다시 입력한 `EditorState`와 원래 상태의 동등성을 확인한다. GFM으로 손실 없이 표현할 수 없는 상태는 기존 Markdown을 덮어쓰지 않는다.

## 고려한 대안

### 대안 1. Yjs 상태만 원본으로 저장

- 장점: 공동 편집 상태와 저장 원본이 하나다.
- 단점: 검색, API 조회, Markdown 다운로드가 Yjs와 Lexical headless 변환에 항상 의존한다.

### 대안 2. Markdown만 저장하고 Yjs 상태는 메모리에만 유지

- 장점: 데이터 모델이 단순하다.
- 단점: 서버 재시작과 여러 클라이언트 재접속에서 안정적인 병합 기반을 잃는다.

### 대안 3. 제목과 트리도 CRDT로 편집

- 장점: 모든 변경이 같은 동기화 모델을 사용한다.
- 단점: 이름 고유성, 순환 방지, 재귀 상태 전환을 명령 단위로 보장하기 어렵다.

### 대안 4. 관리형 공동 편집 서비스 사용

- 장점: presence, room 운영, 확장 기능을 빠르게 얻을 수 있다.
- 단점: 현재 단일 서버 구조에 외부 비용과 운영 의존성을 추가하고 데이터 저장 경계가 나뉜다.

## 결과

- 일반 조회와 검색은 Markdown을 사용하고 공동 편집 연결이 없어도 동작한다.
- 공동 편집 상태와 Markdown 투영이 어긋날 수 있으므로 state version, projection 실패 격리, 재구축 테스트가 필요하다.
- 원격 update 검증은 화면 reconcile 전에 수행하므로 문서 크기에 따른 검증 지연을 계측해야 한다. 유효하지 않은 원격 상태는 화면과 분리된 Y.Doc에만 남고, 이후 유효한 상태로 회복되면 검증된 전체 상태를 다시 미러링한다.
- WebSocket room registry는 현재 단일 인스턴스에 한정된다. 다중 인스턴스로 확장하기 전에는 pub/sub와 room 소유권 ADR이 추가로 필요하다.
- 공식 Lexical 드래그 블록 플러그인은 실험적이므로 adapter 뒤에 격리하고 E2E 회귀 테스트를 둔다.
- GFM 표, 할 일 목록, 이미지 노드는 정규 GFM AST mapper와 지원 Lexical node의 의미 왕복 fixture를 통과한 범위만 공개한다.
