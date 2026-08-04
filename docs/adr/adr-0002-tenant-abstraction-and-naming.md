---
title: "ADR-0002: Tenant Abstraction and Naming"
status: "Accepted"
date: "2026-08-03"
authors: "Repository maintainers"
tags: ["architecture", "tenancy"]
supersedes: ""
superseded_by: ""
---

# ADR-0002: Tenant Abstraction and Naming

## Status

Accepted

## Context

A reusable B2B system needs a stable isolation and billing boundary without forcing one product noun on generated applications.

## Decision

Tenant is the architectural abstraction. The reference implementation uses `Organization` unless a product-specific ADR selects another name. `Project` remains a removable sample domain and is never the hidden tenant or billing boundary.

## Consequences

### Positive

- **POS-001**: Isolation semantics remain stable across product vocabulary.
- **POS-002**: Generated products can rename coherently through an explicit reset.

### Negative

- **NEG-001**: The current sample schema does not yet implement this tenant model.
- **NEG-002**: Renaming requires coordinated schema, code, docs, and test changes.

## Alternatives Considered

### Treat Project as tenant

- **ALT-001**: **Description**: Reuse the sample `Project` membership boundary as tenancy.
- **ALT-002**: **Rejection Reason**: It couples infrastructure to a removable domain example.

## Implementation Notes

- **IMP-001**: Contracts must label the current missing tenant implementation as a gap.
- **IMP-002**: A later issue owns tenant schema and migration work.

## References

- **REF-001**: ADR-0003 and ADR-0004.
