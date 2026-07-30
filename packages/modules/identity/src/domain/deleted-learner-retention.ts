const deletedLearnerRetentionMs = 5 * 24 * 60 * 60 * 1_000

export function calculateDeletedLearnerPurgeCutoff(now: Date): Date {
  const nowTime = now.getTime()
  if (!Number.isFinite(nowTime)) {
    throw new Error("삭제 학습자 purge 기준 시각이 올바르지 않습니다.")
  }

  return new Date(nowTime - deletedLearnerRetentionMs)
}
