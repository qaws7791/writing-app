# 어드민 코스 썸네일 업로드 설계

## 목적

어드민 코스 상세 페이지의 `썸네일 변경` 버튼을 실제 동작으로 연결한다. 관리자는 로컬 개발 환경에서 RustFS 기반 S3-compatible API를 사용해 코스 썸네일 파일을 업로드하고, 업로드 성공 후 기존 코스 편집 저장 흐름으로 DB의 `thumbnailPath`를 반영한다.

핵심 목표는 파일 바이트를 어드민 API 서버가 직접 중계하지 않고 signed URL로 브라우저가 RustFS에 즉시 업로드하게 만드는 것이다. 코스 편집 문서의 저장 모델은 유지한다.

## 범위

### 포함

- 어드민 API의 코스 썸네일 업로드 signed URL 발급 API.
- RustFS S3-compatible 클라이언트 구성.
- 업로드 요청 DTO와 응답 DTO.
- 파일명, MIME 타입, 파일 크기 검증.
- 어드민 웹의 파일 선택 UI, 업로드 진행 상태, 오류 메시지, 업로드 후 미리보기 갱신.
- 업로드 성공 후 `thumbnailPath`를 dirty 상태로 반영하고 기존 `저장` 버튼으로 DB 저장.
- 로컬 RustFS 환경 변수와 운영 문서 갱신.
- 관련 단위 테스트와 API/UI 테스트.

### 제외

- 저장하지 않고 나간 미참조 객체 자동 정리.
- 이미지 리사이징, 최적화, 바이러스 검사.
- 비공개 버킷과 프록시 다운로드 경로.
- 학습자 앱 UI 변경.
- `/prototype` 디렉터리 수정.

## 사용자 흐름

1. 관리자가 draft 코스 상세 페이지에서 `썸네일 변경`을 누른다.
2. 브라우저 파일 선택창에서 이미지를 고른다.
3. 어드민 웹은 파일 메타데이터를 어드민 API에 보낸다.
4. 어드민 API는 RustFS에 업로드할 object key와 signed PUT URL을 만든다.
5. 브라우저는 signed URL로 파일을 즉시 업로드한다.
6. 업로드 성공 시 코스 편집 working copy의 `thumbnailPath`가 새 공개 경로로 바뀐다.
7. 화면 미리보기가 즉시 갱신되고 코스 편집 문서는 dirty 상태가 된다.
8. 관리자가 기존 `저장` 버튼을 누르면 새 `thumbnailPath`가 DB에 저장된다.

업로드가 실패하면 `thumbnailPath`는 바꾸지 않는다. 사용자는 한국어 오류 메시지를 보고 다시 파일을 선택할 수 있다.

## API 설계

새 route는 코스 편집 문서 저장 API와 분리한다.

```text
POST /course-thumbnails/uploads
```

요청 본문은 다음 형태다.

```ts
type AdminCreateCourseThumbnailUploadRequestDto = {
  fileName: string
  contentType: "image/png" | "image/jpeg" | "image/webp"
  contentLength: number
}
```

응답 본문은 다음 형태다.

```ts
type AdminCreateCourseThumbnailUploadDto = {
  uploadUrl: string
  method: "PUT"
  headers: {
    "content-type": string
  }
  thumbnailPath: string
}
```

검증 규칙은 다음과 같다.

- `fileName`은 비어 있으면 안 된다.
- `contentType`은 `image/png`, `image/jpeg`, `image/webp`만 허용한다.
- `contentLength`는 1바이트 이상 5MB 이하만 허용한다.
- object key는 서버가 생성하며 사용자가 보낸 파일명을 그대로 신뢰하지 않는다.

## 스토리지 설계

로컬 개발 환경은 기존 `docker-compose.yml`의 RustFS와 `writing-app-public-assets` 버킷을 사용한다.

object key는 충돌과 경로 조작을 피하기 위해 서버가 생성한다.

```text
course-thumbnails/{uuid}.{ext}
```

공개 경로는 RustFS 공개 bucket download 정책을 전제로 다음 중 하나로 계산한다.

```text
{ADMIN_ASSET_PUBLIC_BASE_URL}/course-thumbnails/{uuid}.{ext}
```

로컬 예시는 다음과 같다.

```text
ADMIN_ASSET_PUBLIC_BASE_URL=http://localhost:9000/writing-app-public-assets
```

