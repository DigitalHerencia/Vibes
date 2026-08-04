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

The reference flow uses Stripe-hosted onboarding and Checkout with manual-capture destination charges. The platform creates the charge, transfers the connected account's share, and retains a server-configured application fee. Stripe fees, refunds, and disputes debit the platform. Full refunds reverse both the destination transfer and application fee.

## Consequences

### Positive

- **POS-001**: Products without connected-account money movement carry no Connect coupling.
- **POS-002**: Financial scope remains explicit when the module is enabled.

### Negative

- **NEG-001**: Shared billing abstractions cannot hide Connect-specific semantics.
- **NEG-002**: The optional code reference is implemented, but live Connect capabilities, branding, webhook configuration, liability review, and credentialed journeys are not verified.

## Alternatives Considered

### Unified Stripe module

- **ALT-001**: **Description**: Combine subscriptions and Connect under one billing workflow.
- **ALT-002**: **Rejection Reason**: It obscures ownership, account scope, and removal boundaries.

## Implementation Notes

- **IMP-001**: Enabling Connect requires an approved product specification and provider verification.
- **IMP-002**: No client-trusted account, money, currency, or return URL is allowed.
- **IMP-003**: `pnpm test:connect-removal` must build the core application after removing Connect runtime files.
- **IMP-004**: Provider objects never enter domain persistence; only bounded identifiers, amounts, statuses, readiness, and recovery metadata are stored.

## References

- **REF-001**: ADR-0006 and ADR-0007.
- **REF-002**: https://docs.stripe.com/connect/charges
- **REF-003**: https://docs.stripe.com/connect/destination-charges
- **REF-004**: https://docs.stripe.com/connect/onboarding
- **REF-005**: https://docs.stripe.com/payments/place-a-hold-on-a-payment-method
