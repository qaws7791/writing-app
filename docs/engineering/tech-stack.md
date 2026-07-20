# 기술 선택 원칙

## 목적

이 문서는 기술 선택의 이유와 교체 판단 기준을 기록한다. 현재 runtime, dependency, 정확한 버전과 image는 manifest·lockfile·deployment 설정이 소유한다.

## 선택 기준

- 제품 요구를 충족하는 가장 작은 기술 조합을 우선한다.
- runtime 경계, 타입 계약, 테스트 격리와 배포 재현성을 훼손하는 의존성은 도입하지 않는다.
- 라이브러리 도입은 독립적인 책임, 유지보수 owner, 제거 가능성, 보안 갱신 경로를 함께 제시해야 한다.
- framework 기능으로 해결할 수 있는 문제에 새 abstraction이나 package를 추가하지 않는다.
- build·runtime·운영 image는 재현 가능한 입력을 사용하고, 갱신은 검증 결과와 함께 수행한다.

## 변경 판단

새 기술을 도입하거나 현재 선택을 교체할 때는 다음을 기록한다.

1. 해결하려는 제품 또는 운영 문제
2. 기존 수단이 부족한 검증 가능한 근거
3. 성능, 보안, 유지보수성과 배포 복잡도에 미치는 영향
4. rollback 또는 제거 경로
5. 여러 경계를 바꾸는 경우 ADR

현재 dependency graph와 version은 package manifest와 lockfile을, deployment image는 deployment source를 직접 확인한다.
