# Dependency Evaluation Framework

Use this framework for a concise, evidence-backed decision. Scale the depth to the dependency's privilege, exposure, and replacement cost.

## Contents

- [Evidence hierarchy](#evidence-hierarchy)
- [Risk-tier the review](#risk-tier-the-review)
- [Candidate matrix](#candidate-matrix)
- [Evaluation questions](#evaluation-questions)
- [Decision record](#decision-record)

## Evidence hierarchy

Prefer evidence in this order:

1. Canonical license text, package registry record, signed/provenance metadata, upstream source, official documentation, release notes, and security policy
2. Ecosystem or government-backed advisories such as GHSA, OSV, RustSec, Go vulnerability data, or NVD
3. Reproducible inspection of the published artifact and dependency graph
4. Independent technical analysis with a disclosed method
5. Popularity metrics, community anecdotes, or search snippets

Cross-check identity between the registry artifact, source repository, tag, release, and publisher. Record the access date because registry ownership, advisories, and maintenance status change.

Do not infer safety from popularity, a badge, a clean automated score, absence from one advisory database, or a repository's existence.

## Risk-tier the review

### High scrutiny

Apply the deepest review when a package:

- handles secrets, authentication, authorization, cryptography, parsing of untrusted data, serialization, sanitization, network requests, file paths, or code execution;
- runs during install/build with developer or CI privileges;
- ships native binaries, downloads executables, loads plugins, or generates code;
- is bundled into a public client, runs in production, or becomes part of a published library's public API;
- has broad transitive dependencies, frequent ownership changes, unclear provenance, or difficult rollback.

Inspect the published artifact, lifecycle scripts, native/download behavior, security policy, advisory history, and maintainership. Require a credible reason to accept residual risk.

### Normal scrutiny

Use the full comparison matrix for ordinary runtime dependencies and material build tools.

### Lightweight scrutiny

For a well-known existing development dependency receiving a compatible patch update, confirm identity, release notes, advisories, compatibility, and focused validation. Do not repeat an exhaustive market survey without a risk signal.

## Candidate matrix

Use a table like this when the dependency choice is open:

| Criterion | Candidate A | Candidate B | Local/native option |
| --- | --- | --- | --- |
| Required capability | | | |
| Maintenance/provenance | | | |
| Runtime/platform compatibility | | | |
| License | | | |
| Applicable advisories | | | |
| Lifecycle/native behavior | | | |
| Direct/transitive footprint | | | |
| API/types/migration risk | | | |
| Operational cost and rollback | | | |
| Unknowns | | | |

Avoid fake numeric precision. Use explicit observations, risk level, and evidence. Weight criteria by the repository's actual context.

## Evaluation questions

### Need and fit

- What exact behavior is required?
- Is the capability already available in the supported platform or a direct dependency?
- Would a local implementation remain genuinely small after edge cases, tests, types, and maintenance are included?
- Does the dependency solve substantially more than required?
- Will its API escape into public interfaces and make replacement expensive?

### Identity and provenance

- Is the package name exact and resistant to typosquatting confusion?
- Does the registry publisher match the upstream project or documented release process?
- Do version, tag, commit, changelog, and published artifact correspond?
- Has ownership, namespace, signing, provenance, or publication behavior changed recently?
- Are source and build outputs inspectable? Are unexpected files or minified blobs shipped?

### Maintenance and governance

- Is the project active enough for the supported runtime and current threat landscape?
- Are releases explained and reproducible enough to review?
- Are relevant issues and security reports handled?
- Is the project archived, deprecated, seeking maintainers, or dependent on one unpublished process?
- Is low release frequency a sign of stability or abandonment? Use issue/security/runtime evidence to decide.

### Compatibility and API

- Does the package support every runtime, framework, OS, architecture, module format, and package-manager version the repository promises?
- Are peer constraints satisfiable without force?
- Are types bundled and accurate for the selected version?
- Are cancellation, timeouts, errors, resource cleanup, and concurrency semantics suitable?
- Is the needed API stable and documented? Are breaking changes or deprecations common?
- Can the dependency be wrapped behind a narrow local boundary?

### License

- What does the canonical license file say for the exact version?
- Does registry metadata disagree with the repository or distributed artifact?
- Are bundled assets, data, fonts, models, binaries, or subcomponents under different terms?
- Are notice, attribution, source-disclosure, patent, network-use, or redistribution obligations compatible with the project?

Do not provide a legal conclusion beyond the evidence. Escalate unclear or policy-sensitive licensing to the appropriate owner.

### Security and supply chain

- Which advisories affect the exact resolved version, and is the vulnerable behavior reachable in this repository?
- Are fixes available, and what migration cost do they carry?
- Does installation run scripts, compile native code, download binaries, access the network, or depend on environment secrets?
- How many new transitive maintainers, packages, and privileged build steps enter the trust boundary?
- Does the package evaluate strings, spawn processes, deserialize untrusted data, traverse paths, or make network requests?
- Is there a security policy and a credible response history?

Absence of a known advisory means "none found in the checked sources," not "vulnerability-free."

### Footprint and operations

- Compare packed/install size, runtime imports, transitive count, duplicate versions, bundle or binary delta, and startup/runtime cost where material.
- Does tree-shaking work in the repository's real bundler and module mode?
- Are optional dependencies actually optional on supported targets?
- Will the package affect cold starts, memory, browser compatibility, container size, or deployment caching?
- Is rollback simple and is the data/config format reversible?

Measure in the target repository when practical; third-party size sites and synthetic benchmarks are only directional.

## Decision record

Record:

- context and required capability;
- chosen option and alternatives considered;
- verified facts with sources and access date;
- inferences and assumptions;
- unknowns;
- accepted risks and mitigations;
- target version/range;
- rollback or removal condition.

Keep the record proportional. A short final summary is sufficient for a routine patch; a security-sensitive new runtime dependency needs more evidence.
