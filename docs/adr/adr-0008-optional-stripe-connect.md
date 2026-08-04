---
title: "ADR-0008: Optional Stripe Connect"
status: "Accepted"
date: "2026-08-03"
authors: "Repository maintainers"
tags: ["architecture", "payments", "stripe-connect"]
supersedes: ""
superseded_by: ""
---

# ADR-0008: Optional Stripe Connect

## Status

Accepted

## Context

Marketplace-style money movement has different scope, risk, and reconciliation needs from SaaS subscription billing.

## Decision

Stripe Connect is an optional removable integration module, separate from subscription billing. When enabled, every operation retains connected-account scope, explicit amount/currency, stable idempotency, provider mirrors, reconciliation, recovery, and audit records.

## Consequences

### Positive

- **POS-001**: Products without connected-account money movement carry no Connect coupling.
- **POS-002**: Financial scope remains explicit when the module is enabled.

### Negative

- **NEG-001**: Shared billing abstractions cannot hide Connect-specific semantics.
- **NEG-002**: Connect is not currently implemented or live-verified.

## Alternatives Considered

### Unified Stripe module

- **ALT-001**: **Description**: Combine subscriptions and Connect under one billing workflow.
- **ALT-002**: **Rejection Reason**: It obscures ownership, account scope, and removal boundaries.

## Implementation Notes

- **IMP-001**: Enabling Connect requires an approved product specification and provider verification.
- **IMP-002**: No client-trusted account, money, currency, or return URL is allowed.

## References

- **REF-001**: ADR-0006 and ADR-0007.
