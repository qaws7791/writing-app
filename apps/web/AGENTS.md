# Nextjs Frontend Application Guide

Responsibilities:

- route composition
- server/client component composition
- user-facing flows
- server actions
- integration with SDK and UI packages

Rules:

- keep pages and layouts as thin composition layers
- keep interactive browser logic in clearly marked client components
- avoid mixing data loading, interaction, and rendering in one large file
- prefer leaf client components over broad client trees

Command:

- `bun dev` to run the development server. default port is 3000.
