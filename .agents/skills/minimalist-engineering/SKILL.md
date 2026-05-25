---
name: minimalist-engineering
description: A general-purpose engineering skill for making decisions from a "minimalism" perspective across software design, implementation, and refactoring. It applies in every situation where you must decide how to identify and reduce complexity, when to abstract and when to hold back, where to draw boundaries, and what to build now versus postpone. Specifically, use it when designing new modules/services/components, refactoring existing code, making architectural decisions, choosing libraries/frameworks, designing APIs/interfaces, reviewing code, answering questions like “Is there a simpler way to do this?”, discussing technical debt, and evaluating YAGNI/DRY/abstraction tradeoffs. Even if the user does not explicitly use terms like “minimalism,” “simple,” “simplicity,” “complexity,” “refactoring,” “overengineering,” “excessive design,” “bad abstraction,” or “YAGNI,” apply this skill whenever the context involves design decisions.
---

# Minimalist Engineering

## Perspective of This Skill

Minimalist engineering is **not about "putting in fewer features" or "writing shorter code."** That is surface-level minimalism, and it often leads in the wrong direction.

The minimalism this skill speaks of is the following attitude:

- Accept the **essential complexity** that must be solved, but remove the **accidental complexity** we have introduced.
- Solve the problem you **understand right now** by the shortest path, and leave it **easy to change later**.
- The value of a system lies not in its feature list, but in its **understandability, modifiability, and operability**.
- Simplicity is **not an aesthetic** but an **engineering property** that makes people able to trust and modify code.

This perspective compresses design attitudes that have independently converged over a long period in very disparate fields—operating systems, language design, distributed systems, frontend frameworks, embedded systems, databases, cryptographic software, game engines, and more. It applies regardless of language, framework, or domain.

---

## Core Principles

The principles below are not independent of one another. They are multiple angles of the same attitude, and in practice they work together.

### 1. Distinguish complexity into two kinds

Do not try to remove all complexity. There are two kinds:

- **Essential complexity**: The unavoidable difficulty inherent in the problem itself. Distributed consensus, concurrency, domain rules, security threat models, etc. Hiding this makes the system worse.
- **Accidental complexity**: Complexity **we have introduced** through tools, structure, dependencies, wrong abstractions, unnecessary generalization, fashionable pattern abuse, etc. This is what must be removed.

Before every design decision, always ask first: **"Does this complexity come from the problem, or did I bring it in?"** What can be removed is the latter.

### 2. Do not confuse "simple" with "easy"

- **Easy** is what is familiar to me right now, what is convenient to use immediately. It changes with context.
- **Simple** is a state with few entanglements, responsibilities converging to one, and the ability to reason about, change, and replace independently. It is an objective property.

Easy choices sometimes coincide with simple ones, but **easy yet entangling choices** are the most common trap. Introducing global state, implicit dependencies, convenience macros, or omnipotent utilities to finish quickly now permanently increases the system's coupling.

Criterion for judgment: Does it minimize the cost for the person who tries to understand and change this code **six months from now**, rather than my convenience today?

### 3. Reduce hidden state, hidden dependencies, and hidden control flow (local reasoning)

Good code must allow you to know what is happening **by looking at that piece alone**. This is called **local reasoning**.

Things that destroy local reasoning:

- Global variables, implicit singletons, thread-locals
- Shared state that is quietly mutated from the outside
- Functions whose side effects cannot be known from their names alone
- Metaprogramming, excessive reflection, and magic auto-injection that disturb control flow from afar
- Structures where the meaning of a single argument depends on a distant configuration file

Guideline: Make it possible to explain the behavior of a function or module solely from its inputs and observable outputs. If state is needed, reveal that it exists, contain it at the boundary, and narrow the points of mutation.

### 4. Build what is needed now; do not speculate about the future

Do not pre-insert settings, options, hooks, or abstraction layers "just in case they might be needed someday." There are three reasons:

1. Most predictions are wrong. When actual requirements arrive, they rarely fit the structure you laid down in advance.
2. Unused structures must still be read, tested, and maintained. **The cost is real; the value is imaginary.**
3. Once a structure is planted in advance, it **blocks the discovery of a better solution** when actual requirements arrive.

Instead: Solve today's requirements as honestly as possible. When a second case arrives, look at both cases then. When a third arrives, only then does a pattern become visible. Abstract **after** that.

One exception: Decisions where **the cost of change will become extreme later** (signatures of public APIs, core keys in database schemas, file formats, etc.) are examined carefully from the start. Inner implementations can be changed, but boundaries are promises.

### 5. Abstract only after repetition is revealed

A wrong abstraction is far more expensive than duplication. Duplication is visible and local, but a wrong abstraction is entangled at every call site, making its removal cost non-linear.

Guidelines:

