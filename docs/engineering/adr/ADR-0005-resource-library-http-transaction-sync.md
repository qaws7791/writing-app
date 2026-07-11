# ADR-0005: 자료실 HTTP transaction 동기화

## 상태

채택됨

## 날짜

2026-07-11

## 맥락

ADR-0004는 문서별 Yjs WebSocket room을 열고 짧은 debounce 뒤 서버가 Markdown과 검색 색인을 flush하는 경로를 선택했다. 이 경로는 문서를 전환할 때마다 연결과 초기 동기화를 반복하고, 작업 공간 사건 WebSocket과 별도 인증·재연결·관측 경계를 만든다.

자료실 화면은 작업 공간 수명 동안 유지되는 사건 연결 하나와 문서별 HTTP sync cache를 이미 사용한다. 본문 저장은 멱등 transaction과 SQLite의 원자 저장으로 충분히 표현할 수 있으며, 버전 알림은 본문 binary 대신 HTTP pull의 계기로만 사용한다.

## 결정

- 본문 Yjs update는 `POST /resources/documents/{documentId}/transactions`의 멱등 HTTP transaction으로 저장한다.
- 다른 편집자의 변경은 `/resources/events`의 version 알림을 받은 뒤 `GET /resources/documents/{documentId}/sync`로 증분 update 또는 최신 snapshot을 가져온다.
- 작업 공간 WebSocket은 자료 트리 사건, 문서 구독과 version·무효화 알림만 전달한다. 본문 Yjs binary를 전송하지 않는다.
- 문서별 `WebsocketProvider`, `/resources/collaboration/{documentId}` upgrade, room registry, flush adapter와 이전 collaboration use case를 제거한다.
- 내보내기와 휴지통은 HTTP transaction과 같은 문서 operation coordinator로 순서를 보장한다. 휴지통 결과는 닫힌 room 수를 노출하지 않는다.
- `content_markdown`은 계속 도메인 원본이고 Yjs snapshot·update log·transaction receipt는 동기화 메타데이터다.

## 결과

- 문서 전환은 WebSocket 재연결 없이 구독 전환과 HTTP cache 재사용으로 끝난다.
- 서버 재시작 뒤에도 SQLite snapshot·update log·receipt에서 동기화와 재시도를 복구한다.
- 본문 저장 실패는 동일한 transaction ID와 payload를 재사용해 재시도한다.
- 서버 인스턴스 간 version 알림 전달이 필요해지면 작업 공간 사건 Hub용 pub/sub를 별도 ADR로 결정한다.
