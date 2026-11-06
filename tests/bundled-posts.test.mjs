import test from 'node:test';
import assert from 'node:assert/strict';
import { listPublished } from '../server/press.mjs';
import { renderPress, dynamicSitemap, pressFeed } from '../server/render-press.mjs';
import { bundledPosts } from '../server/bundled-posts.mjs';
import worker from '../server/worker.mjs';

const config={name:'대한바른자세걷기협회',origin:'https://walking-90b.pages.dev',production:true};
const env={ASSETS:{fetch:async request=>new Response(new URL(request.url).pathname==='/sitemap.xml'?'<urlset></urlset>':'<html><head></head><body><main id="main"></main><!--LATEST_PRESS--></body></html>')}};

test('bundled articles, images, list search, feed and sitemap work without database or administrator setup',async()=>{
  const first=bundledPosts[0];
  assert.ok(first);
  assert.equal((await listPublished(null)).posts[0].slug,first.slug);
  assert.equal((await listPublished(null,{q:'no-match-123'})).posts.length,0);
  assert.equal((await listPublished(null,{category:'협회소식'})).posts.length,0);
  assert.equal((await listPublished(null,{page:2})).posts.length,0);
  const detail=await renderPress(new Request(config.origin+'/press/'+first.slug+'/'),env,config);
  assert.equal(detail.status,200);
  const html=await detail.text();
  assert.ok(html.includes(first.title));assert.ok(html.includes(first.cover_image));assert.ok(html.includes(first.cover_caption));
  assert.ok(!html.includes('# '+first.title));
  const list=await renderPress(new Request(config.origin+'/press/'),env,config);
  assert.equal(list.status,200);assert.ok((await list.text()).includes(first.slug));
  assert.ok((await (await pressFeed(new Request(config.origin+'/press/feed.xml'),env,config)).text()).includes(first.slug));
  assert.ok((await (await dynamicSitemap(new Request(config.origin+'/sitemap.xml'),env,config)).text()).includes(first.slug));
  const homepage=await worker.fetch(new Request(config.origin),env,{});
  assert.ok((await homepage.text()).includes(first.title));
  const write=await worker.fetch(new Request(config.origin+'/api/admin/posts',{method:'POST',headers:{Origin:config.origin,'Content-Type':'application/json'},body:'{}'}),env,{});
  assert.equal(write.status,401);
});
