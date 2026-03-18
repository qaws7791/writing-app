---
name: code-tidying
description: >
  Apply this skill whenever the user wants to improve, clean up, refactor, or restructure existing code
  without changing its behavior. Triggers include: "refactor this", "clean up this code", "this code is
  messy", "make this more readable", "improve code quality", "reduce duplication", "simplify this",
  "this function is too long", "how do I improve this?", "legacy code", "technical debt", "code smell",
  or any request to make code better without adding new features. Also trigger when the user pastes code
  and implicitly expects improvement suggestions. Use proactively if you notice structural problems while
  helping with something else.
---

# Code Tidying

A practical guide for improving code structure, readability, and maintainability — grounded in widely accepted software engineering best practices.

---

## Core Philosophy

**Separate structural changes from behavioral changes.** Never mix refactoring with feature work in the same change. This keeps diffs reviewable, rollbacks safe, and reasoning clear.

**Prioritize readability.** Code is read far more than it is written. Optimize for the next reader — which is usually the author, six months later.

**Small, safe steps.** Each tidy should be independently verifiable. Prefer many small commits over one large restructure.

---

## When to Tidy

Tidy **before** adding a feature if the current structure makes the feature hard to place.  
Tidy **after** adding a feature if you now see a better structure.  
Tidy as **its own commit** — never bundle tidying with logic changes.

Ask: _"Is this a structural change or a behavioral change?"_ If both, split them.

---

## Diagnosing Code Problems

Before touching code, identify what's actually wrong. Common signals:

| Smell                   | Symptom                                      | Typical Fix                |
| ----------------------- | -------------------------------------------- | -------------------------- |
| Long function           | > ~20 lines, hard to name                    | Extract sub-functions      |
| Mystery name            | Variable/function name doesn't reveal intent | Rename                     |
| Deep nesting            | > 2–3 levels of indent                       | Guard clauses, extract     |
| Long parameter list     | > 3–4 params                                 | Introduce parameter object |
| Duplicated logic        | Same logic in 2+ places                      | Extract and unify          |
| Dead code               | Unreachable or unused                        | Delete it                  |
| Comment explains _what_ | Comment restates code                        | Remove; rename instead     |
| Comment explains _why_  | Explains non-obvious decision                | Keep it                    |
| God object/function     | Does too many unrelated things               | Split by responsibility    |
| Feature envy            | Function uses another object's data heavily  | Move closer to data        |
| Primitive obsession     | Strings/ints standing in for concepts        | Introduce types/classes    |
| Conditional complexity  | Long if/else chains, type checks             | Polymorphism, lookup       |

---

## Tidying Catalog

### 1. Rename for Intent

Names should reveal _purpose_, not _implementation_.

```ts
// Before
const d = new Date()
const x = users.filter((u) => u.a)

// After
const today = new Date()
const activeUsers = users.filter((u) => u.isActive)
```

Rules:

- Functions: verb + noun (`calculateTotal`, `fetchUser`)
- Booleans: `is/has/can/should` prefix
- Avoid abbreviations unless domain-standard
- Rename when you understand something new — don't wait

---

### 2. Extract Function

If a block of code needs a comment to explain it, it should be a function.

```ts
// Before
function processOrder(order: Order) {
  // validate
  if (!order.items.length) throw new Error("Empty order")
  if (!order.customerId) throw new Error("No customer")

  // calculate total
  const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0)
  const tax = subtotal * 0.1
  const total = subtotal + tax

  // save
  db.save({ ...order, total })
}

// After
function processOrder(order: Order) {
  validateOrder(order)
  const total = calculateOrderTotal(order.items)
  db.save({ ...order, total })
}

function validateOrder(order: Order) {
  if (!order.items.length) throw new Error("Empty order")
  if (!order.customerId) throw new Error("No customer")
}

function calculateOrderTotal(items: Item[]): number {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  return subtotal * 1.1
}
```

**Function size guideline:** If a function can't be read on one screen, or if you can extract a piece with a better name, extract it.

---

### 3. Guard Clauses (Early Return)

Eliminate else by returning early on failure conditions.

```ts
// Before
function getDiscount(user: User): number {
  if (user.isActive) {
    if (user.isPremium) {
      return 0.2
    } else {
      return 0.05
    }
  } else {
    return 0
  }
}

// After
function getDiscount(user: User): number {
  if (!user.isActive) return 0
  if (user.isPremium) return 0.2
  return 0.05
}
```

Rule: Handle edge cases and errors first. The "happy path" goes last.

---

### 4. Replace Temp with Query

Temporary variables that are computed once can often become a function call, increasing reusability and removing mutation risk.

```ts
// Before
const basePrice = item.qty * item.price
const discount = basePrice > 1000 ? basePrice * 0.1 : 0
const finalPrice = basePrice - discount

// After
function basePrice(item: Item) {
  return item.qty * item.price
}
function discount(item: Item) {
  return basePrice(item) > 1000 ? basePrice(item) * 0.1 : 0
}
function finalPrice(item: Item) {
  return basePrice(item) - discount(item)
}
```

---

### 5. Introduce Parameter Object

When multiple parameters always travel together, group them.

