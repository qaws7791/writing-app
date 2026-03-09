---
name: hugeicons-react-best-practices
description: Use when writing, reviewing, or refactoring React or Next.js code that uses `@hugeicons/react` or any Hugeicons icon package. Always apply this skill when you see HugeiconsIcon, @hugeicons/core-free-icons imports, or icon-related component patterns in React/Next.js projects.
---

## Package Structure

Hugeicons splits functionality across two packages — both are required. This project uses only:

- `@hugeicons/react` — the React renderer
- `@hugeicons/core-free-icons` — the icon data

### Basic Usage

```tsx
import { HugeiconsIcon } from "@hugeicons/react"
import { Notification03Icon } from "@hugeicons/core-free-icons"

function App() {
  return (
    <HugeiconsIcon
      icon={Notification03Icon}
      size={24}
      color="currentColor"
      strokeWidth={1.5}
    />
  )
}
```

### HugeiconsIcon Props

| Prop          | Type     | Default          | Description                          |
| ------------- | -------- | ---------------- | ------------------------------------ |
| `icon`        | IconData | required         | Icon to render                       |
| `altIcon`     | IconData | —                | Alternate icon for toggle/state      |
| `showAlt`     | boolean  | `false`          | Renders `altIcon` when `true`        |
| `size`        | number   | `24`             | Size in pixels                       |
| `color`       | string   | `'currentColor'` | CSS color value                      |
| `strokeWidth` | number   | `1.5`            | Stroke weight for stroke-style icons |
| `className`   | string   | —                | Tailwind / CSS Module class          |

---

## Best Practices

### Import only what you need

Wildcard imports break tree-shaking in Webpack, Vite, and Next.js, causing significant bundle bloat.

```tsx
// ✅ Correct — tree-shaking works
import { HugeiconsIcon } from "@hugeicons/react"
import { Notification03Icon } from "@hugeicons/core-free-icons"

// ❌ Never do this — bundle size explodes
import * as Icons from "@hugeicons/core-free-icons"
```

### Handle accessibility by icon role

- **Decorative icons** (paired with visible text): No extra label needed; the surrounding text conveys meaning.
- **Standalone icons** (no visible label): Always add `aria-label` to the parent element.

```tsx
// Decorative — screen reader reads the button text
<button type="button">
  <HugeiconsIcon icon={DownloadIcon} size={18} className="mr-1" />
  Download
</button>

// Standalone — must have aria-label
<button type="button" aria-label="Delete">
  <HugeiconsIcon icon={Delete01Icon} size={18} />
</button>
```

### Use `altIcon` + `showAlt` for state toggles

```tsx
import { ViewIcon, ViewOffSlashIcon } from "@hugeicons-pro/core-stroke-rounded"

export function PasswordToggle() {
  const [visible, setVisible] = useState(false)

  return (
    <button
      type="button"
      onClick={() => setVisible(!visible)}
      aria-label={visible ? "Hide password" : "Show password"}
    >
      <HugeiconsIcon
        icon={ViewIcon}
        altIcon={ViewOffSlashIcon}
        showAlt={visible}
        size={18}
      />
    </button>
  )
}
```

### Naming conventions

- Prefer the short alias (`SearchIcon`) for readability.
- Use the style-qualified name (`SearchStrokeRounded`) only when a single file needs multiple styles of the same icon.
- Group icons by domain (e.g., `icons/navigation.ts`, `icons/forms.ts`) to improve reuse across the codebase.

```tsx
// Both refer to the same icon
import { SearchIcon } from "@hugeicons/core-free-icons"
import { SearchStrokeRounded } from "@hugeicons-pro/core-stroke-rounded"
```
