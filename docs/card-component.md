# Card Component

## Change Log

- Started implementing Material Design 3-style Card variants.
- Finished the Card variant API in `@workspace/ui`.
- Switched the default Card variant to `filled`.
- Card now supports `filled` and `outlined`.

## API

```tsx
import { Card } from "@workspace/ui/components/ui/card"

<Card variant="filled" />
<Card variant="outlined" />
```

The default Card variant is `filled`, so `<Card />` and
`<Card variant="filled" />` use the same visual treatment.

## Variants

- `filled`: filled semantic surface with no shadow or outline.
- `outlined`: background surface with a visible border and no shadow.

The `size` prop is unchanged and still supports `default` and `sm`.
