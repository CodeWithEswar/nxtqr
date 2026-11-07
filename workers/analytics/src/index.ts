export default {
  async fetch(): Promise<Response> {
    return new Response("NXTQR Analytics Batch Worker", { status: 200 });
  },
};
