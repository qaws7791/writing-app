const dayMs = 24 * 60 * 60 * 1_000

/** 삭제 요청 후 사용자 소유 데이터를 보존하는 기본 일수. 제품 요구사항이 소유한 값이다. */
export const defaultDeletedLearnerRetentionDays = 5

export function calculateDeletedLearnerPurgeCutoff(
  now: Date,
  retentionDays: number
): Date {
  const nowTime = now.getTime()
  if (!Number.isFinite(nowTime)) {
    throw new Error("삭제 학습자 purge 기준 시각이 올바르지 않습니다.")
  }
  if (!Number.isInteger(retentionDays) || retentionDays < 1) {
    throw new Error("삭제 학습자 보존 기간은 1일 이상의 정수여야 합니다.")
  }

  return new Date(nowTime - retentionDays * dayMs)
}
