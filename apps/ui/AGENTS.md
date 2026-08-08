My Shadcn Registry for modern design system

- Astro Demo Site
- React Component Library

# Monorepo integration

- `apps/ui` owns the Astro documentation site and the complete shadcn registry source.
- The root `package.json` and root `bun.lock` own active workspace dependencies.
- `upstream-bun.lock.snapshot`, `upstream-oxfmtrc.snapshot`, and
  `upstream-package.snapshot` preserve upstream integration inputs.
- A registry source change must keep `packages/shared/ui` coverage synchronized.
- Product apps must not connect registry block fixtures to production data.

# DESIGN

Always read `DESIGN.md` for design and component work.

Load only the additional contract required by the task:

- Registry components, blocks, previews, and component docs: `design/COMPONENTS.md`
- Public APIs, tokens, registry structure, releases, or breaking changes: `design/GOVERNANCE.md`
- Learning paths, lessons, steps, and learning activities: `design/LEARNING.md`
- AI content, provenance, permissions, environments, or high-risk actions: `design/AI_AND_RISK.md`
- Final verification for new components or large changes: `design/QUALITY.md`
- External product or pattern research: `design/REFERENCES.md`
- Component documentation and examples: `DOCS_GUIDELINES.md`

When multiple conditions apply, read all matching documents. Do not load every design document by default.
