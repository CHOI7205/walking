import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {localBindings} from '../scripts/local-storage.mjs';
import worker from '../server/worker.mjs';
import {normalizeEnv,ensurePressSchema} from '../server/storage.mjs';
import {renderMarkdown,dynamicSitemap} from '../server/render-press.mjs';

function request(path,method='GET',data,headers={}){
  return new Request('https://walk.test'+path,{method,headers:{...(method!=='GET'?{Origin:'https://walk.test','Content-Type':'application/json'}:{}),...headers},...(data!==undefined?{body:typeof data==='string'||data instanceof Uint8Array?data:JSON.stringify(data)}:{})});
}
async function fixture(){
  const local=localBindings();
  const shell=await fs.readFile(new URL('../dist/press/index.html',import.meta.url),'utf8');
  const sitemap='<?xml version="1.0"?><urlset></urlset>';
  const env={'walking-db':local.DB,'walking-r2':local.MEDIA,ADMIN_PASSWORD:local.ADMIN_PASSWORD,ASSETS:{async fetch(req){return new Response(new URL(req.url).pathname==='/sitemap.xml'?sitemap:shell,{headers:{'Content-Type':'text/html'}});}}};
  const call=(path,method,data,headers)=>worker.fetch(request(path,method,data,headers),env,{});
  const login=await call('/api/admin/login','POST',{password:local.ADMIN_PASSWORD});
  assert.equal(login.status,200);
  const cookie=login.headers.get('Set-Cookie').split(';')[0];
  const admin=(path,method='GET',data,headers={})=>call(path,method,data,{Cookie:cookie,...headers});
  const post={title:'지역사회 걷기 교육 소식',excerpt:'지역주민과 함께한 걷기 교육을 소개합니다.',body:'## 현장 이야기\n\n함께 걸으며 올바른 걷기를 배우는 교육입니다.',slug:'community-walking-news',category:'보도자료',author:'대한바른자세걷기협회',status:'draft',asset_ids:[]};
  return {local,env,call,admin,post,cookie};
}
test('existing hyphenated D1/R2 bindings normalize and database schema is additive',async()=>{
  const f=await fixture();assert.equal(normalizeEnv(f.env).DB,f.local.DB);assert.equal(normalizeEnv(f.env).MEDIA,f.local.MEDIA);
  await ensurePressSchema(f.local.DB);await ensurePressSchema(f.local.DB);
  assert.equal((await f.admin('/api/admin/posts')).status,200);f.local.close();
});
test('anonymous writes, cross-site writes, forged cookies and invalid logins are rejected',async()=>{
  const f=await fixture();
  assert.equal((await f.call('/api/admin/posts','POST',f.post)).status,401);
  assert.equal((await f.admin('/api/admin/posts','POST',f.post,{Origin:'https://evil.test'})).status,403);
  assert.equal((await f.call('/api/admin/posts','GET',undefined,{Cookie:'walking_admin=forged'})).status,401);
  assert.equal((await f.call('/api/admin/login','POST',{password:'incorrect-password'})).status,401);
  for(let i=0;i<3;i++)await f.call('/api/admin/login','POST',{password:'incorrect-password'});
  assert.equal((await f.call('/api/admin/login','POST',{password:'incorrect-password'})).status,429);
  f.local.close();
});
test('draft → publish → edit → unpublish persists and public output excludes private drafts',async()=>{
  const f=await fixture();
  const created=await f.admin('/api/admin/posts','POST',f.post);assert.equal(created.status,201);const data=await created.json();
  assert.equal((await f.call('/press/'+data.slug+'/')).status,404);
  let list=await(await f.call('/press/')).text();assert.ok(!list.includes('href="/press/community-walking-news/"'));
  const publish=await f.admin('/api/admin/posts/'+data.id,'PUT',{...f.post,status:'published',version:1});assert.equal(publish.status,200);
  const article=await f.call('/press/'+data.slug+'/');assert.equal(article.status,200);const html=await article.text();
  assert.ok(html.includes('<h2>현장 이야기</h2>'));assert.ok(html.includes('"@type":"NewsArticle"'));assert.ok(html.includes('datePublished'));
  list=await(await f.call('/press/')).text();assert.ok(list.includes('href="/press/community-walking-news/"'));
  assert.equal((await f.admin('/api/admin/posts/'+data.id,'PUT',{...f.post,version:1})).status,409);
  assert.equal((await f.admin('/api/admin/posts/'+data.id,'PUT',{...f.post,slug:'changed-url',version:2})).status,409);
  assert.equal((await f.admin('/api/admin/posts/'+data.id,'PUT',{...f.post,status:'draft',version:2})).status,200);
  assert.equal((await f.call('/press/'+data.slug+'/')).status,404);
  assert.equal((await(await f.admin('/api/admin/posts/'+data.id)).json()).post.status,'draft');
  f.local.close();
});
test('R2 images stay private until publication and unsupported upload content is rejected',async()=>{
  const f=await fixture();
  const image=await fs.readFile(new URL('../assets/images/logo-480.webp',import.meta.url));
  assert.equal((await f.admin('/api/admin/uploads','POST','<svg onload=alert(1)>',{'Content-Type':'image/svg+xml'})).status,400);
  const uploaded=await f.admin('/api/admin/uploads','POST',image,{'Content-Type':'image/webp','X-Filename':encodeURIComponent('대표 사진.webp')});assert.equal(uploaded.status,201);const media=await uploaded.json();
  assert.equal((await f.call('/media/'+media.id)).status,404);
  assert.equal((await f.admin('/media/'+media.id)).status,200);
  const draft={...f.post,cover_id:media.id,asset_ids:[media.id],body:f.post.body+'\n\n![교육 사진](/media/'+media.id+')'};
  const saved=await(await f.admin('/api/admin/posts','POST',draft)).json();
  await f.admin('/api/admin/posts/'+saved.id,'PUT',{...draft,status:'published',version:1});
  const publicFile=await f.call('/media/'+media.id);assert.equal(publicFile.status,200);assert.equal(publicFile.headers.get('Content-Type'),'image/webp');assert.equal((await publicFile.arrayBuffer()).byteLength,image.length);
  await f.admin('/api/admin/posts/'+saved.id,'PUT',{...draft,status:'draft',version:2});
  assert.equal((await f.call('/media/'+media.id)).status,404);
  f.local.close();
});
test('safe rendering escapes HTML and rejects missing assets or unsafe source URLs',async()=>{
  const f=await fixture();
  assert.equal((await f.admin('/api/admin/posts','POST',{...f.post,source_url:'javascript:alert(1)'})).status,400);
  assert.equal((await f.admin('/api/admin/posts','POST',{...f.post,asset_ids:[crypto.randomUUID()]})).status,400);
  const safe=renderMarkdown('<script>alert(1)</script>\n\n[bad](javascript:alert(1))\n\n**강조**');
  assert.ok(!safe.includes('<script>'));assert.ok(!safe.includes('href="javascript:'));assert.ok(safe.includes('<strong>강조</strong>'));
  const saved=await(await f.admin('/api/admin/posts','POST',{...f.post,title:'<img src=x onerror=alert(1)> $&',status:'published'})).json();
  const html=await(await f.call('/press/'+saved.slug+'/')).text();assert.ok(!html.includes('<img src=x'));assert.ok(html.includes('&lt;img'));
  f.local.close();
});
test('published posts appear in sitemap and RSS; drafts and admin are excluded',async()=>{
  const f=await fixture();
  await f.admin('/api/admin/posts','POST',{...f.post,status:'published'});
  await f.admin('/api/admin/posts','POST',{...f.post,slug:'private-draft'});
  const sitemap=await dynamicSitemap(request('/sitemap.xml'),normalizeEnv(f.env),{production:true,origin:'https://walk.test'});const xml=await sitemap.text();
  assert.ok(xml.includes('https://walk.test/press/community-walking-news/'));assert.ok(!xml.includes('private-draft'));assert.ok(!xml.includes('/admin/'));
  const feed=await(await f.call('/press/feed.xml')).text();assert.ok(feed.includes('community-walking-news'));assert.ok(!feed.includes('private-draft'));
  assert.equal((await f.call('/_server/auth.mjs')).status,404);
  f.local.close();
});
