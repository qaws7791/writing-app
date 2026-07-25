---
name: review-semantic-code
description: Review TypeScript and JavaScript codebases for architecture, domain, and test-design anti-patterns that compilers, type checkers, linters, dependency graph tools, dead-code tools, and test runners cannot reliably judge. Use for pull-request reviews, refactor reviews, and repository audits focused on wrong abstractions, anemic domain models, spaghetti code, big balls of mud, golden-hammer or cargo-cult designs, generic CRUD and repository overuse, semantic responsibility and cohesion, fragmented use cases, incorrect domain boundaries, policy-mechanism entanglement, feature envy, hidden ordering dependencies, speculative generality, silent failure masking, and tests that verify the wrong behavior, provide misleading confidence, or pass and fail non-deterministically.
---

# Semantic Code Smell Review

Review only semantic architecture, domain-design, and test-design problems that require understanding intent, behavior, ownership, invariants, contracts, and change patterns.

Do not duplicate deterministic checks that should be handled by TypeScript, Oxlint or ESLint, dependency-cruiser, Knip, formatters, security scanners, or test runners.

## Scope

Review the changed code and only the surrounding code needed to understand it.

For a pull request, inspect the diff, affected callers and callees, relevant tests, public contracts, and recent history of the touched modules.

For a repository audit, inspect representative end-to-end business flows, high-change modules, shared models, module boundaries, and ownership or data-authority boundaries.

Use source code, tests, configuration, documentation, and Git history as evidence, but never treat directory names, pattern names, or file size as proof.

## Exclusions

Do not report formatting, naming convention, unused code, import cycles, type errors, null safety, raw complexity scores, function length, dependency vulnerabilities, coverage percentages, assertion counts, skipped tests, or other mechanically detectable violations unless they are evidence for a semantic finding below.

Do not recommend a pattern merely because it is fashionable or familiar.

Do not require object-oriented design, domain-driven design, clean architecture, microservices, repositories, or dependency injection unless the demonstrated problem specifically requires them.

Do not label simple CRUD code as an anemic domain model when the domain has no meaningful invariants or state transitions.

## Evidence standard

Report a finding only when all of the following are present:

- At least two independent evidence items, such as two code paths, code plus tests, or code plus change history. Independence means the items come from different observation points — separate call sites, a test alongside the code it exercises, or two distinct points in history. Two statements about the same line, or a rephrasing of one fact, count as one item, not two.
- Exact file and symbol references, with line ranges when available.
- A causal explanation connecting the design to correctness, change cost, coupling, delivery risk, or operational behavior.
- Relevant counterevidence considered and explained.
- A scoped recommendation that fixes the demonstrated cause rather than applying a generic pattern.

When git history or co-change data is unavailable — a shallow clone, a fresh branch, a squashed history — do not assert change-frequency or co-change claims. Substantiate the finding with code-plus-tests or cross-call-site evidence instead.

Calibrate confidence by evidence strength: `high` when the causal mechanism is directly observable in code and corroborated by at least two independent evidence items with no unresolved counterevidence; `medium` when the mechanism is observable but rests on one strong evidence item, or minor counterevidence remains unresolved; `low` when the finding depends on inference beyond what is directly observable in the inspected scope.

Calibrate severity by impact, not code aesthetics: `critical` for defects that can produce wrong business outcomes, data loss or corruption, or a security-relevant gap; `high` for defects that reliably cause incorrect behavior or materially block future changes; `medium` for defects that raise change cost or coupling without an immediate correctness failure; `low` for defects that are real but narrow in blast radius.

If evidence is insufficient, omit the finding rather than presenting speculation as a defect.

## Catalog selection

Several catalog entries observe overlapping signals — call sites, transaction boundaries, ownership — because real designs often exhibit more than one symptom at once. When more than one entry could describe the same underlying defect, report it once, under the entry whose causal mechanism most precisely matches the evidence. Do not split one root cause across multiple ids because it also happens to exhibit a secondary entry's symptoms; only report a second entry when it is independently demonstrated with its own evidence, at a different location or through a different mechanism.

## Review catalog

The catalog is organized into architecture and domain-design smells, then test-design smells. It is a reference, not a checklist: evaluate only the entries relevant to the inspected scope.

### Architecture and domain-design smells

#### Wrong abstraction (`wrong-abstraction`, 잘못된 추상화)

Inspect shared interfaces, base classes, generic helpers, mode flags, exception branches, downcasts, and callers that bypass the abstraction; report only when supposedly common consumers require contradictory contracts or repeated special cases, and do not report when the abstraction represents one stable concept with explicit variation points.

