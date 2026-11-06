import { handleInquiry, purgeExpired } from './inquiries.mjs';
import { normalizeEnv, apiJson } from './storage.mjs';
import { handleAuth } from './auth.mjs';
import { handlePressAdmin, serveMedia, listPublished } from './press.mjs';
import { renderPress, pressHomeSection, dynamicSitemap, pressFeed } from './render-press.mjs';
import config from './runtime-config.mjs';

export default {
  async fetch(request, bindings, ctx) {
    const env=normalizeEnv(bindings);
    const url = new URL(request.url);
    if(url.pathname.startsWith('/_server/')||url.pathname.startsWith('/_worker.js')||url.pathname.startsWith('/.'))return new Response('Not found',{status:404});
    try {
    if(['/api/admin/login','/api/admin/logout','/api/admin/session'].includes(url.pathname))return await handleAuth(request,env);
    if(url.pathname.startsWith('/api/admin/'))return await handlePressAdmin(request,env);
    if(url.pathname.startsWith('/media/'))return await serveMedia(request,env);
    if(url.pathname==='/press/feed.xml')return await pressFeed(request,env,config);
    if(url.pathname==='/press'||url.pathname.startsWith('/press/'))return await renderPress(request,env,config);
    if(url.pathname==='/sitemap.xml')return await dynamicSitemap(request,env,config);
    if (url.pathname === '/api/inquiries') return handleInquiry(request,env,ctx);
    if (url.pathname.startsWith('/api/')) return new Response('Not found',{status:404,headers:{'X-Robots-Tag':'noindex'}});
    if((url.pathname==='/'||url.pathname==='/news/')&&env.DB){
      const response=await env.ASSETS.fetch(request);
      if(response.status===200){const html=await response.text();let section='';try{section=pressHomeSection((await listPublished(env.DB,{limit:3})).posts);}catch{/* Keep the static homepage available during DB maintenance. */}
      const headers=new Headers(response.headers);headers.set('Cache-Control','no-store');headers.delete('Content-Length');
      return new Response(html.replace('<!--LATEST_PRESS-->',()=>section),{status:200,headers});}
    }
    return env.ASSETS.fetch(request);
    } catch {
      if(url.pathname.startsWith('/api/'))return apiJson(503,{message:'저장소에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요. 입력 내용은 유지됩니다.'});
      return new Response('일시적으로 자료를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
    }
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(purgeExpired(normalizeEnv(env),event.scheduledTime));
  }
};
