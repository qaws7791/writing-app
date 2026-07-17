# ADR-0013: 코스 썸네일의 build-time 전달

## 상태

채택됨

## 날짜

2026-07-17

## 맥락

`apps/web/public/course-thumbnails`에는 PNG 11개, 총 약 18MiB가 있고 현재 `CourseVisualKey` 계약은 5개 파일만 참조한다. 최근 1년 Git 이력에서 이 디렉터리를 바꾼 commit은 2개다. web image는 해당 public 디렉터리를 포함하지만 admin runtime route는 배포 image에 존재하지 않는 sibling `apps/web/public`을 `process.cwd()` 상대 경로로 읽는다.

썸네일을 독립적으로 편집·배포해야 한다는 제품 요구, CDN traffic 지표 또는 별도 asset 운영 workflow는 확인되지 않았다. 자료실 R2는 사용자 업로드 자산용 경계이며 release에 포함되는 고정 course visual과 변경 주기가 다르다.

## 결정

- 코스 썸네일은 application release에 포함하는 build-time asset으로 전달한다.
- canonical source는 `apps/web/public/course-thumbnails`다. 현재 learner 제품이 전체 asset inventory를 소유하며 admin은 `CourseVisualKey`가 참조하는 5개 파일만 자신의 `public/course-thumbnails`에 byte-identical mirror로 둔다.
- source와 admin mirror의 파일 집합·해시를 repository 검사로 비교한다. 수동 복사 뒤 검사를 통과하지 않은 변경은 배포하지 않는다.
- admin은 `/course-thumbnails/<visual-key>.png` 정적 경로를 직접 사용하고 sibling filesystem을 읽는 route와 runtime cache를 제거한다.
- 썸네일 filename은 불변이다. 이미 배포된 파일 내용을 교체하지 않고 시각 변경은 새 `CourseVisualKey`와 새 filename을 추가한다. 기존 데이터가 참조하는 파일은 유지한다.
- 두 app은 course thumbnail 경로에 1년 `public, immutable` cache를 적용한다. 새 visual은 새 URL이므로 cache busting이 명시적이다.
- local development, standalone image와 rollback은 같은 checked-in public asset을 사용한다. 외부 network fallback은 두지 않는다.

## 고려한 대안

### 대안 1. Object storage/CDN

- 장점: 단일 원본, app image 용량 감소, 독립 asset 배포와 edge cache를 제공한다.
- 단점: 현재 18MiB·5개 runtime asset과 낮은 변경 빈도에 비해 bucket 권한, upload, CSP/remote host, 장애 처리와 local fallback을 추가한다. 독립 변경 요구가 확인되지 않았다.

### 대안 2. admin runtime이 web filesystem을 읽음

- 장점: source 중복이 없다.
- 단점: standalone image가 sibling checkout layout에 의존하며 현재 Docker image에서 파일 존재를 보장하지 못한다. app 장애와 배포 경계를 숨긴다.

### 대안 3. repository 공용 asset root와 build 생성

- 장점: source 파일을 물리적으로 한 곳에 둔다.
- 단점: 두 Next.js dev/build 전에 동기화 생성 단계를 강제하고 public 산출물의 추적·정리 규칙을 추가한다. 현재 작은 asset 집합에는 checked-in mirror와 hash 검사가 더 단순하다.

## 결과

- admin source와 runtime은 web directory layout에서 독립되고 정적 전달로 route I/O와 Node.js runtime 비용이 사라진다.
- Git과 admin image에 약 8.5MiB가 중복된다. 외부 storage 운영 비용 없이 결정적 build와 offline local 개발을 얻는 의도적인 trade-off다.
- 파일 내용 교체 대신 새 key를 요구하므로 시각 변경에 contract 변경이 필요하다. 장기 cache의 결정성을 우선한다.
- 참조 asset 수나 변경 빈도가 크게 늘거나 app release와 독립된 편집 요구가 생기면 object storage/CDN을 후속 ADR로 재평가한다.

## 검증과 롤백

- 5개 `CourseVisualKey`가 web canonical source와 admin mirror에 모두 존재하고 해시가 같은지 검사한다.
- admin source, standalone image와 실제 HTTP 정적 경로에서 5개 asset을 확인한다.
- 임의 filename과 path traversal은 public inventory 밖의 파일에 도달하지 않아야 한다.
- 배포 실패 시 이전 admin image로 rollback하면 코드와 asset이 함께 복원된다. 외부 상태나 DB rollback은 없다.

## 구현 상태

MTA-14에서 5개 mirror, SHA-256 검사, 정적 cache, sibling runtime route 제거, Admin standalone `public` 복사와 image smoke 계약을 구현했다. 로컬 standalone server에서는 5개 URL의 `200`·`image/png`·1년 immutable cache와 미허용·traversal `404`를 확인했다. 현재 실행 환경에는 Docker CLI가 없어 실제 `linux/amd64` image build·HTTP smoke 결과는 아직 확인하지 못했으며 해당 검증이 통과할 때까지 MTA-14는 진행 중이다.