#### Anemic domain model (`anemic-domain-model`, 빈혈 도메인 모델)

Inspect entities, value objects, application services, validation, state transitions, persistence mapping, and invariant tests; report when mutable data is exposed while invariants are duplicated across orchestration services or invalid states can be created, but accept transaction scripts or pure domain functions when the domain is simple or behavior is intentionally centralized.

#### Feature envy / misplaced responsibility (`feature-envy`, 기능 시기 / 책임 오배치)

Inspect methods that read or mutate another module's internal state extensively, chains of getters used to reconstruct a decision that belongs elsewhere, and business logic anchored in a coordinating class instead of the object it acts on; report when a method depends on another module's data more than its own and that dependency causes the two modules to change together, but accept coordinating logic that legitimately orchestrates independent collaborators without duplicating their internal rules.

#### Spaghetti code (`spaghetti-code`, 스파게티 코드)

Inspect control flow across callbacks, events, middleware, globals, shared mutable state, and lifecycle ordering; report when a concrete business flow cannot be traced without hidden state or inconsistent paths and small changes unpredictably affect distant behavior, but accept explicit workflows, pipelines, or state machines even when they are complex.

#### Temporal coupling / hidden ordering dependency (`temporal-coupling`, 숨은 순서 의존성)

Inspect initialization sequences, setter chains, builder steps, and lifecycle hooks whose correctness depends on call order that is not enforced by types, return values, or the compiler; report when calling the operations out of order produces an invalid or silently wrong state and no caller can discover the required order from the API itself, but accept ordering requirements that are enforced through types, factory functions, or a single composed entrypoint.

#### Big ball of mud (`big-ball-of-mud`, 큰 진흙 덩어리)

Inspect module boundaries, shared models, ownership, data authority, deployment coupling, and co-change patterns; report when unrelated capabilities share state and release reasons while nominal boundaries provide no meaningful isolation, but do not confuse a large modular monolith with an unstructured monolith.

#### Golden hammer (`golden-hammer`, 골든 해머)

Inspect repeated use of one framework, transport, persistence model, abstraction, or architectural pattern across materially different problems; report when the preferred tool forces awkward translations, unnecessary infrastructure, or inappropriate failure modes, but accept standardization when the use cases share relevant constraints and operational savings are real.

#### Cargo-cult programming (`cargo-cult-programming`, 화물 숭배 프로그래밍)

Inspect copied layers, unexplained configuration, unused extension points, comments referencing other systems, and patterns whose assumed scale or failure mode is absent; report only when the local premise for the copied design is demonstrably missing, and accept requirements imposed by verified platform, compliance, or migration constraints.

#### Speculative generality / premature abstraction (`speculative-generality`, 투기적 일반화)

Inspect configuration options, extension points, plugin hooks, and parameters with only one real caller or one real value in production; report when the abstraction was built for an imagined future requirement rather than a demonstrated one, adds indirection with no current benefit, and its removal would not change any existing behavior, but accept generality that real current callers exercise or that a documented near-term requirement genuinely needs.

#### Generic CRUD service (`generic-crud-service`, 범용 CRUD 서비스)

Inspect generic controllers, services, type parameters, authorization hooks, validation hooks, partial updates, transactions, and side effects; report when distinct domain resources are forced through identical CRUD semantics that bypass invariants or hide meaningful commands, but accept generic CRUD for genuinely uniform administrative reference data.

#### Repository everywhere (`repository-everywhere`, 리포지토리 만능주의)

Inspect repository interfaces, implementations, query shapes, aggregate boundaries, reporting paths, and ORM wrappers; report when interfaces merely mirror ORM methods, every table receives a repository without a policy boundary, or query requirements leak through generic predicates, but accept repositories that protect aggregate invariants or isolate a genuinely volatile persistence mechanism.

#### Semantic single-responsibility violation (`semantic-single-responsibility`, 단일 책임의 의미적 위반)

Inspect independent reasons for change, business stakeholders, public contracts, tests, and Git history; report when one module repeatedly changes for unrelated capabilities or mixes policy, transport, persistence, and presentation in ways that cause change collisions, but do not infer a violation merely from the number of methods or lines.

#### Low semantic cohesion (`low-semantic-cohesion`, 낮은 의미적 응집도)

Inspect shared invariants, callers, fixtures, ownership, symbol usage, and co-change patterns; report when a module groups unrelated concepts with different callers and histories or scatters one cohesive capability across many packages, but accept diverse operations that share one lifecycle, invariant, or business capability.

