export default {
  async fetch(): Promise<Response> {
    return new Response("NXTQR Notifications Worker", { status: 200 });
  },
};
