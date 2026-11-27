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
  const shoePost=bundledPosts.find(post=>post.slug==='walking-shoes-fit-check');
  assert.ok(shoePost);
  assert.ok((await listPublished(null,{q:shoePost.title})).posts.some(post=>post.slug===shoePost.slug));
  const paged=[];
  for(let page=1;;page++){const result=await listPublished(null,{page});paged.push(...result.posts);if(!result.hasMore)break;}
  assert.equal(paged.length,bundledPosts.length);
  assert.equal(new Set(paged.map(post=>post.slug)).size,bundledPosts.length);
  const walkingInfo=[];
  for(let page=1;;page++){const result=await listPublished(null,{category:'걷기 정보',page});walkingInfo.push(...result.posts);if(!result.hasMore)break;}
  assert.equal(walkingInfo.length,bundledPosts.filter(post=>post.category==='걷기 정보').length);
  assert.ok(walkingInfo.some(post=>post.slug==='walking-shoes-fit-check'));
  assert.ok(walkingInfo.every(post=>post.category==='걷기 정보'));
  assert.equal((await listPublished(null,{q:'no-match-123'})).posts.length,0);
  const associationNews=(await listPublished(null,{category:'협회소식'})).posts;
  assert.equal(associationNews.length,bundledPosts.filter(post=>post.category==='협회소식').length);
  assert.ok(associationNews.every(post=>post.category==='협회소식'));
  assert.equal((await listPublished(null,{page:2})).posts.length,Math.min(9,Math.max(0,bundledPosts.length-9)));
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

test('RSS includes full public article bodies and absolute image URLs as escaped HTML',async()=>{
  const response=await pressFeed(new Request(config.origin+'/press/feed.xml'),env,config);
  assert.equal(response.status,200);
  const xml=await response.text();
  const {posts}=await listPublished(null,{limit:30});
  const post=posts.find(p=>p.body_images?.length);
  assert.ok(post,'feed contains a photographed activity article');
  assert.ok(xml.includes('src=&quot;'+config.origin+post.body_images[0]+'&quot;'));
  assert.ok(!xml.includes('src=&quot;/'));
  assert.ok(xml.includes('&lt;h2&gt;'));
  assert.ok(xml.includes('&lt;a href=&quot;'+config.origin+'/press/'+post.slug+'/&quot;'));
  assert.ok(!xml.includes('<script'));
  assert.ok(xml.includes('<guid isPermaLink="true">'));
});

test('every public blog article has consistent branded metadata, valid outline, topic links and preserved publication dates',async()=>{
  const descriptions=new Set();
  for(const post of bundledPosts){
    const html=await (await renderPress(new Request(config.origin+'/press/'+post.slug+'/'),env,config)).text();
    const title=html.match(/<title>(.*?)<\/title>/s)[1];
    assert.equal(title.split(config.name).length-1,1,post.slug);
    assert.equal((html.match(/<h1[ >]/g)||[]).length,1,post.slug);
    assert.ok(html.includes('rel="canonical" href="'+config.origin+'/press/'+post.slug+'/"'));
    assert.match(html,/content="index, follow, max-image-preview:large"/);
    const description=html.match(/name="description" content="([^"]*)"/)[1];
    assert.ok(description.includes(config.name));
    assert.ok(!descriptions.has(description));descriptions.add(description);
    const graph=JSON.parse(html.match(/application\/ld\+json">(.*?)<\/script>/s)[1])['@graph'];
    const article=graph.find(n=>['NewsArticle','BlogPosting'].includes(n['@type']));
    assert.equal(article.headline,post.title);
    assert.equal(article.datePublished,post.published_at);
    assert.equal(article.dateModified,post.updated_at);
    assert.equal(article.author.name,config.name);
    assert.equal(article.publisher['@id'],config.origin+'/#organization');
    assert.match(html,/aria-label="관련 블로그 글"/);
    assert.match(html,/aria-label="관련 걷기 정보와 교육"/);
    for(const [,id] of html.matchAll(/href="#(article-section-\d+)"/g))assert.ok(html.includes('id="'+id+'"'));
    for(const [,slug] of html.matchAll(/href="\/press\/([a-z0-9-]+)\/"/g)){
      assert.notEqual(slug,post.slug);assert.ok(bundledPosts.some(p=>p.slug===slug));
    }
  }
});
