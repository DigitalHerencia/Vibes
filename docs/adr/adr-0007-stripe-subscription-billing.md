---
title: "ADR-0007: Stripe Subscription Billing"
status: "Accepted"
date: "2026-08-03"
authors: "Repository maintainers"
tags: ["architecture", "billing", "stripe"]
supersedes: ""
superseded_by: ""
---

# ADR-0007: Stripe Subscription Billing

## Status

Accepted

## Context

Subscription authority must align with the tenant boundary and cannot be inferred from browser redirects or live provider reads on every request.

## Decision

Subscription billing belongs to the tenant. Checkout and Portal require `billing.manage`. Tenant, customer, price, and return URLs are server-derived or allowlisted. Provider mutations use stable idempotency keys; verified webhooks normalize local entitlement state used by authorization.

## Consequences

### Positive

- **POS-001**: Entitlement checks are local, deterministic, and tenant-scoped.
- **POS-002**: Redirect manipulation cannot grant product access.

### Negative

- **NEG-001**: Webhook lag and reconciliation need explicit product behavior.
- **NEG-002**: Live product, price, portal, webhook, and authenticated-journey configuration remains an owner-operated deployment concern.

## Alternatives Considered

### User-owned subscriptions

- **ALT-001**: **Description**: Attach subscription state to an individual identity.
- **ALT-002**: **Rejection Reason**: It conflicts with B2B tenant ownership and membership changes.

## Implementation Notes

- **IMP-001**: Provider identifiers never come from client authority.
- **IMP-002**: Checkout success pages grant no entitlement.
- **IMP-003**: The reusable foundation supports one recurring price and local `core` entitlement.
- **IMP-004**: Reconciliation reports drift and does not mutate either side.

## References

- **REF-001**: ADR-0002, ADR-0003, and ADR-0006.
