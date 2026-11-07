import type { QueueMessageEnvelope } from "@nxtqr/shared-types";

export interface Env {
  ENVIRONMENT: string;
}

export default {
  async queue(batch: MessageBatch<QueueMessageEnvelope>, _env: Env): Promise<void> {
    console.info(
      `[NXTQR Dispatcher] Received batch of ${batch.messages.length} messages from queue: ${batch.queue}`,
    );

    for (const msg of batch.messages) {
      try {
        const envelope = msg.body;
        console.info(
          `[NXTQR Dispatcher] Processing job: ${envelope.jobId}, event: ${envelope.eventId}, correlation: ${envelope.correlationId}`,
        );

        // Acknowledge successful message receipt
        msg.ack();
      } catch (err) {
        console.error(`[NXTQR Dispatcher] Error processing message ${msg.id}:`, err);
        // Retry message if within retry budget
        msg.retry();
      }
    }
  },

  async fetch(): Promise<Response> {
    return new Response("NXTQR Queue Dispatcher Worker", { status: 200 });
  },
};