```ts
// Before
function createReport(startDate: Date, endDate: Date, userId: string) { ... }

// After
interface ReportParams { startDate: Date; endDate: Date; userId: string; }
function createReport(params: ReportParams) { ... }
```

---

### 6. Decompose Conditional

Complex conditionals deserve named functions.

```ts
// Before
if (order.date < SUMMER_START || order.date > SUMMER_END) { ... }

// After
if (isOutsideSummerPeriod(order.date)) { ... }
function isOutsideSummerPeriod(date: Date): boolean {
  return date < SUMMER_START || date > SUMMER_END;
}
```

---

### 7. Replace Conditional with Polymorphism / Lookup

Repeated switch/if-type-checks signal missing abstraction.

```ts
// Before
function getSpeed(animal: Animal): number {
  switch (animal.type) {
    case "cat":
      return 30
    case "dog":
      return 48
    case "cheetah":
      return 112
  }
}

// After
const SPEEDS: Record<AnimalType, number> = {
  cat: 30,
  dog: 48,
  cheetah: 112,
}
function getSpeed(animal: Animal): number {
  return SPEEDS[animal.type]
}
```

Or use subclasses/strategy pattern when behavior (not just data) differs per type.

---

### 8. Delete Dead Code

Dead code is a liability. It confuses readers and gets maintained by accident.

- Delete unreachable branches
- Delete unused variables, parameters, functions, exports
- Delete commented-out code (it's in git history)
- Delete TODO comments older than a sprint (or file an issue)

---

### 9. Normalize Symmetries

Inconsistent styles create cognitive friction. If two things do the same thing, make them look the same.

- Use consistent patterns for error handling
- Use consistent async style (all async/await or all .then chains)
- Use consistent naming conventions throughout a module

---

### 10. Introduce Explaining Variable

When an expression is complex, assign it to a well-named variable.

```ts
// Before
if (platform === 'win32' && (arch === 'x64' || arch === 'ia32')) { ... }

// After
const isWindows = platform === 'win32';
const isSupportedArch = arch === 'x64' || arch === 'ia32';
if (isWindows && isSupportedArch) { ... }
```

---

## Working with Legacy Code

Legacy code is code without sufficient tests. The challenge: you can't safely change code you don't understand, and you can't understand it without changing it.

### The Safe Refactoring Loop

1. **Identify a seam** — a point where you can change behavior without editing the call site (injection point, interface, function boundary)
2. **Write a characterization test** — a test that captures current behavior, even if the behavior is wrong. Goal: detect regressions.
3. **Make the smallest structural change** that improves understandability
4. **Verify the characterization test still passes**
5. Repeat

### Practical Techniques

**Sprout function/class:** When you must add new behavior to messy code, write it in a new function and call it from the original rather than editing the original.

**Wrap the mess:** Introduce a thin wrapper around a problematic function/class. Keep the wrapper clean. Gradually move logic into the wrapper.

**Break the dependency:** Inject dependencies instead of hardcoding them. This creates seams for testing.

```ts
// Before — untestable
function sendNotification(userId: string) {
  const user = db.find(userId) // global dependency
  mailer.send(user.email, "Hi") // global dependency
}

// After — testable
function sendNotification(
  userId: string,
  findUser: (id: string) => User,
  sendEmail: (to: string, body: string) => void
) {
  const user = findUser(userId)
  sendEmail(user.email, "Hi")
}
```

**Don't clean everything at once.** Apply the Boy Scout Rule: leave the code slightly better than you found it. Incremental improvement compounds.

---

## Process Rules

### Before You Start

- [ ] Can you describe what the code does without reading it line by line? If not, read first.
- [ ] Are there tests? If not, write characterization tests before refactoring.
- [ ] What specifically is wrong? Name the smell. Have a target.

### During Tidying

- [ ] One mechanical change at a time (rename → verify, extract → verify)
- [ ] No behavioral changes while tidying
- [ ] Commit each logical step separately
- [ ] Run tests between each step

### After Tidying

- [ ] Does the code read more clearly?
- [ ] Could you explain it to a colleague without hand-waving?
- [ ] Did you introduce any new complexity?

---

## Deciding What to Tidy

Not all code is worth the same attention. Focus energy on:

- **High-churn files** — code changed frequently is worth keeping clean
- **Hard-to-understand code** — confusion compounds; clarity pays dividends
- **Code you're about to modify** — tidy the path before you walk it

Deprioritize:

- Code that is never modified
- Code that's about to be deleted
- Code in isolated modules with narrow scope

---

## Communicating Tidying to the User

When suggesting tidying steps:

1. **Name the smell** — say what the problem is, not just how to fix it
2. **Show before/after** — concrete code examples, not just descriptions
3. **Explain the benefit** — why does this matter?
4. **Order by impact** — lead with the change that makes the biggest readability improvement
5. **Flag risk** — if a refactor touches a hot path or has no test coverage, say so

When the user provides code:

- Scan for the 2–3 most impactful issues first
- Don't try to fix everything — focus on what matters
- If behavior is ambiguous, ask before renaming semantically important symbols
- If there are no tests, recommend adding characterization tests before structural changes
