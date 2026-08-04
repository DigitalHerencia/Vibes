---
title: "ADR-0005: Clerk Identity Boundary"
status: "Accepted"
date: "2026-08-03"
authors: "Repository maintainers"
tags: ["architecture", "identity", "clerk"]
supersedes: ""
superseded_by: ""
---

# ADR-0005: Clerk Identity Boundary

## Status

Accepted

## Context

The application needs provider-backed identity without delegating product authorization or tenancy.

## Decision

Clerk proves identity and owns user-facing authentication/account flows. Prisma owns local application identity and product state. Clerk Organizations and metadata are not canonical for tenant membership, roles, billing, or workflow state.

## Consequences

### Positive

- **POS-001**: Authentication UX stays provider-supported.
- **POS-002**: Product authorization remains local and testable.

### Negative

- **NEG-001**: Webhook and on-demand synchronization need idempotent recovery.
- **NEG-002**: Provider and local identity outages have separate failure modes.

## Alternatives Considered

### Clerk Organizations as tenancy

- **ALT-001**: **Description**: Use provider organizations and metadata as application authority.
- **ALT-002**: **Rejection Reason**: It couples product state and authorization to provider structures.

## Implementation Notes

- **IMP-001**: `/api/clerk/webhooks` is the canonical identity event ingress.
- **IMP-002**: Live provider configuration requires separate verification.

## References

- **REF-001**: ADR-0003 and ADR-0006.
