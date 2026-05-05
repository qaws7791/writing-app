# core

글숨 Labs 도메인 로직의 중심입니다. 순수 함수와 immutable 데이터 구조로 구현됩니다.

## 구조

- `shared/`: 모든 모듈이 공유하는 타입, 유틸리티, 포트
  - `brand/`: 공통 식별자 브랜드 타입
  - `error/`: 도메인 오류 타입
  - `pagination/`: 커서 페이지네이션 타입
  - `transaction/`: 트랜잭션 경계 포트
  - `utilities/`: 공통 순수 헬퍼 함수
- `modules/`: 기능별 모듈
  - `auth/`: 인증 응답 스키마
  - `home/`: 첫 문장 루프 홈 스냅샷
  - `users/`: 사용자 프로필 스키마

피벗 삭제 작업 이후 `journeys`, `progress`, `prompts`, `writings`, `ai-feedback` 모듈은 제거되었습니다. 새 제품 도메인은 `scenes`, `materials`, `sentence-seeds`, `sentence-drafts`, `garden` 순서로 추가합니다.
