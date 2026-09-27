# 배포 기준

현재 지원하는 실행 절차는 [로컬 개발](./runtime-configuration.md)이다. Cloudflare CLI 인증과 원격 배포는 보류 상태다.

실행 경계는 각 앱의 `src/worker.ts`가 소유한다. binding과 환경별 선언은 각 앱의 `wrangler.jsonc`가 소유한다. 프론트엔드는 API service binding으로 HTTP 요청을 전달한다. 학습자와 관리자 origin은 분리한다.

Docker, Caddy, Litestream과 Ansible의 저장소 구성은 제거했다. 기존 원격 서버를 종료하거나 DNS를 전환한 것으로 해석하지 않는다.

원격 배포를 재개하기 전에 다음 조건을 검증해야 한다.

1. 대상 계정, 환경과 자원 binding을 확인한다.
2. 비밀 값을 Cloudflare 비밀 관리 경계에 등록한다.
3. 요금제에서 필요한 AI·이미지·메일 기능을 사용할 수 있는지 확인한다.
4. 격리된 원격 환경에 migration을 적용한다.
5. 로그인, 저장, 발행, 파일 업로드와 복구를 검증한다.
6. 운영 트래픽 전환 후 기존 인프라 제거 범위를 확인한다.

운영 배포 자동화와 복구 절차는 아직 검증하지 않았다. 로컬 build 성공만으로 운영 배포를 승인하지 않는다.
