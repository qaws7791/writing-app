import { describe, expect, test } from "bun:test"

import {
  createAnsibleImageVariables,
  createImageReleaseManifest,
  createImageReleaseRecord,
  type ImageReleasePublicOrigins,
  parseImageReleaseManifest,
  parseImageReleaseRecord,
  validateImageReleaseInputs,
} from "./image-release-metadata"

const publicOrigins: ImageReleasePublicOrigins = {
  admin: "https://admin.writing.example.com",
  productionAssets: "https://assets.writing.example.com",
  stagingAssets: "https://staging-assets.writing.example.com",
  web: "https://writing.example.com",
}
const revision = "a".repeat(40)
const repository = "Owner/Writing-App"

function createRecords() {
  return [
    createImageReleaseRecord({
      digest: `sha256:${"1".repeat(64)}`,
      repository,
      revision,
      service: "web",
    }),
    createImageReleaseRecord({
      digest: `sha256:${"2".repeat(64)}`,
      repository,
      revision,
      service: "api",
    }),
    createImageReleaseRecord({
      digest: `sha256:${"3".repeat(64)}`,
      repository,
      revision,
      service: "admin",
    }),
  ] as const
}

describe("image release metadata", () => {
  test("production origin과 source revision 계약을 검증한다", () => {
    expect(
      validateImageReleaseInputs({ publicOrigins, repository, revision })
    ).toEqual([])
    expect(
      validateImageReleaseInputs({
        publicOrigins: {
          ...publicOrigins,
          stagingAssets: publicOrigins.productionAssets,
          web: "https://web.example.test",
        },
        repository,
        revision: "main",
      })
    ).toEqual(
      expect.arrayContaining([
        "source revision은 40자리 lowercase Git SHA여야 합니다.",
        "production과 staging asset origin은 달라야 합니다.",
        "web은(는) 실제 production hostname이어야 합니다.",
      ])
    )
  })

  test("manifest는 source revision과 세 immutable image만 가진다", () => {
    const manifest = createImageReleaseManifest(createRecords())

    expect(manifest).toEqual({
      images: {
        admin: `ghcr.io/owner/writing-app-admin@sha256:${"3".repeat(64)}`,
        api: `ghcr.io/owner/writing-app-api@sha256:${"2".repeat(64)}`,
        web: `ghcr.io/owner/writing-app-web@sha256:${"1".repeat(64)}`,
      },
      sourceRevision: revision,
    })
    expect(() => createImageReleaseManifest(createRecords().slice(1))).toThrow(
      "세 image record가 모두 필요합니다."
    )
  })

  test("서로 다른 revision과 repository 또는 중복 service를 거부한다", () => {
    const records = createRecords()

    expect(() =>
      createImageReleaseManifest([
        records[0],
        records[1],
        { ...records[2], sourceRevision: "b".repeat(40) },
      ])
    ).toThrow("source revision")
    expect(() =>
      createImageReleaseManifest([
        records[0],
        records[1],
        {
          ...records[2],
          image: records[2].image.replace(
            "ghcr.io/owner/writing-app",
            "ghcr.io/other/writing-app"
          ),
        },
      ])
    ).toThrow("같은 GHCR repository")
    expect(() =>
      createImageReleaseManifest([records[0], records[0], records[2]])
    ).toThrow("중복")
  })

  test("잘못된 digest와 service가 일치하지 않는 reference를 거부한다", () => {
    expect(() =>
      createImageReleaseRecord({
        digest: "sha256:short",
        repository,
        revision,
        service: "web",
      })
    ).toThrow("image digest")
    expect(() =>
      parseImageReleaseRecord({
        image: `ghcr.io/owner/writing-app-api@sha256:${"b".repeat(64)}`,
        sourceRevision: revision,
        service: "web",
      })
    ).toThrow("web service")
  })

  test("manifest의 추가 metadata와 누락 service를 거부한다", () => {
    const manifest = createImageReleaseManifest(createRecords())

    expect(() =>
      parseImageReleaseManifest({
        ...manifest,
        configurationDigest: "unused",
      })
    ).toThrow("허용된 필드")
    expect(() =>
      parseImageReleaseManifest({
        ...manifest,
        images: {
          api: manifest.images.api,
          web: manifest.images.web,
        },
      })
    ).toThrow("허용된 필드")
  })

  test("검증된 manifest를 세 image와 source revision Ansible 변수로 변환한다", () => {
    const manifest = createImageReleaseManifest(createRecords())

    expect(createAnsibleImageVariables(manifest)).toEqual({
      writing_app_admin_image: manifest.images.admin,
      writing_app_api_image: manifest.images.api,
      writing_app_source_revision: revision,
      writing_app_web_image: manifest.images.web,
    })
  })
})