- Even if commonality is visible at the second occurrence, do not abstract immediately. First verify whether **two things that look the same are actually the same concept**.
- Extract common structure after the third occurrence. Even then, extract only the **minimal form** that accommodates the current three cases.
- When an abstraction starts to diverge from reality, **do not hesitate to break it.** The biggest trap is extending a wrong abstraction by piling on variant flags and exception branches.
- The name of an abstraction must come from **the concept it contains.** A name born from "a place where common logic is gathered" will eventually swell by absorbing every change.

Key question: "Does this abstraction reduce duplication, or does it create a **single point of representation for knowledge**?" Only the latter has value.

### 6. Interfaces narrow, modules deep

A good module **hides a great deal of complexity behind a narrow interface.** Conversely, a shallow module (one that is nearly empty inside yet demands many concepts from the outside) only increases the cost paid by callers and contributes no simplicity to the system.

Criteria for judgment:

- The number of concepts a caller must learn to use this module vs. the amount of complexity this module handles on the caller's behalf. The latter must be far greater.
- A widening interface is usually a signal that the **boundary is drawn wrongly.** Re-examine the division of responsibilities.
- If parameters multiply, options multiply, and rules like "in this case, use it this way" multiply, the interface is wrong. A natural shape that works with a single default comes first.

Rather than piling up dozens of small utilities, **one properly separated boundary** creates far greater simplicity.

### 7. Speak through messages, contracts, and boundaries

The value of a module lies not in its **internal fields or class hierarchy**, but in **how it responds to which requests.** This perspective holds regardless of language or paradigm.

Practical guidelines:

- Do not directly manipulate another module's internal state. Assume the inside can change at any time.
- What is exchanged between modules must be **messages, events, commands, or data with clear names.** The more concrete the name, the healthier the boundary.
- A contract includes **signatures, exception rules, and semantics.** "What does this function do when it fails, what are its side effects, when is it safe to call" are all part of the contract.
- Encapsulation is not "keeping fields private"; it means **making the outside not need to know the inside.** A structure where the inside leaks out through getters and setters is not encapsulation.

### 8. Prefer composable small units

Rather than one large integrated system, **multiple units with narrow responsibilities and clear boundaries** survive longer and are verified more easily.

This principle applies at three levels:

- **Function level**: Functions that do one thing. Shape inputs and outputs into composable forms like text, data, and streams.
- **Module level**: Modules responsible for one concept. They communicate with neighboring modules through **common formats**.
- **System level**: Processes, services, or programs with clear roles. They conform to standard input/output, standard protocols, and standard data formats.

The key to composability is **standardized boundaries.** If each unit insists on its own protocol, composition becomes impossible. Following a common format is not a loss of freedom but a gain of freedom to connect with other tools.

### 9. Performance and responsiveness are part of design, not UX

When a system is slow, the user's train of thought is interrupted regardless of its feature list. In editors, tools, and interactive UIs, latency itself determines product quality.

This principle is minimalist because slowness is usually a **symptom of accidental complexity.** Excessive layers of indirection, unnecessary network round-trips, hasty abstractions, unpredictably accumulated dependencies, unexpected resource allocation. Looking at performance is ultimately looking at structure.

Practical guidelines:

- Do not use "we will optimize later" to justify decisions that obscure structure. Performance characteristics are often the result of structure.
- Keep resource usage (allocation, system calls, synchronization) of hot paths **in visible places.** Invisible resources cannot be controlled.
- Do not guess without benchmarking. At the same time, structural waste can be judged before benchmarking.

### 10. Reliability comes from "explainable state"

You must be able to **explain why the system can be trusted.** This is the most practical definition of minimalism.

Things that increase explainability:

- Boundaries are clear, and each part is independently understandable.
- Error paths are designed as explicitly as normal paths. Instead of assuming "that case will not happen," write what will happen when it does.
- Internal state is observable. Logs, metrics, and reproduction methods are prepared.
- External dependencies are few, and the existing ones are explained as to why they are needed.
- Failure, termination, and restart are handled as **normal behavior**, not special cases, but as part of the normal lifecycle.

What cannot be explained eventually relies on **someone's belief.** That part grows more dangerous over time.

### 11. Sustainability is the balance between compatibility and changeability

Code is written while it is used, and it changes while it is used. A sustainable system keeps both:

- **Outer promises are kept for a long time.** Public APIs, file formats, and protocols are not changed lightly. If necessary, design parallel operation and gradual migration.
- **Inner structure is kept changeable.** If the inside leaks to the outside, both become impossible.

When this distinction collapses, two common failures occur: the inside becomes unchangeable and workarounds accumulate, or the outer promise is quietly broken and user systems break. Deciding what is outside and what is inside is **the earliest and most important design decision.**

---

## Checklist for Practical Judgment

Ask these during design, implementation, and review. You do not need to answer every question, but **"I don't know" is an opportunity to make the design simpler.**

