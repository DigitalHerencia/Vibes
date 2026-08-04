---
title: "ADR-0009: Presentation Catalog Isolation"
status: "Accepted"
date: "2026-08-03"
authors: "Repository maintainers"
tags: ["architecture", "presentation", "catalog"]
supersedes: ""
superseded_by: ""
---

# ADR-0009: Presentation Catalog Isolation

## Status

Accepted

## Context

Reusable fixtures and presentation recipes are useful development assets but must not silently become public production product routes.

## Decision

Presentation assets follow tokens to primitives to shared/domain components to blocks to feature orchestration to routes. The catalog is isolated from default production routes, contains no protected data/provider access, and includes typed fixtures and registry metadata.

## Consequences

### Positive

- **POS-001**: Reusable visual assets remain testable without expanding product surface.
- **POS-002**: Production routes select intentional product features only.

### Negative

- **NEG-001**: Catalog hosting and discovery need explicit tooling.
- **NEG-002**: Current presentation routes remain exposed until a later implementation issue.

## Alternatives Considered

### Public in-app gallery

- **ALT-001**: **Description**: Keep every presentation example as a compiled public route.
- **ALT-002**: **Rejection Reason**: It expands production surface and blurs examples with product behavior.

## Implementation Notes

- **IMP-001**: This ADR records the target boundary, not current completion.
- **IMP-002**: Catalog isolation must preserve useful fixtures and accessibility contracts.

## References

- **REF-001**: ADR-0001.
