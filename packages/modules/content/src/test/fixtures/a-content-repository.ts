import type { ContentRepository } from "#content/application/ports/content-ports"

/** 각 use case가 실제로 쓰는 port만 override하고, 나머지 호출은 실패로 드러낸다. */
export function aContentRepository(
  overrides: Partial<ContentRepository> = {}
): ContentRepository {
  return {
    createAsset: overrides.createAsset ?? unexpectedCall("createAsset"),
    createCourse: overrides.createCourse ?? unexpectedCall("createCourse"),
    deleteOrphanedAssetCandidates:
      overrides.deleteOrphanedAssetCandidates ??
      unexpectedCall("deleteOrphanedAssetCandidates"),
    findCourse: overrides.findCourse ?? unexpectedCall("findCourse"),
    findCurriculumByLesson:
      overrides.findCurriculumByLesson ??
      unexpectedCall("findCurriculumByLesson"),
    findDraft: overrides.findDraft ?? unexpectedCall("findDraft"),
    listActiveAssetsForCourse:
      overrides.listActiveAssetsForCourse ??
      unexpectedCall("listActiveAssetsForCourse"),
    listOrphanedAssetCandidates:
      overrides.listOrphanedAssetCandidates ??
      unexpectedCall("listOrphanedAssetCandidates"),
    listPublishedCourseSummaries:
      overrides.listPublishedCourseSummaries ??
      unexpectedCall("listPublishedCourseSummaries"),
    publishDraft: overrides.publishDraft ?? unexpectedCall("publishDraft"),
    readActiveAssetsByIds:
      overrides.readActiveAssetsByIds ??
      unexpectedCall("readActiveAssetsByIds"),
    readAssetOwner:
      overrides.readAssetOwner ?? unexpectedCall("readAssetOwner"),
    readCourseEditor:
      overrides.readCourseEditor ?? unexpectedCall("readCourseEditor"),
    readCourses: overrides.readCourses ?? unexpectedCall("readCourses"),
    readCurriculum:
      overrides.readCurriculum ?? unexpectedCall("readCurriculum"),
    saveCourse: overrides.saveCourse ?? unexpectedCall("saveCourse"),
    saveDraft: overrides.saveDraft ?? unexpectedCall("saveDraft"),
  }
}

function unexpectedCall(name: keyof ContentRepository) {
  return async (): Promise<never> => {
    throw new Error(`ContentRepository.${name}을 호출하면 안 됩니다.`)
  }
}
