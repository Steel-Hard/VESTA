export const auth = {
  handler: async (req: any, res: any) => {
    // minimal placeholder handler for local development
    return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
  },
};
