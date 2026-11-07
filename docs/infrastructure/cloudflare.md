# Cloudflare Infrastructure & Edge Topology

## Edge Workers

1. `workers/api`: Edge API gateway, CORS headers, Turnstile verification, and rate limiting.
2. `workers/dispatcher`: Cloudflare Queue consumer, batch processor, retry scheduler, and dead-letter queue forwarder.
3. `workers/simulation`: Offloaded compute worker executing bounded graph simulations and writing exports to Cloudflare R2.
4. `workers/notifications`: Asynchronous webhook and email dispatcher.
5. `workers/analytics`: Batch telemetry collector for non-sensitive usage metrics.

## Cloudflare Queues

- **Queue**: `nxtqr-simulation-jobs`
- **Dead-Letter Queue**: `nxtqr-dead-letter`
- **Envelope**: Typed contract `QueueMessageEnvelope<T>` containing `version`, `eventId`, `jobId`, `timestamp`, `correlationId`, and `payload`.
- **Delivery**: At-least-once delivery; consumer workers implement idempotency checks on `jobId`.

## Cloudflare R2

- **Bucket**: `nxtqr-artifacts` (Private by default)
- **Access**: Signed URLs generated on-demand for project exports and simulation replay traces.
