import test from 'node:test';
import assert from 'node:assert/strict';
import { listPublished } from '../server/press.mjs';
import { renderPress, dynamicSitemap, pressFeed, renderMarkdown } from '../server/render-press.mjs';
import { bundledPosts } from '../server/bundled-posts.mjs';
import worker from '../server/worker.mjs';

const config={name:'대한바른자세걷기협회',origin:'https://walking-90b.pages.dev',production:true};
const env={ASSETS:{fetch:async request=>new Response(new URL(request.url).pathname==='/sitemap.xml'?'<urlset></urlset>':'<html><head></head><body><main id="main"></main><!--LATEST_PRESS--></body></html>')}};

test('bundled articles, images, list search, feed and sitemap work without database or administrator setup',async()=>{
  const {posts}=await listPublished(null);
  const first=posts[0];
  assert.ok(first);
  assert.ok(posts.some(post=>post.slug==='walking-shoes-fit-check'));
  const walkingInfo=(await listPublished(null,{category:'걷기 정보'})).posts;
  assert.ok(walkingInfo.some(post=>post.slug==='walking-shoes-fit-check'));
  assert.ok(walkingInfo.every(post=>post.category==='걷기 정보'));
  assert.equal((await listPublished(null,{q:'no-match-123'})).posts.length,0);
  const associationNews=(await listPublished(null,{category:'협회소식'})).posts;
  assert.equal(associationNews.length,bundledPosts.filter(post=>post.category==='협회소식').length);
  assert.ok(associationNews.every(post=>post.category==='협회소식'));
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
  const homepageHtml=await homepage.text();
  const {posts:latestPosts}=await listPublished(null,{limit:3});
  for(const post of latestPosts)assert.ok(homepageHtml.includes(post.title));
  const write=await worker.fetch(new Request(config.origin+'/api/admin/posts',{method:'POST',headers:{Origin:config.origin,'Content-Type':'application/json'},body:'{}'}),env,{});
  assert.equal(write.status,401);
});

test('source photographs render only from the bundled article image allowlist',async()=>{
  const photoPost=bundledPosts.find(post=>post.slug==='yangcheon-walking-education');
  assert.ok(photoPost);
  const detail=await renderPress(new Request(config.origin+'/press/'+photoPost.slug+'/'),env,config);
  assert.equal(detail.status,200);
  const html=await detail.text();
  for(const image of photoPost.body_images)assert.ok(html.includes('src="'+image+'"'));
  assert.ok(html.includes('https://blog.naver.com/bja620/223960596248'));
  const marker='![caption](/assets/images/unapproved.jpg)';
  assert.ok(!renderMarkdown(marker).includes('<img'));
  assert.ok(!renderMarkdown('![caption](https://unapproved.example/photo.jpg)',[],photoPost.body_images).includes('<img'));
});
