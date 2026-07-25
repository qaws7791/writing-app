---
name: manage-dependencies
description: Safely review or change repository dependencies while preserving package-manager conventions, lockfile integrity, compatibility, licensing, security, and reproducibility. Use for dependency additions, upgrades, downgrades, pins, replacements, removals, audits, deduplication, and overrides in any ecosystem.
---

# Manage Dependencies

Make the smallest justified change, verify it, and report remaining risk. Installation success or a clean audit is not proof of safety.

## Non-negotiable rules

- Respect the requested scope. Review-only tasks must not mutate the repository.
- Preserve the existing package manager, workspace layout, registry settings, version policy, dependency categories, and lockfile format.
- Never edit generated lockfiles manually or create another package manager's lockfile.
- Do not use `--force`, bypass peer checks, suppress lifecycle scripts, or apply broad automatic fixes without explicit approval and justification.
- Do not change unrelated dependencies.
- Use current primary sources for external claims and separate facts, inferences, and unknowns.

## Workflow

### 1. Establish the baseline

Inspect repository instructions, version-control status, manifests, lockfiles, workspaces, package-manager pins, registry configuration, patches, and overrides. Identify the target package, dependency category, current resolved version, requested constraint, repository usage, and a relevant baseline check.

Stop if package-manager or lockfile ownership is ambiguous.

### 2. Minimize the dependency

Prefer existing platform functionality, then an existing direct dependency, then a small local implementation for narrow and stable behavior. Add a dependency only when its correctness, interoperability, security, or maintenance value justifies its lifecycle cost.

Declare packages imported directly; do not rely on transitive availability. Do not locally reimplement security-sensitive or standards-heavy behavior such as cryptography, authentication, sanitization, complex parsing, Unicode, locale, or time zones.

### 3. Evaluate material risk

For additions, replacements, unfamiliar packages, major upgrades, or security-sensitive changes, read [evaluation-framework.md](references/evaluation-framework.md).

Verify only what is material to the decision:

- identity, publisher, source, provenance, and ownership;
- maintenance and deprecation status;
- runtime, framework, platform, module, and peer compatibility;
- license compatibility;
- advisories, lifecycle scripts, native binaries, downloads, code generation, and supply-chain exposure;
- transitive, install, bundle, binary, startup, or runtime footprint;
- API stability, migration cost, type support, and lock-in.

Compare credible alternatives when the choice is open. Evaluate a user-specified package rather than silently replacing it.

Pause when identity or ownership is unclear, licensing is unacceptable, a material vulnerability lacks mitigation, compatibility requires an unsupported policy change, installation introduces unexpected privileged behavior, or lockfile churn is unexplained.

### 4. Apply the smallest coherent change

Choose the target version deliberately and read applicable release and migration notes. Preserve the repository's version-range policy and predict the expected file changes before running the package manager in the correct workspace.

- **Add:** install the explicit version or range, confirm bundled types, integrate narrowly, and inspect the diff.
- **Upgrade, downgrade, or pin:** confirm the resolved version, choose the smallest suitable target, apply migrations, and investigate unrelated churn.
- **Remove:** remove all code, configuration, scripts, types, patches, CI, deployment, and documentation usage before uninstalling; check whether the package remains transitive.
- **Replace:** perform an evaluated addition plus a verified removal, preserving behavior with tests.
- **Transitive vulnerability:** prefer upgrading the owning direct dependency; use an override only with compatibility evidence, rationale, and a removal condition.

### 5. Verify

Review the manifest and lockfile diff immediately. Confirm that all resolved versions, registries, integrity data, peer choices, optional packages, lifecycle scripts, native artifacts, and transitive changes are expected. Reject credentials, local paths, machine-specific metadata, package-manager changes, and unjustified duplicate versions.

Run the strongest relevant checks available:

1. Manifest and lockfile validation.
2. Resolved dependency-tree inspection.
3. Frozen or locked install in a clean environment when practical.
4. Focused tests, then applicable type checks, linting, broader tests, build, and packaging checks.
5. Supported runtime or platform checks, locally or in CI.
6. Advisory checks with applicability and reachability triage.
7. Footprint checks when material.
8. Final diff and version-control status review.

Do not weaken tests or configuration to make the change pass. State skipped checks and residual risk precisely.

### 6. Report

Lead with the outcome: added, changed, removed, rejected, or deferred. Include before/after constraints and resolved versions, rationale, material risk findings, affected files and dependency graph, validation results, dated authoritative sources, unresolved risks, and required follow-up.

Never describe an unresolved warning as fixed or confuse a manifest constraint with the version resolved in the lockfile.
