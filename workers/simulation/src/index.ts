export interface Env {
  ENVIRONMENT: string;
  ARTIFACTS_BUCKET: R2Bucket;
}

export default {
  async fetch(): Promise<Response> {
    return new Response("NXTQR Simulation Runner & R2 Export Worker", { status: 200 });
  },
};
