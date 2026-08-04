---
title: "ADR-0003: Local RBAC"
status: "Accepted"
date: "2026-08-03"
authors: "Repository maintainers"
tags: ["architecture", "authorization"]
supersedes: ""
superseded_by: ""
---

# ADR-0003: Local RBAC

## Status

Accepted

## Context

Identity-provider metadata cannot safely own application membership, capabilities, resource state, or workflow legality.

## Decision

Local users and memberships establish access. Roles aggregate stable capabilities. Authorization policies evaluate capabilities plus actual resource and workflow state. UI visibility is never the enforcement boundary.

## Consequences

### Positive

- **POS-001**: Authorization remains provider-independent and auditable.
- **POS-002**: Resource and workflow rules fail closed on server paths.

### Negative

- **NEG-001**: Local identity synchronization and policy tests are required.
- **NEG-002**: Raw role comparisons must be migrated into policy modules.

## Alternatives Considered

### Provider metadata roles

- **ALT-001**: **Description**: Store canonical roles in Clerk metadata.
- **ALT-002**: **Rejection Reason**: Provider metadata lacks local resource and workflow truth.

## Implementation Notes

- **IMP-001**: Current project-row roles are an incomplete sample, not full tenant RBAC.
- **IMP-002**: Capability and policy modules own future expansion.

## References

- **REF-001**: ADR-0002 and ADR-0005.
