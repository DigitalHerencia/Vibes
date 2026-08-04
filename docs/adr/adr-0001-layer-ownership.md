---
title: "ADR-0001: Layer Ownership"
status: "Accepted"
date: "2026-08-03"
authors: "Repository maintainers"
tags: ["architecture", "boundaries"]
supersedes: ""
superseded_by: ""
---

# ADR-0001: Layer Ownership

## Status

Accepted

## Context

App Router projects become difficult to secure and change when routes, rendering, authorization, persistence, and provider semantics share ownership.

## Decision

Routes adapt requests and rendering. Features orchestrate use cases. Components render typed contracts. Fetchers read. Actions expose writes. Workflows coordinate use cases. Authorization decides. Transactions preserve atomic invariants. Integrations isolate providers. Webhooks reconcile external truth.

## Consequences

### Positive

- **POS-001**: Dependency direction is predictable and mechanically testable.
- **POS-002**: Security-sensitive behavior has explicit owners.

### Negative

- **NEG-001**: Small changes may cross several narrow files.
- **NEG-002**: Boundary maintenance requires contract tests.

## Alternatives Considered

### Route-owned vertical slices

- **ALT-001**: **Description**: Let each route own data, mutations, and rendering.
- **ALT-002**: **Rejection Reason**: It duplicates policy and leaks infrastructure into presentation.

## Implementation Notes

- **IMP-001**: `architecture-boundaries.yml` is the machine-readable companion.
- **IMP-002**: This decision does not claim every current file already conforms.

## References

- **REF-001**: Canonical architecture governance document.
