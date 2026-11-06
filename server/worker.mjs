import { handleInquiry, purgeExpired } from './inquiries.mjs';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/inquiries') return handleInquiry(request,env,ctx);
    if (url.pathname.startsWith('/api/')) return new Response('Not found',{status:404,headers:{'X-Robots-Tag':'noindex'}});
    return env.ASSETS.fetch(request);
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(purgeExpired(env,event.scheduledTime));
  }
};
