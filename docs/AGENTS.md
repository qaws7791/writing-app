# AGENTS.md for /docs

Purpose

- This directory is wiki for the project.
- Document product, planning, design, development, operations, decisions, and lessons learned.
- Write for humans first, but make documents easy for coding agents to update.

Global rules

- Prefer updating an existing note over creating a new one.
- Keep docs aligned with the current codebase and product behavior.
- Be concise, concrete, and specific. Avoid fluff and marketing language.
- Record facts, decisions, rationale, trade-offs, constraints, and open questions.
- If unsure, say so explicitly. Do not present guesses as facts.
- Use Korean unless a file is explicitly intended for another language.
- Use Markdown that renders well in Obsidian.

Directory intent

- README.md: entry point and map of the docs.
- 01-product: Product goals and problem definition
- 02-design: Design system and UI/UX guidelines
- 03-architecture: System architecture and technical documentation
- 04-engineering: Monorepo structure and technical documentation
- 05 ~ 98: Not yet implemented
- 99-archive: Experimental results and replaced documents

Obsidian conventions

- Use wikilinks: [[index]], [[adr/ADR-0001-auth-strategy]].
- Add backlinks to related notes instead of repeating content.
- Prefer one canonical page per topic.
- Use section links when helpful: [[design/system-architecture#runtime flow]].
- Keep titles stable so links do not break often.
- Use tags sparingly and only when they add retrieval value.

File creation rules

- Create a new file only if the topic is distinct, durable, and worth linking to.
- Do not create duplicate notes for the same subject.
- File names should be short, lowercase-kebab-case.

Writing rules

- Always write both the title and description frontmatter in Korean, and never leave them empty.
- use title frontmatter instead of level 1 heading
- Keep code as minimal as possible.

Update rules for agents

- When code changes behavior, update the relevant docs in the same task.
- When adding a feature, update product, design, dev, and ops notes if affected.
- When making a significant technical choice, add or update an ADR.
- When fixing an incident, update the runbook and add a postmortem if needed.
- When renaming or moving files, update affected wikilinks.

Source-of-truth rules

- Code is the source of truth for implementation details.
- Docs are the source of truth for rationale, process, operational knowledge, and cross-cutting context.
- If docs and code conflict, note the conflict and update the docs or create a follow-up task.

What to avoid

- No vague TODO-only pages.
- No duplicate architecture summaries in many files.
- No stale status sections left without dates.
- No large pasted logs unless they are necessary and summarized.
- No secret keys, credentials, or sensitive personal data.

Recommended cross-links

- Every note should link back to [[README]] or its local area index.
- Feature notes should link to related requirements, ADRs, API notes and tests
- ADRs should link to impacted components and superseded ADRs.

Definition of done for documentation

- Discoverable from [[README]]
- Linked to related notes
- Current as of the latest relevant change
- Clear on status: proposed, active, deprecated, or replaced
