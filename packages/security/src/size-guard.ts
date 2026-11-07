export class PayloadTooLargeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayloadTooLargeError";
  }
}

export function assertPayloadSize(content: string, maxBytes: number, label = "Payload"): void {
  const byteLength = new TextEncoder().encode(content).length;
  if (byteLength > maxBytes) {
    throw new PayloadTooLargeError(
      `[NXTQR Security] ${label} exceeds allowed size limit: ${byteLength} bytes > ${maxBytes} bytes allowed`,
    );
  }
}
