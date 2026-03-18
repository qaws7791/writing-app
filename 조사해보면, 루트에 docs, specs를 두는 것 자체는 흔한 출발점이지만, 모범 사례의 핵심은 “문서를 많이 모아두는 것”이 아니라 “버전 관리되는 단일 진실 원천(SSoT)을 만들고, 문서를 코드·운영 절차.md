조사해보면, 루트에 `/docs`, `/specs`를 두는 것 자체는 흔한 출발점이지만, **모범 사례의 핵심은 “문서를 많이 모아두는 것”이 아니라 “버전 관리되는 단일 진실 원천(SSoT)을 만들고, 문서를 코드·운영 절차·에이전트 설정과 연결해 살아 있게 유지하는 것”**입니다. GitLab은 문서를 모든 기여자가 접근 가능한 단일 진실 원천으로 두어야 한다고 강조하고, Google은 방치된 방대한 문서보다 “작지만 정확하고 최신인 문서”가 낫다고 말합니다. GitLab의 설계 문서 가이드는 설계 문서를 아키텍처 워크플로의 핵심 산출물로 두고, 버전 관리되며 반복마다 계속 업데이트되는 문서로 정의합니다. ([about.gitlab.com](https://about.gitlab.com/topics/version-control/software-team-collaboration/))

정리하면, 신뢰할 만한 자료들에서 반복적으로 보이는 원칙은 다음과 같습니다.

1. **단일 진실 원천을 먼저 세운다.**
   설계·운영·협업 정보가 여러 도구에 흩어져 있으면 중복과 불일치가 생깁니다. GitLab은 “모든 기여자가 접근 가능한 living text”를 단일 진실 원천으로 두라고 권하고, 원격 협업 관점에서도 “unwritten rules가 없어야 한다”고 말합니다. 코딩 에이전트를 쓸수록 이 원칙은 더 중요합니다. 에이전트는 흩어진 비공개 지식을 잘 추론하지 못하고, 저장소 안의 명시적 문맥에 훨씬 잘 반응하기 때문입니다. ([about.gitlab.com](https://about.gitlab.com/topics/version-control/software-team-collaboration/))
2. **설계 문서는 코드와 같은 수준으로 버전 관리한다.**
   GitLab은 설계 문서를 기술 비전과 구현 원칙을 담는 “primary artifact”로 보고, 반복마다 계속 갱신되는 버전 관리 문서로 다룹니다. Google Cloud도 ADR을 Markdown으로 코드 가까이에 두라고 권합니다. 즉, 큰 아키텍처 문서만 `/docs`에 몰아넣기보다, **전사/프로젝트 공통 문서와 컴포넌트 근접 문서를 섞는 하이브리드 구조**가 더 낫습니다. ([The GitLab Handbook](https://handbook.gitlab.com/handbook/engineering/architecture/design-documents/))
3. **의사결정은 ADR 같은 짧은 기록으로 남긴다.**
   Google Cloud는 ADR이 선택지, 요구사항, 결정 자체를 기록하고, 왜 그런 결정을 했는지 이후 팀원이 이해하도록 돕는다고 설명합니다. 또한 ADR은 코드와 같은 버전 관리 시스템 안, 가급적 코드 가까이에 두라고 권합니다. Martin Fowler 계열 자료도 ADR을 저장소와 함께 두는 경량 의사결정 기록으로 봅니다. 따라서 “설계서 1개”만 두는 것보다, **중요한 결정마다 작은 ADR을 쌓는 구조**가 유지보수와 에이전트 이해에 훨씬 유리합니다. ([Google Cloud Documentation](https://docs.cloud.google.com/architecture/architecture-decision-records))
4. **운영 문서는 별도 자산으로 관리한다.**
   AWS는 문서 자산 예시로 아키텍처 다이어그램, ADR, SOP, IaC 저장소, 플레이북/런북, 위협 모델, 팀 회고, 게임데이 문서를 함께 제시합니다. 또 런북은 중앙 위치에 게시되고, 프로세스가 바뀌면 같이 갱신되어야 하며, 오류 처리·도구·권한·예외·에스컬레이션까지 포함해야 한다고 명시합니다. 즉, 운영 문서는 부록이 아니라 **개발 문서와 동급의 1급 산출물**로 봐야 합니다. ([AWS 문서](https://docs.aws.amazon.com/wellarchitected/latest/userguide/documentation-and-infrastructure.html))
5. **사고 대응과 사후 분석도 저장소 문서 체계에 포함한다.**
   Google SRE는 포스트모템을 사고의 영향, 완화 조치, 근본 원인, 재발 방지 액션을 담는 “written record”로 정의하고, AWS는 모든 고객 영향 사고에 대해 기여 요인을 문서화하고 교훈을 조직 내에서 공유하라고 권합니다. 따라서 운영 문서에는 단순 런북만이 아니라 **incident 대응 절차, 포스트모템 템플릿, RCA 이력**까지 포함하는 것이 모범 사례에 가깝습니다. ([Google SRE](https://sre.google/sre-book/postmortem-culture/))
6. **이슈/PR 입력 형식을 템플릿으로 표준화한다.**
   GitHub는 issue/PR template로 저장소가 요구하는 정보를 표준화할 수 있다고 설명합니다. 문서 관리 관점에서는 이것이 매우 중요합니다. 요구사항, 영향 범위, 테스트, 롤백 계획, 관련 설계서/ADR 링크 같은 항목이 PR 본문과 이슈에서 강제되면, 문서 체계가 자연스럽게 최신 상태를 유지합니다. ([GitHub Docs](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/about-issue-and-pull-request-templates))
7. **에이전트 전용 문서를 일반 문서 체계 위에 얹는다.**
   OpenAI는 Codex best practices에서 `AGENTS.md`를 “에이전트를 위한 README”로 설명하며, repo layout, 실행 방법, build/test/lint 명령, 엔지니어링 규칙, 금지 사항, 검증 기준을 담으라고 권합니다. GitHub도 `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md`, `AGENTS.md`를 통해 저장소 전체/경로별/에이전트별 지침을 줄 수 있다고 설명합니다. 즉, 에이전트 시대의 문서 체계는 `/docs`만으로 끝나지 않고, **“사람용 문서 + 에이전트용 운영 문맥”의 이중 구조**가 필요합니다. ([OpenAI 개발자 포털](https://developers.openai.com/codex/learn/best-practices/))
8. **문서만으로 끝내지 말고, 규칙은 CI와 스크립트로 강제한다.**
   OpenAI는 agent-first 환경에서 “문서만으로는 코드베이스 일관성을 유지할 수 없다”고 하며, 구현을 세세히 지시하기보다 아키텍처 불변조건을 테스트·검증·자동화로 강제하는 쪽이 낫다고 설명합니다. 문서는 방향을 주고, 스크립트와 CI는 강제력을 제공합니다. 이것이 스펙 주도 개발을 실제로 굴러가게 만드는 방식입니다. ([OpenAI](https://openai.com/index/harness-engineering/))

이 원칙들을 바탕으로 하면, 제가 가장 추천하는 저장소 구조는 이런 형태입니다.

```text
/ project root
├─ docs/
│  ├─ README.md
│  │
│  ├─ 00-overview/
│  │  ├─ project-summary.md
│  │  ├─ goals-and-nongoals.md
│  │  ├─ glossary.md
│  │  ├─ assumptions-and-constraints.md
│  │  └─ roadmap.md
│  │
│  ├─ 10-product/
│  │  ├─ vision.md
│  │  ├─ target-users.md
│  │  ├─ problem-statement.md
│  │  ├─ value-proposition.md
│  │  ├─ user-journeys.md
│  │  ├─ user-stories.md
│  │  ├─ scope-mvp.md
│  │  ├─ success-metrics.md
│  │  ├─ release-plan.md
│  │  └─ faq.md
│  │
│  ├─ 20-design/
│  │  ├─ design-principles.md
│  │  ├─ information-architecture.md
│  │  ├─ navigation-map.md
│  │  ├─ screen-inventory.md
│  │  ├─ component-guidelines.md
│  │  ├─ content-style-guide.md
│  │  ├─ accessibility-checklist.md
│  │  ├─ design-tokens.md
│  │  ├─ wireframes.md
│  │  └─ ui-capture-index.md
│  │
│  ├─ 30-architecture/
│  │  ├─ system-overview.md
│  │  ├─ tech-stack-rationale.md
│  │  ├─ repository-structure.md
│  │  ├─ domain-model.md
│  │  ├─ data-flow.md
│  │  ├─ request-lifecycle.md
│  │  ├─ api-overview.md
│  │  ├─ auth-and-session.md
│  │  ├─ validation-strategy.md
│  │  ├─ file-storage-strategy.md
│  │  ├─ caching-strategy.md
│  │  ├─ background-jobs-strategy.md
│  │  ├─ error-handling-architecture.md
│  │  ├─ observability-architecture.md
│  │  ├─ deployment-topology.md
│  │  └─ diagrams/
│  │     ├─ c4-context.md
│  │     ├─ c4-container.md
│  │     ├─ erd.md
│  │     ├─ sequence-login.md
│  │     ├─ sequence-core-flow.md
│  │     └─ state-machine-core-entity.md
│  │
│  ├─ 40-engineering/
│  │  ├─ coding-standards.md
│  │  ├─ typescript-conventions.md
│  │  ├─ naming-conventions.md
│  │  ├─ local-development.md
│  │  ├─ environment-variables.md
│  │  ├─ database-migration-guide.md
│  │  ├─ seeding-guide.md
│  │  ├─ api-conventions.md
│  │  ├─ frontend-architecture-guide.md
│  │  ├─ backend-architecture-guide.md
│  │  ├─ state-management-guide.md
│  │  ├─ form-handling-guide.md
│  │  ├─ error-message-guidelines.md
│  │  ├─ logging-guide.md
│  │  ├─ feature-flag-strategy.md
│  │  ├─ dependency-policy.md
│  │  └─ code-review-checklist.md
│  │
│  ├─ 50-quality/
│  │  ├─ testing-strategy.md
│  │  ├─ test-matrix.md
│  │  ├─ unit-test-guidelines.md
│  │  ├─ integration-test-guidelines.md
│  │  ├─ e2e-test-guidelines.md
│  │  ├─ qa-scenarios.md
│  │  ├─ regression-checklist.md
│  │  ├─ performance-checklist.md
│  │  ├─ accessibility-test-report.md
│  │  ├─ security-review-checklist.md
│  │  └─ known-limitations.md
│  │
│  ├─ 60-ops/
│  │  ├─ environment-strategy.md
│  │  ├─ deployment-runbook.md
│  │  ├─ rollback-runbook.md
│  │  ├─ release-checklist.md
│  │  ├─ monitoring-plan.md
│  │  ├─ alerting-assumptions.md
│  │  ├─ backup-and-restore-plan.md
│  │  ├─ incident-scenarios.md
│  │  ├─ service-readiness-review.md
│  │  ├─ cost-estimate.md
│  │  └─ scaling-considerations.md
│  │
│  ├─ 70-security/
│  │  ├─ security-requirements.md
│  │  ├─ threat-model.md
│  │  ├─ authz-matrix.md
│  │  ├─ secret-handling.md
│  │  ├─ privacy-and-data-retention.md
│  │  ├─ input-sanitization-guide.md
│  │  ├─ dependency-risk-review.md
│  │  └─ abuse-cases.md
│  │
│  ├─ 80-decisions/
│  │  ├─ README.md
│  │  ├─ adr-001-repository-shape.md
│  │  ├─ adr-002-framework-choice.md
│  │  ├─ adr-003-database-choice.md
│  │  ├─ adr-004-auth-strategy.md
│  │  ├─ adr-005-api-style.md
│  │  ├─ adr-006-file-upload-strategy.md
│  │  ├─ adr-007-observability-strategy.md
│  │  └─ adr-008-deployment-strategy.md
│  │
│  │
│  └─ templates/
│     ├─ prd.template.md
│     ├─ spec.template.md
│     ├─ adr.template.md
│     ├─ runbook.template.md
│     ├─ test-plan.template.md
│     ├─ postmortem.template.md
│     └─ decision-log.template.md
│
├─ specs/
│  ├─ README.md
│  │
│  ├─ feature-auth/
│  │  ├─ spec.md
│  │  ├─ acceptance-criteria.md
│  │  ├─ api-contract.md
│  │  ├─ data-contract.md
│  │  ├─ validation-rules.md
│  │  ├─ test-plan.md
│  │  ├─ qa-checklist.md
│  │  └─ rollout-plan.md
│  │
│  ├─ feature-onboarding/
│  │  ├─ spec.md
│  │  ├─ acceptance-criteria.md
│  │  ├─ api-contract.md
│  │  ├─ data-contract.md
│  │  ├─ validation-rules.md
│  │  ├─ test-plan.md
│  │  ├─ qa-checklist.md
│  │  └─ rollout-plan.md
│  │
│  ├─ feature-core-resource/
│  │  ├─ spec.md
│  │  ├─ acceptance-criteria.md
│  │  ├─ api-contract.md
│  │  ├─ data-contract.md
│  │  ├─ validation-rules.md
│  │  ├─ test-plan.md
│  │  ├─ qa-checklist.md
│  │  └─ rollout-plan.md
│  │
│  ├─ feature-search/
│  │  ├─ spec.md
│  │  ├─ acceptance-criteria.md
│  │  ├─ api-contract.md
│  │  ├─ query-behavior.md
│  │  ├─ ranking-rules.md
│  │  ├─ test-plan.md
│  │  ├─ qa-checklist.md
│  │  └─ rollout-plan.md
│  │
│  └─ feature-admin/
│     ├─ spec.md
│     ├─ acceptance-criteria.md
│     ├─ api-contract.md
│     ├─ authz-rules.md
│     ├─ audit-log-requirements.md
│     ├─ test-plan.md
│     ├─ qa-checklist.md
│     └─ rollout-plan.md
```

이 구조의 의도는 단순합니다. **공통 문맥은 루트와 `/docs`에**, **기능별 실행 가능한 명세는 `/specs/<feature>`에**, **서비스 특화 문맥은 서비스 디렉터리 가까이에** 둡니다. Google Cloud와 Fowler 계열 권고처럼 결정 기록은 코드 가까이에 둘 수 있고, GitHub/OpenAI 방식처럼 경로별 에이전트 지침도 병행할 수 있습니다. ([Google Cloud Documentation](https://docs.cloud.google.com/architecture/architecture-decision-records))

실무적으로는 `/docs`와 `/specs`를 다음처럼 구분하는 것이 좋습니다.

- `/docs`는 **비교적 오래 살아남는 기준 문서**입니다. 비전, 아키텍처 개요, 공통 규칙, 운영 원칙, 보안 기준, 런북, 포스트모템 템플릿 같은 것들입니다. Google의 “작고 정확한 최신 문서” 원칙 때문에, 여기에는 설명서가 아니라 **기준선**만 남기는 것이 좋습니다. ([Google GitHub](https://google.github.io/styleguide/docguide/best_practices.html))
- `/specs`는 **기능 단위의 실행 패키지**입니다. PRD 발췌, 사용자 시나리오, acceptance criteria, API 계약, 테스트 계획, 출시/롤백 계획을 한데 묶습니다. Atlassian이 설명하듯 PRD는 제품의 목적·기능·행동을 정의하고, 비즈니스와 기술 팀 사이의 shared understanding을 만드는 문서이므로, 기능 스펙은 제품-기술 연결부에 두는 것이 맞습니다. ([Atlassian](https://www.atlassian.com/agile/product-management/requirements))
- 서비스 내부의 `README.md`/`AGENTS.md`/로컬 ADR은 **가장 가까운 문맥**을 담당합니다. 저장소 전체 규칙과 서비스 특화 규칙을 분리하면 에이전트와 사람 모두 탐색 비용이 줄어듭니다. ([OpenAI 개발자 포털](https://developers.openai.com/codex/guides/agents-md/))

문서 품질을 유지하려면, 각 문서에 최소한 다음 메타데이터를 붙이는 것을 권합니다. 이것은 위 자료들을 종합한 제 권장안입니다.

```md
---
title: Billing Retry Policy
owner: payments-team
status: draft | active | deprecated | archived
last_reviewed: 2026-03-19
source_of_truth: repo
related:
  - ADR-012
  - issue: #1234
  - pr: #5678
---
```

특히 `status`, `owner`, `last_reviewed`는 stale 문서를 줄이는 데 효과적입니다. Google은 오래되고 중복된 문서를 잘라내라고 하고, GitLab/Google Cloud는 설계·ADR 문서를 계속 갱신되는 버전 관리 산출물로 봅니다. ([Google GitHub](https://google.github.io/styleguide/docguide/best_practices.html))

코딩 에이전트 관점에서는 다음 세 가지를 꼭 넣는 편이 좋습니다.

- 루트 `AGENTS.md`: 저장소 전체 규칙, 필수 명령, 금지 사항, Definition of Done. OpenAI는 이것을 repo layout, build/test/lint, conventions, do-not rules, verification 기준을 담는 파일로 권합니다. ([OpenAI 개발자 포털](https://developers.openai.com/codex/learn/best-practices/))
- `.github/copilot-instructions.md`: 프로젝트 개요, 기술 스택, 구조, 리소스, build/test/validate 절차. GitHub는 이 파일이 Copilot에게 저장소를 이해하고 변경을 빌드·테스트·검증하는 방법을 알려준다고 설명합니다. ([GitHub Docs](https://docs.github.com/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot))
- `.github/instructions/*.instructions.md` 또는 하위 `AGENTS.md`: 프론트엔드/백엔드/운영 등 경로별 특수 규칙. GitHub는 path-specific instructions를 공식 지원하고, OpenAI는 더 가까운 디렉터리의 규칙이 우선되게 설계합니다. ([GitHub Docs](https://docs.github.com/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot))

반대로 피하는 편이 좋은 안티패턴도 명확합니다.

- 모든 문서를 `/docs` 한 곳에만 밀어 넣고 코드 가까운 설명을 두지 않는 것
- 오래된 대형 설계서 하나만 유지하고, 실제 결정 이력은 남기지 않는 것
- 운영 문서를 위키에만 두고 저장소와 분리하는 것
- 문서에서 말한 규칙을 CI, 테스트, PR 템플릿, 스크립트로 연결하지 않는 것
- 에이전트에게는 긴 문서만 주고, 실제 실행 명령·검증 절차·금지 규칙을 명시하지 않는 것 ([Google GitHub](https://google.github.io/styleguide/docguide/best_practices.html))

제 결론은 이렇습니다.
**루트 `/docs`, `/specs`는 좋은 시작이지만, 최선의 체계는 “SSoT + 코드 근접 문서 + ADR + 운영 문서 + 에이전트 지침 + 템플릿/CI 강제”의 조합**입니다. 사람만 읽는 저장소라면 `/docs` 중심 구조도 어느 정도 버티지만, **코딩 에이전트까지 참여하는 스펙 주도 개발**이라면 다음 구성이 가장 안정적입니다.

- 루트: `README.md`, `AGENTS.md`, `CONTRIBUTING.md`
- 공통 기준: `/docs`
- 기능 실행 스펙: `/specs/<feature>`
- 서비스 근접 문맥: `services/*/README.md`, `services/*/AGENTS.md`, 로컬 ADR
- 입력 표준화: `.github/ISSUE_TEMPLATE`, `pull_request_template.md`
- 에이전트 지시: `.github/copilot-instructions.md`, `.github/instructions/*`

