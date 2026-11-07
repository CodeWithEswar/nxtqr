# ADR 0005: Cloudflare Workers, Queues, and R2 for Edge Compute

## Status

Accepted

## Context

Interactive simulations, large graph export generation, and telemetry batching must not block Next.js rendering threads or overload the relational database with long-running transactions.

## Decision

- Use Cloudflare Workers for edge routing and Turnstile bot protection.
- Use Cloudflare Queues for asynchronous simulation job scheduling and telemetry aggregation.
- Use Cloudflare R2 for storing private simulation replay artifacts and large graph exports.

## Consequences

- Long-running simulations are processed asynchronously via workers consuming queue messages.
- Queue messages follow the typed contract `QueueMessageEnvelope<T>`.