#### Fragmented use case (`fragmented-use-case`, 유스케이스 분산)

Inspect entrypoints, command or query handlers, controllers, application services, transaction boundaries, authorization, and user-visible outcomes; report when callers must assemble low-level primitives to perform one business action or when transaction and authorization boundaries do not match the user outcome, but accept technical layering when explicit application operations still represent complete use cases.

#### Incorrect domain boundary (`incorrect-domain-boundary`, 부적절한 도메인 경계)

Inspect terminology, invariants, data ownership, authoritative sources, event contracts, ownership, and co-change; report when one concept has conflicting meanings, nominal domains share invariants or schemas, or changes routinely cross the boundary, but accept cross-domain interaction through stable contracts with explicitly defined semantics.

#### Policy-mechanism entanglement (`policy-mechanism-entanglement`, 정책과 메커니즘 결합)

Inspect business decisions embedded in ORM hooks, HTTP middleware, queue consumers, framework callbacks, UI components, schedulers, or vendor SDK calls; report when policy cannot be tested or changed without infrastructure and changing the mechanism changes business behavior, but accept thin adapters that delegate to explicit policy functions or domain operations.

#### Silent failure masking / error-semantics collapse (`silent-failure-masking`, 오류 의미 손실)

Inspect catch blocks, error mapping layers, retries, and fallback paths that convert distinct failure categories — validation, authorization, transient, permanent — into one generic outcome, swallow the original cause, or continue as if the operation succeeded; report when the caller or the user loses information needed to react correctly and a realistic downstream defect follows from that lost distinction, but accept deliberate normalization at a boundary whose contract explicitly defines a single external failure mode.

### Test-design smells

#### Implementation-coupled test (`implementation-coupled-test`, 구현 결합 테스트)

Inspect tests that assert private methods, internal call order, incidental object shape, exact intermediate values, or framework internals; report when behavior-preserving refactors repeatedly break tests or when tests can pass while the public contract is wrong, but accept interaction assertions when ordering or collaboration is itself part of the contract.

#### Overspecified interaction test (`overspecified-interaction-test`, 과도한 상호작용 검증)

Inspect mock call counts, exact argument lists, call sequences, and negative interaction assertions; report when tests prescribe one implementation strategy instead of verifying the externally observable outcome and therefore resist harmless decomposition, but accept precise interaction checks for audit, idempotency, transactional, security, or protocol requirements.

#### Over-mocked boundary (`over-mocked-boundary`, 경계 과잉 모킹)

Inspect mocks and stubs for databases, queues, HTTP clients, serializers, frameworks, clocks, and internal collaborators; report when the test replaces the very boundary whose contract or integration behavior creates the risk, or when locally invented mocks can drift from production semantics, but accept fakes or mocks that are contract-tested and used to isolate slow or nondeterministic systems.

#### Tautological test oracle (`tautological-test-oracle`, 자기증명식 테스트)

Inspect expected values calculated with the same algorithm, helper, mapping table, regular expression, query builder, or implementation constants used by production code; report when the test can reproduce the same defect and still pass, but accept shared canonical fixtures or standards-derived constants whose independence and authority are explicit.

#### Non-deterministic test oracle (`nondeterministic-test-oracle`, 비결정적 오라클)

Inspect assertions and setup that depend on wall-clock time, random values, network timing, or execution order without a controlled seed, fake clock, or fixed ordering; report when the test's pass or fail outcome intermittently changes for reasons unrelated to the behavior under test — causing real regressions to be dismissed as flaky or retried into a false pass — but accept genuinely timing-sensitive tests that assert explicit tolerances and control the sources of variance they claim to test.

#### Shared mutable fixture (`shared-mutable-fixture`, 공유 가변 픽스처)

Inspect module-level objects, reused database rows, singleton containers, mutable builders, global mocks, and lifecycle hooks; report when one test can alter the preconditions or outcome of another and the suite depends on execution order or hidden cleanup, but accept immutable fixtures and isolated transactional setup with explicit reset guarantees.

#### Mystery guest test (`mystery-guest-test`, 외부 맥락 의존 테스트)

Inspect tests whose meaning depends on opaque factories, distant fixtures, seeded databases, environment variables, wall-clock dates, network state, or files not visible near the assertion; report when the reader cannot determine the relevant preconditions or when unrelated fixture changes alter the test result, but accept centrally managed fixtures when the scenario-specific values and guarantees remain explicit at the call site.

#### Unrepresentative test double (`unrepresentative-test-double`, 비현실적 테스트 대역)