### Before creating a new feature or module

- What is the **simplest form** of what is required right now? Among what is not required now, is there anything I am trying to plant?
- Can this problem be solved by **composing existing parts**? Have you checked before adding a new concept?
- How many new concepts must the person using this feature learn? Does it return value commensurate with that number?
- What are the **decisions that can be eliminated?** Doing a choice on behalf of the user that they do not have to make can be more valuable than adding a feature.

### When trying to add an abstraction

- Does this abstraction come from **actual repeated cases**, or from cases I imagined in advance?
- Are the things that look common **the same concept**, or do they merely look similar by chance?
- If this abstraction turns out to be wrong, **how can it be rolled back?** If it is easy to roll back, it is okay to introduce; if difficult, wait longer.
- Does this abstraction reduce the caller's **cognitive load**, or increase it?

### When drawing boundaries

- What kinds of information cross the boundary, and how much? If there is a lot, the **boundary is drawn wrongly.**
- If one side changes, how much does the other side change? If it changes a lot, the two sides are in fact one.
- If the implementation behind the boundary is completely replaced, **does the outside still run with the same code?** If so, the boundary is healthy.

### During code review and refactoring

- Can a person **seeing this code for the first time** understand what is happening without context?
- Can what the comment explains be moved into **code structure?** (A comment saying "you must do this first" is usually text moved from what the structure should enforce.)
- Is a function large because of actual logic, or because it holds **multiple responsibilities**?
- If this module were deleted, would it be easy to delete? If not, is that difficulty **justified**, or is it due to entanglements we created?
- Is there code that, if removed, does not break tests? If so, **that code must explain its reason for existence.**

### When adding tools, libraries, or dependencies

- What is the **essential problem** this dependency solves? How many lines would it be if we handled it ourselves?
- What does this dependency **drag in with it?** Transitive dependencies, build tools, runtime requirements, responsibility for security updates.
- If this dependency disappears (abandoned, compatibility broken, policy changed), **what does our system lose?**
- Have we arranged our code so that this dependency can be **replaced**, or is it tightly coupled?

---

## Common Misconceptions and Rebuttals

### Misconception 1. "Minimalism = reducing features"

Minimalism is **not feature removal but accidental complexity removal.** Claiming to have become "simpler" by removing what users want is not minimalism but reduction. Good simplification provides the same functionality with **fewer concepts.**

### Misconception 2. "Shorter code is simpler"

Short code can be more obscure. The criterion for simplicity is **not character count but cost of understanding and change.** If it is well decomposed and clearly named, it is simple even if long. If everything is crammed into one line, it is complex even if short.

### Misconception 3. "More abstractions mean more flexibility"

The opposite is far more common. Abstractions create flexibility only on top of **verified repetition.** An abstraction born from assumption becomes not flexibility but **structure hardened at the wrong points.** Flexibility comes not from the quantity of abstraction but from the **arrangement of changeable structure.**

### Misconception 4. "Finish quickly now and clean up later"

Later usually does not come. More importantly, **what becomes entangled now compounds in cost later.** Destroying local reasoning to finish quickly now raises the cost of every future change. However, deliberately taking on debt with **low interest** can be justified. In that case, the debt is **recorded and repaid.**

### Misconception 5. "Simplicity is for beginners"

Simple structure is rather a **result of proficiency.** Complex structure is easily made. Simple structure is revealed only after understanding the essence of the problem. Proficiency is not knowing more techniques, but **the ability to judge which techniques not to use.**

### Misconception 6. "Following fashionable patterns is safe"

Patterns are summaries of solved problems, not **universal directives.** The same pattern can have the opposite effect in a different context. Before applying a pattern, first ask **whether the problem it solves exists for me now.** Applying a pattern where there is no problem to solve only increases complexity.

---

## Attitude in Applying This Skill

- **Do not apply dogmatically.** The principles above can be in tension with one another. For example, "only what is needed now" and "outer promises last long" can clash in boundary design. Resolving this tension is design. Do not push either side as an absolute rule.
- **Look at context.** Many principles are excessive for short-lived scripts, one-off prototypes, or exploratory analysis code. They are rather insufficient for long-running infrastructure cores, public APIs, or modules shared by many people. Apply the principles **in proportion to the code's lifespan, impact, and sharedness.**
- **Leave reasons.** When making a design decision based on this skill, concisely leave **why this choice rather than a simpler alternative.** Someone in the future (or your future self) must be able to resolve that tension again.
- **See simplicity as a result, not a goal.** Code that is simple from the start is rare. You understand the problem, make it complex once, discover the essence, and only then does it become simple. **"It is still complex" is often a signal that the problem is not yet fully understood.**

---

## In One Sentence

> **Accept essential complexity and remove accidental complexity. Build only what is needed now, but leave it changeable for later. What cannot be explained is not simple.**
