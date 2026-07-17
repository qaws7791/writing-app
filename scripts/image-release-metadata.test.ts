import { describe, expect, test } from "bun:test"

import {
  createImageReleaseConfigurationDigest,
  createImageReleaseManifest,
  createImageReleaseRecord,
  type ImageReleasePublicOrigins,
  imageReleaseServices,
  parseImageReleaseRecord,
  validateImageReleaseInputs,
} from "./image-release-metadata"

const publicOrigins: ImageReleasePublicOrigins = {
  admin: "https://admin.writing.example.com",
  "admin-api": "https://admin-api.writing.example.com",
  api: "https://api.writing.example.com",
  web: "https://writing.example.com",
}
const revision = "a".repeat(40)
const digest = `sha256:${"b".repeat(64)}`
const repository = "Owner/Writing-App"
const vulnerabilityPolicyDigest = "c".repeat(64)

describe("image release metadata", () => {
  test("production origin과 revision 계약을 검증한다", () => {
    expect(
      validateImageReleaseInputs({ publicOrigins, repository, revision })
    ).toEqual([])
    expect(
      validateImageReleaseInputs({
        publicOrigins: {
          ...publicOrigins,
          web: "https://web.example.test",
        },
        repository,
        revision: "main",
      })
    ).toEqual(
      expect.arrayContaining([
        "release revision은 40자리 lowercase Git SHA여야 합니다.",
        "web은(는) 실제 production hostname이어야 합니다.",
      ])
    )
  })

  test("공개 origin digest는 순서가 고정되고 변경을 반영한다", () => {
    const current = createImageReleaseConfigurationDigest(publicOrigins)
    expect(current).toHaveLength(64)
    expect(createImageReleaseConfigurationDigest(publicOrigins)).toBe(current)
    expect(
      createImageReleaseConfigurationDigest({
        ...publicOrigins,
        web: "https://new.writing.example.com",
      })
    ).not.toBe(current)
  })

  test("세 image가 모두 같은 revision과 설정일 때만 manifest를 만든다", () => {
    const records = imageReleaseServices.map((service) =>
      createImageReleaseRecord({
        digest,
        imageName: `ghcr.io/owner/writing-app-${service}`,
        publicOrigins,
        repository,
        revision,
        service,
        vulnerabilityPolicyDigest,
      })
    )
    const manifest = createImageReleaseManifest(records)

    expect(manifest.revision).toBe(revision)
    expect(manifest.vulnerabilityPolicyDigest).toBe(vulnerabilityPolicyDigest)
    expect(manifest.images.web.reference).toBe(
      `ghcr.io/owner/writing-app-web@${digest}`
    )
    expect(() => createImageReleaseManifest(records.slice(1))).toThrow(
      "세 image record가 모두 필요합니다."
    )
  })

  test("잘못된 digest와 image name을 거부한다", () => {
    expect(() =>
      createImageReleaseRecord({
        digest: "sha256:short",
        imageName: "ghcr.io/owner/writing-app-web",
        publicOrigins,
        repository,
        revision,
        service: "web",
        vulnerabilityPolicyDigest,
      })
    ).toThrow("image digest")
    expect(() =>
      createImageReleaseRecord({
        digest,
        imageName: "ghcr.io/owner/other-web",
        publicOrigins,
        repository,
        revision,
        service: "web",
        vulnerabilityPolicyDigest,
      })
    ).toThrow("image name")
  })

  test("집계 입력의 GHCR image name과 service 일치를 검증한다", () => {
    const record = createImageReleaseRecord({
      digest,
      imageName: "ghcr.io/owner/writing-app-web",
      publicOrigins,
      repository,
      revision,
      service: "web",
      vulnerabilityPolicyDigest,
    })

    expect(() =>
      parseImageReleaseRecord({
        ...record,
        image: {
          ...record.image,
          name: "registry.example.com/owner/writing-app-web",
          reference: `registry.example.com/owner/writing-app-web@${digest}`,
        },
      })
    ).toThrow("lowercase GHCR repository")
  })
})