Inspect in-memory repositories, fake clocks, fake queues, fake transactions, stubbed SDKs, and local protocol emulators; report when the double omits production behaviors such as uniqueness, ordering, retries, serialization, transaction isolation, pagination, error mapping, or eventual consistency that are material to the tested outcome, but accept simplified doubles whose behavioral contract is verified against the real adapter.

#### Fragmented use-case verification (`fragmented-use-case-verification`, 유스케이스 검증 분산)

Inspect tests that separately verify controller, service, repository, and event-handler steps without any test asserting the complete user-visible or business outcome; report when each layer can pass while authorization, transaction, rollback, side effects, or final state are incorrectly composed, but accept layered tests when at least one appropriate contract or integration test verifies the assembled use case.

#### Snapshot as primary oracle (`snapshot-primary-oracle`, 스냅샷 중심 검증)

Inspect large snapshots of UI trees, API payloads, serialized objects, logs, or generated documents; report when reviewers cannot identify which business properties matter, broad updates normalize regressions, or unstable incidental data dominates the assertion, but accept focused snapshots for intentionally stable representations supplemented by explicit semantic assertions.

#### Invariant-blind test suite (`invariant-blind-test-suite`, 불변식 무시 테스트)

Inspect domain operations, validation, state transitions, authorization, rollback, and error handling alongside their tests; report when tests demonstrate successful examples but do not verify a clearly identified high-impact invariant against invalid, duplicate, unauthorized, partial-failure, or conflicting inputs, but do not report generic missing coverage without a concrete invariant and credible failure path.

#### Concurrency-blind test (`concurrency-blind-test`, 동시성 무시 테스트)

Inspect code involving retries, idempotency, optimistic locking, queues, caches, parallel promises, reservations, counters, or read-modify-write flows; report when tests serialize all operations or mock away coordination so conflicting interleavings cannot be exercised despite a concrete race-sensitive invariant, but accept sequential tests when the production boundary itself guarantees serialization.

## Review procedure

1. Identify the business behavior changed or inspected.
2. Trace at least one complete path from entrypoint to state change or external effect.
3. Identify invariants, ownership, data authority, transaction boundaries, and observable contracts relevant to that path.
4. Inspect neighboring callers, tests, test doubles, fixtures, and recent history for corroborating or disconfirming evidence.
5. Trace how the relevant tests would fail for at least one realistic defect or regression in the inspected behavior.
6. Evaluate only the catalog entries relevant to the inspected scope.
7. Group symptoms under the smallest plausible root cause, applying Catalog selection when more than one entry could fit.
8. Report no more than ten prioritized findings.
9. State explicitly when no supported semantic findings were found.

## Output format

Start with a one-paragraph scope summary.

For each finding, use this structure:

```markdown
## [severity][confidence] Finding title

- Smell: `<catalog-id>`
- Location: `path/to/file.ts:line-line`, `SymbolName`
- Observed facts: Concrete facts visible in code, tests, contracts, or history.
- Interpretation: The semantic design conclusion derived from those facts.
- Impact: The specific correctness, coupling, change-cost, delivery, or operational consequence.
- Counterevidence: Evidence considered that could make the design intentional or acceptable.
- Recommendation: The smallest practical change that addresses the demonstrated cause.
```

### Example

```markdown
## [high][high] Payment retry swallows the distinction between transient and permanent failures

- Smell: `silent-failure-masking`
- Location: `src/billing/paymentGateway.ts:88-114`, `chargeCard`
- Observed facts: `chargeCard` catches every error from the provider SDK, logs a generic "payment failed" message, and returns `{ ok: false }` for both a declined card (permanent) and a network timeout (transient). `src/billing/retryQueue.ts:40` re-enqueues any `{ ok: false }` result with the same backoff regardless of cause.
- Interpretation: The retry policy cannot distinguish failures worth retrying from failures that will never succeed, because the causal information was discarded at the catch site.
- Impact: Declined cards are retried for up to six hours (per `retryQueue.ts:12`), delaying refund and support workflows and generating provider-side rate-limit warnings visible in the incident log.
- Counterevidence: None found; no test or comment indicates this collapsing is intentional.
- Recommendation: Preserve the provider's error category through `chargeCard`'s return type and route only transient categories to the retry queue.
```

Order findings by severity and then confidence.

Do not include generic praise, a catalog checklist, or mechanically detectable lint findings.

When no finding satisfies the evidence standard, return:

```markdown
No supported semantic architecture, domain-design, or test-design findings were identified in the inspected scope.
```
