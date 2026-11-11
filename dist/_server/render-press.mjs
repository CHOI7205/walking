import { listPublished, categories } from './press.mjs';
import { ensurePressSchema } from './storage.mjs';
import { bundledPosts } from './bundled-posts.mjs';
export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const e=escapeHtml;
const ld=value=>JSON.stringify(value).replace(/</g,'\\u003c');
const readableDate=value=>new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'long',day:'numeric'}).format(new Date(value));
const coverUrl=post=>post.cover_image||(post.cover_id?'/media/'+post.cover_id:'');
function inlineText(text){return e(text).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\[([^\]]+)\]\((https?:\/\/[^\s<>"']+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');}
export function renderMarkdown(source,allowedIds=[],allowedImages=[]) {
  const blocks=source.replace(/\r/g,'').split(/\n\s*\n/);
  return blocks.map(block=>{
    const localImage=block.match(/^!\[([^\]]*)\]\((\/assets\/images\/[a-z0-9-]+\.(?:png|jpe?g|webp))\)$/);
    if(localImage&&allowedImages.includes(localImage[2]))return `<figure class="post-figure"><img src="${e(localImage[2])}" alt="${e(localImage[1])}" loading="lazy"><figcaption>${e(localImage[1])}</figcaption></figure>`;
    const img=block.match(/^!\[([^\]]*)\]\(\/media\/([a-f0-9-]{36})\)$/);
    if(img&&allowedIds.includes(img[2]))return `<figure class="post-figure"><img src="/media/${img[2]}" alt="${e(img[1])}" loading="lazy">${img[1]?`<figcaption>${e(img[1])}</figcaption>`:''}</figure>`;
    const heading=block.match(/^(#{2,3})\s+([^\n]+)$/);
    if(heading)return `<h${heading[1].length}>${inlineText(heading[2])}</h${heading[1].length}>`;
    if(block.split('\n').every(line=>/^-\s+/.test(line)))return '<ul>'+block.split('\n').map(line=>'<li>'+inlineText(line.slice(2))+'</li>').join('')+'</ul>';
    return '<p>'+inlineText(block).replace(/\n/g,'<br>')+'</p>';
  }).join('\n');
}
function postCard(post){return `<article class="press-card"><a href="/press/${e(post.slug)}/"><div class="press-card-image">${coverUrl(post)?`<img src="${e(coverUrl(post))}" alt="${e(post.cover_alt||post.title)}" loading="lazy">`:'<div class="press-placeholder" aria-hidden="true"><span>WALKING JOURNAL</span><b>함께 걷는 이야기</b></div>'}</div><div class="press-card-copy"><span class="pill">${e(post.category)}</span><h2>${e(post.title)}</h2><p>${e(post.excerpt)}</p><span class="post-date">${readableDate(post.published_at)}</span></div></a></article>`;}
export function pressHomeSection(posts){if(!posts.length)return '';return `<section class="section soft"><div class="container"><div class="section-head"><div><p class="eyebrow">Newsroom</p><h2>협회의 새로운 이야기</h2></div><a href="/press/" class="text-link">전체 글 보기 <span aria-hidden="true">↗</span></a></div><div class="press-grid">${posts.map(postCard).join('')}</div></div></section>`;}
export function pressPromotionVideo() {
  const src = '/assets/videos/association-promo.mp4';
  return `<section id="promotion-video" aria-labelledby="promotion-video-title" style="margin-bottom:40px;scroll-margin-top:120px">
    <h2 id="promotion-video-title" style="margin-bottom:16px">협회 홍보영상</h2>
    <video controls playsinline preload="metadata" aria-labelledby="promotion-video-title" style="display:block;width:100%;max-width:760px;aspect-ratio:16/9;border-radius:8px;background:var(--deep)">
      <source src="${src}" type="video/mp4">
      <a href="${src}">홍보영상 파일 열기</a>
    </video>
  </section>`;
}
function pageHead(config,{title,description,path,image,type='website',schema=[],noindex=false}){
  const origin=config.origin,canonical=origin?origin+path:'';
  const full=title+' | '+config.name;
  return `<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(full)}</title><meta name="description" content="${e(description)}"><meta name="robots" content="${!config.production||noindex?'noindex, nofollow':'index, follow, max-image-preview:large'}"><meta name="theme-color" content="#153f3c"><link rel="stylesheet" href="/assets/styles.css"><link rel="stylesheet" href="/assets/cms.css"><link rel="icon" href="/assets/images/favicon.png"><script src="/assets/app.js" defer></script><meta property="og:type" content="${type}"><meta property="og:locale" content="ko_KR"><meta property="og:site_name" content="${e(config.name)}"><meta property="og:title" content="${e(full)}"><meta property="og:description" content="${e(description)}"><meta name="twitter:card" content="summary_large_image">${canonical?`<link rel="canonical" href="${e(canonical)}"><meta property="og:url" content="${e(canonical)}"><meta property="og:image" content="${e(origin+(image||'/assets/images/social.jpg'))}">`:''}<script type="application/ld+json">${ld({'@context':'https://schema.org','@graph':[{'@type':'Organization','@id':origin+'/#organization',name:config.name,telephone:config.phone,email:config.email},...schema]})}</script>`;
}
function shell(template,head,main){return template.replace(/<head>[\s\S]*?<\/head>/,()=>'<head>'+head+'</head>').replace(/<main id="main">[\s\S]*?<\/main>/,()=>'<main id="main">'+main+'</main>');}
const top=(title,description,tag='Newsroom')=>`<section class="page-top"><div class="container"><nav class="breadcrumb" aria-label="현재 위치"><a href="/">홈</a> / <a href="/press/">보도자료</a></nav><p class="eyebrow">${e(tag)}</p><h1>${e(title)}</h1><p class="lead">${e(description)}</p></div></section>`;
function htmlResponse(html,config,status=200){return new Response(html,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(!config.production?{'X-Robots-Tag':'noindex, nofollow'}:{})}});}
export async function renderPress(request,env,config) {
  const url=new URL(request.url);
  const templateResponse=await env.ASSETS.fetch(new Request(url.origin+'/press/'));
  const template=await templateResponse.text();
  const slug=url.pathname.match(/^\/press\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/)?.[1];
  if(slug){
    if(!env.DB&&!bundledPosts.some(post=>post.slug===slug))return htmlResponse(shell(template,pageHead(config,{title:'자료를 불러올 수 없습니다',description:'잠시 후 다시 확인해 주세요.',path:'/press/',noindex:true}),top('자료를 불러올 수 없습니다','잠시 후 다시 확인해 주세요.')),config,503);
    let post=bundledPosts.find(post=>post.slug===slug);
    if(!post&&env.DB){await ensurePressSchema(env.DB);post=await env.DB.prepare("SELECT * FROM press_posts WHERE slug=? AND status='published'").bind(slug).first();}
    if(!post)return htmlResponse(shell(template,pageHead(config,{title:'글을 찾을 수 없습니다',description:'발행된 글을 보도자료 목록에서 확인하세요.',path:'/press/',noindex:true}),top('글을 찾을 수 없습니다','글이 비공개로 변경되었거나 주소가 다릅니다.')+'<div class="container section"><a class="button" href="/press/">보도자료 목록</a></div>'),config,404);
    const ids=JSON.parse(post.asset_ids),files=[];
    for(const id of ids){const asset=await env.DB.prepare('SELECT id,filename,content_type FROM press_media WHERE id=?').bind(id).first();if(asset)files.push(asset);}
    const attachments=files.filter(file=>file.content_type==='application/pdf');
    const article=`<section class="section"><article class="container post-article"><div class="post-meta"><span class="pill">${e(post.category)}</span><span>${e(post.author)}</span><time datetime="${e(post.published_at)}">${readableDate(post.published_at)}</time></div>${coverUrl(post)?`<figure class="post-cover"><img src="${e(coverUrl(post))}" alt="${e(post.cover_alt||post.title)}" fetchpriority="high">${post.cover_caption?`<figcaption>${e(post.cover_caption)}</figcaption>`:""}</figure>`:''}<div class="prose post-body">${renderMarkdown(post.body,ids,post.body_images||[])}</div>${post.source_url?`<p class="post-source">자료 출처: ${e(post.source_name||'기사 원문')} <a href="${e(post.source_url)}" target="_blank" rel="noopener noreferrer">원문 보기 ↗</a></p>`:post.source_name?`<p class="post-source">자료 출처: ${e(post.source_name)}</p>`:''}${attachments.length?`<section class="post-attachments"><h2>첨부 자료</h2>${attachments.map(file=>`<a href="/media/${e(file.id)}">${e(file.filename)} <span aria-hidden="true">↓</span></a>`).join('')}</section>`:''}<p class="source-note">수정: <time datetime="${e(post.updated_at)}">${readableDate(post.updated_at)}</time></p><div class="post-bottom"><a class="button outline" href="/press/">목록으로</a></div></article></section>`;
    const schema=[{'@type':post.category==='보도자료'?'NewsArticle':'BlogPosting',headline:post.title,description:post.excerpt,datePublished:post.published_at,dateModified:post.updated_at,inLanguage:'ko-KR',author:{'@type':post.author===config.name?'Organization':'Person',name:post.author},publisher:{'@id':config.origin+'/#organization'},...(config.origin?{mainEntityOfPage:config.origin+`/press/${slug}/`,...(coverUrl(post)?{image:config.origin+coverUrl(post)}:{})}:{}),...(post.source_url?{citation:post.source_url}:{})}];
    if(config.origin)schema.push({'@type':'BreadcrumbList',itemListElement:[['/','홈'],['/press/','보도자료'],[`/press/${slug}/`,post.title]].map(([path,name],i)=>({'@type':'ListItem',position:i+1,name,item:config.origin+path}))});
    return htmlResponse(shell(template,pageHead(config,{title:post.title,description:post.excerpt,path:`/press/${slug}/`,image:coverUrl(post)||undefined,type:'article',schema}),top(post.title,post.excerpt,post.category)+article),config);
  }
  if(!['/press','/press/'].includes(url.pathname))return new Response('Not found',{status:404});
  const q=(url.searchParams.get('q')||'').slice(0,100),category=url.searchParams.get('category')||'',page=Math.min(10000,Math.max(1,parseInt(url.searchParams.get('page'))||1));
  let posts=[],hasMore=false,unavailable=false;
  try{({posts,hasMore}=await listPublished(env.DB,{q,category,page}));}catch{({posts,hasMore}=await listPublished(null,{q,category,page}));unavailable=!bundledPosts.length;}
  const query=new URLSearchParams();if(q)query.set('q',q);if(category)query.set('category',category);
  const pageLink=p=>{const params=new URLSearchParams(query);if(p>1)params.set('page',String(p));return '/press/'+(params.size?'?'+params:'');};
  const filters=`<form class="press-search" method="get" action="/press/"><label class="sr-only" for="press-query">기사 검색</label><input id="press-query" name="q" value="${e(q)}" placeholder="제목 또는 내용으로 검색" maxlength="100"><label class="sr-only" for="press-category">글 분류</label><select id="press-category" name="category"><option value="">전체 소식</option>${categories.map(cat=>`<option${cat===category?' selected':''}>${cat}</option>`).join('')}</select><button class="button" type="submit">검색</button></form>`;
  const content=posts.length?`<div class="press-grid">${posts.map(postCard).join('')}</div>`:`<div class="press-empty"><span class="eyebrow">Walking journal</span><h2>${unavailable?'소식을 불러오지 못했습니다':q||category?'검색 결과가 없습니다':'새로운 소식을 준비하고 있습니다'}</h2><p>${unavailable?'잠시 후 다시 확인해 주세요.':'협회의 보도자료와 현장 이야기를 이곳에서 전합니다.'}</p></div>`;
  const pagination=`<nav class="press-pagination" aria-label="페이지 이동">${page>1?`<a href="${e(pageLink(page-1))}">← 이전</a>`:''}<span>${page} 페이지</span>${hasMore?`<a href="${e(pageLink(page+1))}">다음 →</a>`:''}</nav>`;
  const video = page === 1 && !q && !category ? pressPromotionVideo() : '';
  return htmlResponse(shell(template,pageHead(config,{title:'보도자료와 협회 이야기',description:'대한바른자세걷기협회의 보도자료와 새로운 활동 소식을 만나보세요.',path:pageLink(page),noindex:!!q||!!category||unavailable}),top('바른 걸음으로 이어지는 이야기','협회의 보도자료와 새로운 활동 소식을 전합니다.')+`<section class="section"><div class="container">${video}${filters}${content}${pagination}<div class="press-list-footer"><a href="/press/feed.xml">RSS로 소식 받기</a><a href="/admin/">관리자 로그인</a></div></div></section>`),config,unavailable?503:200);
}
export async function dynamicSitemap(request,env,config){
  const base=await env.ASSETS.fetch(request);const text=await base.text();
  if(!config.production||!config.origin)return new Response(text,{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'no-store'}});
  const rows={results:[...bundledPosts]};
  if(env.DB){try{await ensurePressSchema(env.DB);const saved=await env.DB.prepare("SELECT slug,updated_at FROM press_posts WHERE status='published' ORDER BY published_at DESC LIMIT 10000").all();const seen=new Set(rows.results.map(p=>p.slug));rows.results.push(...saved.results.filter(p=>!seen.has(p.slug)));}catch{/* Bundled articles remain available. */}}
  const entries=rows.results.map(row=>`<url><loc>${e(config.origin+'/press/'+row.slug+'/')}</loc><lastmod>${e(row.updated_at)}</lastmod></url>`).join('');
  return new Response(text.replace('</urlset>',entries+'</urlset>'),{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'no-store'}});
}
export async function pressFeed(request,env,config){
  const origin=config.origin||new URL(request.url).origin;
  let posts;try{posts=(await listPublished(env.DB,{limit:30})).posts;}catch{posts=(await listPublished(null,{limit:30})).posts;}
  const xml=`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${e(config.name)} 보도자료</title><link>${e(origin+'/press/')}</link><description>협회의 보도자료와 새로운 소식</description><language>ko</language>${posts.map(post=>`<item><title>${e(post.title)}</title><link>${e(origin+'/press/'+post.slug+'/')}</link><guid>${e(origin+'/press/'+post.slug+'/')}</guid><description>${e(post.excerpt)}</description><pubDate>${new Date(post.published_at).toUTCString()}</pubDate></item>`).join('')}</channel></rss>`;
  return new Response(xml,{headers:{'Content-Type':'application/rss+xml; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
}
