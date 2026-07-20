# Migration 원칙

## 목적

이 문서는 schema와 데이터 migration의 안전한 변경 절차를 정의한다. 현재 migration 파일, 실행 명령과 baseline은 DB package와 deployment automation이 소유한다.

## 원칙

- migration은 순서가 보존되는 append-only 변경 기록으로 관리한다.
- application과 schema가 공존해야 하는 기간에는 backward-compatible 변경을 우선한다.
- migration, seed, backup·restore, health 검증은 하나의 운영 판단 단위다.
- destructive migration과 이전 코드가 읽을 수 없는 변경은 자동 code rollback 대상으로 취급하지 않는다.
- 현재 migration 목록이나 실행 결과를 living guide에 복제하지 않는다.

## 실행 절차

1. 영향받는 데이터·consumer·복구 가능성을 확인한다.
2. 격리된 fixture에서 migration과 application read/write를 검증한다.
3. production 전 backup과 무결성 검사를 수행한다.
4. 승인된 automation으로 migration과 기동 검증을 실행한다.
5. 실패하면 새 상태를 정상으로 기록하지 않고, code rollback과 data recovery를 분리해 판단한다.

## 검증 기록

실제 migration 실행과 복구 훈련의 commit, 데이터 source, 환경, 명령, 무결성 결과와 소요 시간은 archive 보고서에 고정한다.