어드민 API는 signed URL 발급에 서버 전용 환경 변수를 사용한다.

```text
ADMIN_ASSET_S3_ENDPOINT=http://localhost:9000
ADMIN_ASSET_S3_REGION=us-east-1
ADMIN_ASSET_S3_BUCKET=writing-app-public-assets
ADMIN_ASSET_PUBLIC_BASE_URL=http://localhost:9000/writing-app-public-assets
ADMIN_ASSET_S3_ACCESS_KEY=local-access-key
ADMIN_ASSET_S3_SECRET_KEY=local-secret-key
```

RustFS는 S3-compatible API를 제공하므로 AWS S3 SDK의 path-style endpoint 설정을 사용한다.

## 어드민 웹 동작

`CourseSummaryPanel`은 숨겨진 file input을 가진다. `썸네일 변경` 버튼은 읽기 전용 published 버전에서는 비활성화된다.

파일 선택 후에는 다음 상태를 표시한다.

- 업로드 중: 버튼을 비활성화하고 `업로드 중...`을 표시한다.
- 성공: 미리보기를 새 `thumbnailPath`로 갱신하고 dirty 상태를 만든다.
- 실패: 코스 저장 상태를 변경하지 않고 오류 메시지를 표시한다.

업로드 성공은 DB 저장을 의미하지 않는다. 화면에는 기존 dirty 상태와 저장 버튼이 그대로 남아야 한다.

## 기존 저장 모델과의 관계

코스 편집 저장 API는 변경하지 않는다. `createCourseEditorSaveInput`은 이미 `course.thumbnailPath`를 포함하므로, 업로드 성공 후 working copy에 새 값을 넣으면 기존 저장 경로가 그대로 동작한다.

저장하지 않고 페이지를 떠나면 RustFS에는 DB에서 참조하지 않는 객체가 남을 수 있다. 이번 작업에서는 자동 정리를 구현하지 않고 문서에 운영상 잔여 객체 가능성을 명시한다.

## 오류 처리

어드민 API는 검증 실패를 `400 invalid-request`로 반환한다. 스토리지 설정 누락 또는 signed URL 생성 실패는 데이터베이스 오류가 아니므로 `503 storage-unavailable`로 반환한다. 이를 위해 기존 admin error union에 `storage-unavailable` 오류 DTO를 추가한다.

어드민 웹은 다음 메시지를 한국어로 표시한다.

- 허용하지 않는 파일 형식입니다.
- 파일은 5MB 이하만 업로드할 수 있습니다.
- 썸네일 업로드 URL을 만들지 못했습니다.
- 썸네일 업로드에 실패했습니다.

## 테스트 전략

- core DTO 테스트: 허용 MIME, 크기 제한, 응답 DTO 파싱.
- admin-api 테스트: signed URL 발급 route가 인증을 요구하고, 잘못된 body를 거부하고, 정상 요청에 `uploadUrl`과 `thumbnailPath`를 반환한다.
- storage 클라이언트 테스트: object key 생성이 확장자와 UUID 기반 경로를 만든다.
- admin UI 테스트: 파일 선택 시 signed URL 발급과 PUT 업로드가 실행되고, 성공 후 `thumbnailPath`가 저장 payload에 포함된다.
- 실패 테스트: signed URL 발급 실패 또는 PUT 실패 시 미리보기와 dirty 상태를 변경하지 않는다.

## 문서화

작업 시작과 완료 시 `/docs` 문서를 갱신한다. 구체적으로 `docs/admin-site.md`, `docs/operations-environment.md`, `BACKEND.md`에 RustFS 기반 공개 에셋 업로드 환경 변수를 반영한다.

## 자체 검토

- 설계는 썸네일 업로드 하나에 집중하며 코스 편집 저장 모델을 바꾸지 않는다.
- signed URL 방식으로 어드민 API가 파일 바이트를 직접 처리하지 않는다.
- RustFS 로컬 구성은 이미 존재하는 docker compose와 공개 버킷 초기화 스크립트를 재사용한다.
- 파일 검증은 서버와 클라이언트 양쪽에서 수행하되, 최종 신뢰 경계는 어드민 API에 둔다.
- 미참조 객체 정리는 제외 범위로 명시해 이번 구현의 범위를 작게 유지한다.
