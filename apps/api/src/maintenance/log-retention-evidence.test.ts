import { describe, expect, it } from "vitest"

import { parseExternalLogRetentionEvidence } from "@/maintenance/log-retention-evidence"

const now = new Date("2026-07-24T00:00:00.000Z")
const validEvidence = {
  applicationRequestRetentionDays: 30,
  evidenceId: "log-policy-check-2026-07-24",
  securityRetentionDays: 90,
  sink: "central-log-sink",
  validUntil: "2026-07-25T00:00:00.000Z",
  verifiedAt: "2026-07-24T00:00:00.000Z",
}

describe("외부 log class retention 증거", () => {
  it("sink, 증거 식별자, 검증 시각과 class별 기간이 있는 구조만 허용한다", () => {
    expect(parseExternalLogRetentionEvidence(validEvidence, now)).toEqual({
      applicationRequestRetentionDays: 30,
      evidenceId: "log-policy-check-2026-07-24",
      securityRetentionDays: 90,
      sink: "central-log-sink",
      validUntil: new Date("2026-07-25T00:00:00.000Z"),
      verifiedAt: now,
    })
    expect(() => parseExternalLogRetentionEvidence(true, now)).toThrow(
      /expected.*object/isu
    )
    expect(() =>
      parseExternalLogRetentionEvidence(
        { ...validEvidence, operatorConfirmed: true },
        now
      )
    ).toThrow(/operatorConfirmed/u)
    expect(() =>
      parseExternalLogRetentionEvidence(
        { ...validEvidence, evidenceId: "log-placeholder-2026" },
        now
      )
    ).toThrow(/실제 외부 증거/u)
    expect(() =>
      parseExternalLogRetentionEvidence(
        { ...validEvidence, sink: "https://example.com/logs" },
        now
      )
    ).toThrow(/실제 외부 증거/u)
  })

  it("요청 30일·보안 90일 초과, 미래 검증, 만료된 증거를 거부한다", () => {
    expect(() =>
      parseExternalLogRetentionEvidence(
        { ...validEvidence, applicationRequestRetentionDays: 31 },
        now
      )
    ).toThrow(/applicationRequestRetentionDays/u)
    expect(() =>
      parseExternalLogRetentionEvidence(
        { ...validEvidence, securityRetentionDays: 91 },
        now
      )
    ).toThrow(/securityRetentionDays/u)
    expect(() =>
      parseExternalLogRetentionEvidence(
        {
          ...validEvidence,
          validUntil: "2026-07-26T00:00:00.000Z",
          verifiedAt: "2026-07-25T00:00:00.000Z",
        },
        now
      )
    ).toThrow(/유효기간/u)
    expect(() =>
      parseExternalLogRetentionEvidence(
        {
          ...validEvidence,
          validUntil: "2026-07-24T00:00:00.000Z",
          verifiedAt: "2026-07-23T00:00:00.000Z",
        },
        now
      )
    ).toThrow(/유효기간/u)
    expect(() =>
      parseExternalLogRetentionEvidence(
        {
          ...validEvidence,
          validUntil: "2026-07-23T23:59:59.999Z",
          verifiedAt: "2026-07-23T00:00:00.000Z",
        },
        now
      )
    ).toThrow(/유효기간/u)
  })
})
