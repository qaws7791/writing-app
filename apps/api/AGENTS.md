# Hono API application

Responsibilities:

- route definition
- request validation
- auth/authz checks
- use-case orchestration via application layer
- response mapping

Rules:

- keep route, validation, and handler logic close together
- do not place business rules directly in route handlers if they belong in domain or application layers
- keep transport concerns separate from domain logic

Command:

- `bun dev` to run the development server. default port is 3010.
