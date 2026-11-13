import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { programs, cases, articles, faqs, eventPhotoGroups } from '../content.mjs';
import { renderHero } from './hero.mjs';
import { pressPromotionVideo } from '../server/render-press.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await fs.readFile(path.join(root, 'site.config.json'), 'utf8'));
const production = process.argv.includes('--production');
const origin = (process.env.SITE_ORIGIN || config.origin).replace(/\/$/, '');
if (production && !/^https:\/\/[^/]+$/.test(origin)) throw new Error('운영 빌드에는 site.config.json의 origin에 실제 HTTPS 도메인을 입력해야 합니다.');
if (origin && !/^https:\/\/[^/]+$/.test(origin)) throw new Error('origin은 경로 없이 HTTPS 도메인만 입력하세요.');
const dist = path.resolve(root, process.env.BUILD_OUTPUT || 'dist');
await fs.mkdir(dist, { recursive: true });
await fs.mkdir(path.join(dist, 'assets'), { recursive: true });
await fs.cp(path.join(root, 'assets', 'images'), path.join(dist, 'assets', 'images'), { recursive: true });
await fs.cp(path.join(root, 'assets', 'fonts'), path.join(dist, 'assets', 'fonts'), { recursive: true });
await fs.cp(path.join(root, 'assets', 'videos'), path.join(dist, 'assets', 'videos'), { recursive: true });
for (const file of ['styles.css', 'app.js','cms.css','admin.js','hero.css','hero-motion.js']) await fs.copyFile(path.join(root, 'assets', file), path.join(dist, 'assets', file));
// A new asset URL prevents cached scripts from running against newer hero markup.
const heroAssets = {};
for (const file of ['hero.css', 'hero-motion.js', 'app.js', 'styles.css']) {
  const bytes = await fs.readFile(path.join(root, 'assets', file));
  const version = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  const filename = file.replace(/\.(css|js)$/, `.${version}.$1`);
  await fs.writeFile(path.join(dist, 'assets', filename), bytes);
  heroAssets[file] = `/assets/${filename}`;
}
const esc = x => String(x ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const absolute = route => origin + route;
const orgId = absolute('/#organization');
const graphJson = value => JSON.stringify(value).replace(/</g, '\\u003c');
const arrow = '<span class="arrow" aria-hidden="true">↗</span>';
const link = (url, label, className = 'button') => `<a class="${className}" href="${esc(url)}">${label}${arrow}</a>`;
const image = (name, alt, attrs = '') => {
  const small = ['expert','expert-kim-portrait','logo'].includes(name);
  return `<img src="/assets/images/${name}-${small ? '480' : '1280'}.webp" ${small ? '' : `srcset="/assets/images/${name}-640.webp 640w, /assets/images/${name}-1280.webp 1280w" sizes="(max-width: 600px) 100vw, (max-width: 850px) 50vw, 600px"`} alt="${esc(alt)}" ${attrs || 'loading="lazy"'} decoding="async">`;
};
const navItems = [['/about/','협회 소개'],['/programs/','교육 프로그램'],['/stories/','활동 사례'],['/insights/','걷기 정보'],['/press/','보도자료'],['/news/','협회 소식']];
function header(route) {
  return `<a class="skip" href="#main">본문 바로가기</a><header class="site-header"><div class="container header-inner"><a class="brand" href="/" aria-label="대한바른자세걷기협회 홈">${image('logo','', 'width="56" height="56"')}<span><strong>대한바른자세걷기협회</strong><small>KOREA UPRIGHT WALKING ASSOCIATION</small></span></a><nav id="main-nav" class="nav" aria-label="주 메뉴">${navItems.map(([url,label])=>`<a href="${url}"${route.startsWith(url)?' aria-current="page"':''}>${label}</a>`).join('')}</nav><a class="header-contact" href="/contact/">기관 교육 문의 <span aria-hidden="true">↗</span></a><button type="button" class="menu-toggle" aria-controls="main-nav" aria-expanded="false">메뉴</button></div></header>`;
}
const cta = `<section class="cta-band"><div class="container cta-inner"><div><h2>우리 기관에 맞는 걷기 교육,<br>함께 준비해 보세요.</h2><p>대상과 현장에 맞는 프로그램을 상담해 드립니다.</p></div>${link('/contact/','기관 교육 문의')}</div></section>`;
function footer() {
  return `<footer class="site-footer"><div class="container"><div class="footer-top"><div><a class="footer-brand" href="/">대한바른자세걷기협회</a><p>Korea Upright Walking Association<br>바른 걸음을 배우고, 일상에서 함께 실천합니다.</p></div><div class="footer-contact"><a href="tel:${config.phone.replace(/-/g,'')}">${esc(config.phone)}</a><a href="mailto:${esc(config.email)}">${esc(config.email)}</a><span>기관 교육 · 프로그램 · 협력 문의</span></div></div><div class="footer-bottom"><span>© 2026 대한바른자세걷기협회. All rights reserved.</span><div class="footer-links"><a href="/privacy/">개인정보 안내</a><a href="/editorial/">콘텐츠 기준</a><a href="/contact/">문의하기</a></div></div></div></footer><a href="#top" class="back-top" aria-label="맨 위로">↑</a>`;
}
const pages = [];
async function writePage({route,title,description,body,schema=[],crumbs=[],noindex=false,heroImage=false,type='website',showCta=true}) {
  const fullTitle = route === '/' ? `${config.name} | 족압·보행 측정과 바른 걷기 교육` : `${title} | ${config.name}`;
  const graph = [
    {'@type':'Organization','@id':orgId,name:config.name,alternateName:config.englishName,description:'물리치료사의 전문성을 바탕으로 족압·보행 측정과 바른 걷기 교육을 제공하는 협회',foundingDate:'2023-02',telephone:config.phone,email:config.email,...(origin?{url:absolute('/'),logo:absolute('/assets/images/logo-480.webp')}:{})},
    {'@type':'WebSite','@id':absolute('/#website'),name:config.name,inLanguage:'ko-KR',publisher:{'@id':orgId},...(origin?{url:absolute('/')}:{})},
    {'@type':'WebPage','@id':absolute(route+'#webpage'),name:fullTitle,description,inLanguage:'ko-KR',isPartOf:{'@id':absolute('/#website')},about:{'@id':orgId},...(origin?{url:absolute(route)}:{})},
    ...schema
  ];
  if (crumbs.length && origin) graph.push({'@type':'BreadcrumbList',itemListElement:[['/','홈'],...crumbs].map(([url,label],i)=>({'@type':'ListItem',position:i+1,name:label,item:absolute(url)}))});
  const html = `<!doctype html>
<html lang="ko" id="top"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(fullTitle)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="${!production || noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'}"><meta name="theme-color" content="#153f3c">${origin?`<link rel="canonical" href="${esc(absolute(route))}"><meta property="og:url" content="${esc(absolute(route))}">`:''}<meta property="og:type" content="${type}"><meta property="og:locale" content="ko_KR"><meta property="og:site_name" content="${esc(config.name)}"><meta property="og:title" content="${esc(fullTitle)}"><meta property="og:description" content="${esc(description)}">${origin?`<meta property="og:image" content="${esc(absolute('/assets/images/social.jpg'))}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="대한바른자세걷기협회 야외 운동 교육 현장"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${esc(absolute('/assets/images/social.jpg'))}">`:''}<meta name="twitter:title" content="${esc(fullTitle)}"><meta name="twitter:description" content="${esc(description)}">${config.googleVerification?`<meta name="google-site-verification" content="${esc(config.googleVerification)}">`:''}${config.naverVerification?`<meta name="naver-site-verification" content="${esc(config.naverVerification)}">`:''}<link rel="icon" type="image/png" href="/assets/images/favicon.png"><link rel="stylesheet" href="/assets/styles.css">${heroImage?'<link rel="preload" href="/assets/fonts/PretendardVariable.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="'+heroAssets['hero.css']+'"><script src="'+heroAssets['hero-motion.js']+'" defer></script>':''}<script type="application/ld+json">${graphJson({'@context':'https://schema.org','@graph':graph})}</script><script src="/assets/app.js" defer></script></head><body>${header(route)}<main id="main">${body}</main>${showCta?cta:''}${footer()}</body></html>`;
  const filename = route === '/404.html' ? path.join(dist,'404.html') : path.join(dist,route.replace(/^\//,''),'index.html');
  await fs.mkdir(path.dirname(filename),{recursive:true});
  const finalHtml=html.replace('<link rel="stylesheet" href="/assets/styles.css">','<link rel="stylesheet" href="/assets/styles.css"><link rel="stylesheet" href="/assets/cms.css">').replace('</main>',()=>`${['/','/news/'].includes(route)?'<!--LATEST_PRESS-->':''}</main>`);
  await fs.writeFile(filename,finalHtml.replaceAll('/assets/app.js',heroAssets['app.js']).replaceAll('/assets/styles.css',heroAssets['styles.css']));
  pages.push({route,title:fullTitle,description,noindex,filename});
}
const breadcrumb = crumbs => `<nav class="breadcrumb" aria-label="현재 위치"><a href="/">홈</a>${crumbs.map(([url,label],i)=>` <span aria-hidden="true">/</span> ${i===crumbs.length-1?`<span aria-current="page">${esc(label)}</span>`:`<a href="${url}">${esc(label)}</a>`}`).join('')}</nav>`;
const pageTop = (title,lead,eyebrow,crumbs) => `<section class="page-top"><div class="container">${breadcrumb(crumbs)}<p class="eyebrow">${eyebrow}</p><h1>${esc(title)}</h1><p class="lead">${esc(lead)}</p></div></section>`;
const faqBlock = list => `<div class="faq">${list.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;
const faqSchema = list => ({'@type':'FAQPage',mainEntity:list.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))});
const caseImageUrl = item => item.eventPhoto ? `/assets/images/events/${item.eventPhoto}.webp` : `/assets/images/${item.image}-1280.webp`;
const caseImage = (item, detail = false) => {
  const detailClass = item.eventPhoto || item.image === 'school' ? 'detail-image poster' : 'detail-image';
  if (item.eventPhoto) {
    return `<img src="${esc(caseImageUrl(item))}" alt="${esc(item.alt)}" ${detail ? `class="${detailClass}" loading="eager"` : 'loading="lazy"'} decoding="async">`;
  }
  return image(item.image, item.alt, detail ? `class="${detailClass}" width="1280" height="960" loading="eager"` : 'width="640" height="457" loading="lazy"');
};
const caseCard = item => `<article class="case-card" data-category="${esc(item.category)}"><a href="/stories/${item.slug}/"><div class="photo ${(item.poster || item.image==='school')?'school':''}">${caseImage(item)}</div>${item.photoNote ? `<div><small>${esc(item.photoNote)}</small></div>` : ''}<span class="pill">${esc(item.category)}</span><h3>${esc(item.title)}</h3><div class="case-meta"><span>${esc(item.institution)}</span>${item.date ? `<span>${esc(item.date)}</span>` : ''}</div><p>${esc(item.summary)}</p></a></article>`;
const articleCard = item => `<article class="info-card"><span class="pill">${esc(item.category)}</span><h3><a href="/insights/${item.slug}/">${esc(item.title)}</a></h3><p>${esc(item.lead)}</p>${link('/insights/'+item.slug+'/','자세히 읽기','text-link')}</article>`;
const sidebar = program => `<aside class="sidebar"><h2>기관 교육 상담</h2><p>대상, 지역과 예상 인원,<br>희망 시기를 알려주세요.<br>교육 구성을 함께 협의합니다.</p>${link('/contact/'+(program?'?program='+program:''),'교육 문의하기')}<a href="tel:0234724177">${esc(config.phone)}</a><p><a href="mailto:${esc(config.email)}">${esc(config.email)}</a></p></aside>`;
const relatedCases = program => program.cases.length ? `<section class="section soft"><div class="container"><div class="section-head"><h2 id="related-cases" style="scroll-margin-top:120px">관련 교육 사례</h2></div><div class="cases-grid">${program.cases.map(slug => caseCard(cases.find(item => item.slug === slug))).join('')}</div></div></section>` : '';
const steps = `<div class="steps">${[['01','교육 문의','기관의 교육 목적과 대상, 희망 일정을 알려주세요.'],['02','프로그램 협의','인원과 장소에 맞춰 측정·강의·실습 구성을 정합니다.'],['03','현장 교육','협의한 내용에 따라 걷기 교육과 실습을 진행합니다.'],['04','교육 마무리','과정에 맞는 결과 안내와 후속 내용을 협의합니다.']].map(([n,t,p])=>`<div class="step"><b>${n}</b><h3>${t}</h3><p>${p}</p></div>`).join('')}</div>`;

await writePage({route:'/',title:config.name,description:'물리치료사의 전문성을 바탕으로 족압·보행 측정과 바른 걷기 교육을 제공합니다. 보건소·복지관·학교·기업 프로그램과 실제 활동 사례, 기관 교육 문의를 확인하세요.',heroImage:true,schema:[faqSchema(faqs.slice(1,4))],body:`
${renderHero()}
<section class="section"><div class="container"><div class="section-head"><div><p class="eyebrow">Our programs</p><h2>함께 걷는 사람에 맞춰,<br>교육도 달라집니다.</h2></div>${link('/programs/','전체 프로그램 보기','text-link')}</div><div class="program-grid">${programs.slice(0,4).map(p=>`<a class="program-card" href="/programs/${p.slug}/"><span class="program-num">${p.num}</span><div class="category">${p.category}</div><h3>${p.title}</h3><p>${p.short}</p><span class="circle-arrow" aria-hidden="true">↗</span></a>`).join('')}</div></div></section>
<section class="section soft"><div class="container feature-split"><div class="feature-photo">${image('lecture','주민들이 올바른 걷기와 근력운동 강의를 듣는 현장','width="1280" height="960" loading="lazy"')}<div class="feature-caption">실제 교육 현장에서 쌓아 온 경험을 함께 나눕니다.</div></div><div class="feature-copy"><p class="eyebrow">Why we walk</p><h2>걸음의 시작은,<br>내 몸을 이해하는 것.</h2><p>대한바른자세걷기협회는 물리치료사의 전문성을 바탕으로 걷기를 교육합니다. 발과 보행 습관을 이해하고, 일상에서 실천할 방법을 함께 찾습니다.</p><ul class="feature-list"><li><span>01</span><div><h3>전문가와 함께 배우는 걷기</h3><p>물리치료사의 지식과 현장 교육 경험을 연결합니다.</p></div></li><li><span>02</span><div><h3>측정으로 이해하는 내 걸음</h3><p>족압, 즉 발바닥에 실리는 압력과 보행 특성을 살펴봅니다.</p></div></li><li><span>03</span><div><h3>직접 움직이며 익히는 방법</h3><p>걷기와 근력·균형·유연성 운동을 함께 교육합니다.</p></div></li></ul>${link('/about/','협회 자세히 알아보기','text-link')}</div></div></section>
<section class="section"><div class="container"><div class="section-head"><div><p class="eyebrow">Walking in the field</p><h2>바른 걸음을 만나는 현장</h2><p>지역사회에서 학교와 일터까지, 실제 교육 사례를 소개합니다.</p></div><div class="field-links">${link('/gallery/','행사 사진 보기','text-link')}${link('/stories/','활동 사례 모두 보기','text-link')}</div></div><div class="cases-grid">${cases.slice(0,3).map(caseCard).join('')}</div></div></section>
<section class="section dark"><div class="container"><div class="section-head"><div><p class="eyebrow">Together, step by step</p><h2>우리 기관의 교육,<br>이렇게 함께 준비합니다.</h2></div><p>교육 목적부터 현장 운영까지<br>기관의 상황에 맞게 협의합니다.</p></div>${steps}</div></section>
<section class="section" id="instructors" aria-labelledby="instructors-title"><div class="container expert-strip"><div><p class="eyebrow">Our instructors</p><h2 id="instructors-title">강사진 소개</h2><p style="margin-top:18px;color:var(--muted)">바른 걷기와 운동을 가르치는 협회 강사진을 소개합니다.</p></div>
<div class="expert-list">
  <div class="expert-card">${image('expert-kim-portrait','김찬문 대한바른자세걷기협회 회장','width="480" height="613" loading="lazy"')}<div><span class="pill">협회 회장</span><h3>김찬문</h3><p>연세대학교 보건대학원 이학석사<br>국립재활병원 물리치료실장</p>${link('/about/experts/#kim','김찬문 소개','text-link')}</div></div>
  <div class="expert-card">${image('expert','최영호 대한바른자세걷기협회 부회장','width="420" height="485" loading="lazy"')}<div><span class="pill">협회 부회장 · 몸학교 대표</span><h3>최영호</h3><p>스포츠의학 석사 · 이학박사<br>전 인하대학교병원 물리치료실</p>${link('/about/experts/#choi','최영호 소개','text-link')}</div></div>
</div></div></section>
<section class="section soft"><div class="container"><div class="section-head"><div><p class="eyebrow">Walking notes</p><h2>걷기를 이해하는 작은 시작</h2></div>${link('/insights/','걷기 정보 보기','text-link')}</div><div class="info-grid">${articles.map(articleCard).join('')}</div></div></section>
<section class="section"><div class="container"><p class="eyebrow">Questions & answers</p><h2>교육 전에 궁금한 점</h2>${faqBlock(faqs.slice(1,4))}</div></section>`});

await writePage({route:'/about/',title:'협회 소개',description:'대한바른자세걷기협회의 설립 취지와 주요 교육 활동을 소개합니다. 물리치료사의 전문성을 바탕으로 지역사회·학교·기업에서 바른 걷기를 교육합니다.',crumbs:[['/about/','협회 소개']],body:pageTop('바른 걸음을 배우고,\n일상에서 함께 실천합니다.','대한바른자세걷기협회는 물리치료사의 전문성을 바탕으로 올바른 걷기와 운동을 교육합니다.','About the association',[['/about/','협회 소개']])+`<section class="section"><div class="container feature-split"><div class="prose"><h2>우리의 출발</h2><p>협회 소개자료에 따르면 대한바른자세걷기협회는 전문 물리치료사들이 모여 2023년 2월 발족했습니다. 지역사회 봉사활동, 보건소 걷기 교육과 학생 대상 사업 등 다양한 현장에서 활동합니다.</p><h2>교육으로 만나는 바른 걷기</h2><p>족압·보행 특성을 살펴보고 올바른 신발 선택과 다양한 걷기 방법을 교육합니다. 걷기에 필요한 근력·균형·유연성 운동을 함께 다룹니다.</p><p>지역사회, 학교, 기업과 협력해 대상과 현장에 맞는 교육 구성을 협의합니다.</p>${link('/about/experts/','강사진 소개','text-link')}</div><div class="feature-photo">${image('outdoor','서호노인복지관 참여자들이 강사와 야외 운동을 하는 모습','width="1280" height="960" loading="lazy"')}</div></div></section><section class="section soft"><div class="container"><p class="eyebrow">Our work</p><h2>협회가 함께하는 일</h2><div class="info-grid" style="margin-top:30px">${[['지역사회 걷기 교육','보건소·복지관과 함께하는 주민 대상 걷기 및 운동 교육'],['학교·기업 교육','학생과 임직원의 발·보행 이해를 위한 현장 교육'],['현장 체험과 봉사','지역 걷기 행사와 건강 캠페인에서 만나는 측정·교육 활동']].map(([t,p])=>`<div class="info-card"><h3>${t}</h3><p>${p}</p></div>`).join('')}</div><p class="source-note">내용 근거: 협회 소개자료 2·8쪽 및 기관별 활동 사례. 협약 체결과 교육 수행은 서로 다른 활동으로 구분합니다.</p></div></section>`});

const galleryCrumbs = [['/stories/','활동 사례'],['/gallery/','행사 사진']];
const gallerySections = eventPhotoGroups.map(group => {
  const photos = group.events.flatMap(event => event.photos.map(([name, caption]) => {
    const src = `/assets/images/events/${name}.webp`;
    return `<figure class="event-photo"><a href="${esc(src)}" aria-label="${esc(caption)} 사진 크게 보기"><img src="${esc(src)}" alt="${esc(caption)}" loading="lazy" decoding="async"></a><figcaption><strong>${esc(event.title)}</strong><span>${esc(caption)}</span></figcaption></figure>`;
  }));
  return `<section class="event-photo-group" id="${esc(group.id)}" aria-labelledby="${esc(group.id)}-title"><h2 id="${esc(group.id)}-title">${esc(group.title)}</h2><div class="event-photo-grid">${photos.join('')}</div></section>`;
}).join('');

await writePage({
  route:'/gallery/',
  title:'행사 사진',
  description:'대한바른자세걷기협회의 보건소 걷기 교육, 걷기축제, 족압 측정과 강사 교육 현장 사진을 모았습니다.',
  crumbs:galleryCrumbs,
  body:pageTop('행사 사진','걷기를 배우고, 함께 연습하고, 발바닥 압력을 측정한 현장을 사진으로 만나보세요.','Event photos',galleryCrumbs)+`
<div class="section"><div class="container">
  <nav class="filters" aria-label="행사 사진 분류">${eventPhotoGroups.map(group=>`<a class="filter" href="#${esc(group.id)}">${esc(group.title)}</a>`).join('')}</nav>
  ${gallerySections}
  <p class="source-note">사진은 협회 소개자료에 수록된 활동 기록입니다.</p>
</div></div>`
});

const expertCrumbs = [['/about/','협회 소개'],['/about/experts/','강사진 소개']];
await writePage({
  route: '/about/experts/',
  title: '강사진 소개 · 김찬문 회장과 최영호 부회장',
  description: '대한바른자세걷기협회 김찬문 회장과 최영호 부회장의 학력, 경력 및 걷기 교육 분야를 소개합니다.',
  crumbs: expertCrumbs,
  schema: [
    {'@type':'Person','@id':absolute('/about/experts/#kim'),name:'김찬문',jobTitle:'회장',affiliation:{'@id':orgId},description:'연세대학교 보건대학원 이학석사(보건행정), 물리치료사'},
    {'@type':'Person','@id':absolute('/about/experts/#choi'),name:'최영호',jobTitle:'협회 부회장 · 몸학교 대표',affiliation:{'@id':orgId},description:'물리치료사, 스포츠의학 석사, 재활치료학과 이학박사'}
  ],
  body: pageTop('강사진 소개','협회 강사진의 경력과 교육 분야를 소개합니다.','Our instructors',expertCrumbs)+`
<section class="section" id="kim" aria-labelledby="kim-name">
  <div class="container content-width profile">
    ${image('expert-kim-portrait','김찬문 회장','width="480" height="613" loading="eager"')}
    <div class="prose">
      <span class="pill">대한바른자세걷기협회 회장</span>
      <h2 id="kim-name" style="margin-top:15px">김찬문</h2>
      <p>물리치료사</p>
      <h3>주요 학력</h3>
      <ul><li>연세대학교 보건대학원 이학석사(보건행정)</li></ul>
      <h3>주요 경력</h3>
      <ul>
        <li>국립재활병원 물리치료실장</li>
        <li>경동대학교 작업치료학과 교수</li>
        <li>경복대학교 물리치료학과 교수</li>
        <li>대한배구협회 의무분과위원회 자문위원</li>
        <li>FIFA Football Medicine Diploma</li>
      </ul>
      <h3>저서</h3><ul><li>노쇠 예방을 위한 건강 운동 가이드북(2026)</li></ul>
      <h3>강연 주제</h3>
      <ul>
        <li>근감소증의 이해와 지역사회 역할</li>
        <li>올바른 걷기와 근력운동</li>
        <li>올바른 걷기와 스마트 족압 측정</li>
        <li>노화와 근감소증</li>
      </ul>
      <p class="source-note">자료는 협회가 제공한 김찬문 강사 소개를 바탕으로 정리했습니다.</p>
    </div>
  </div>
</section>
<section class="section soft" id="choi" aria-labelledby="choi-name"><div class="container content-width profile">${image('expert','최영호 부회장','width="420" height="485" loading="lazy"')}<div class="prose"><span class="pill">협회 부회장 · 몸학교 대표</span><h2 id="choi-name" style="margin-top:15px">최영호</h2><p>물리치료사</p><h3>주요 학력</h3><ul><li>2002년 고려대학교 스포츠대학원 스포츠의학 전공 석사</li><li>2025년 한림대학교 재활치료학과 이학박사</li></ul><h3>주요 경력</h3><ul><li>전 인하대학교병원 물리치료실</li><li>물리치료 관련 대학 외래교수 경력</li><li>대한근감소증물리치료학회 부회장</li><li>몸학교(Mom School) 대표</li></ul><h3>저서</h3><ul><li>노쇠 예방을 위한 건강 운동 가이드북(2026)</li></ul><h3>교육 활동</h3><p>보건소, 지역사회 기관과 기업 등에서 올바른 걷기, 족압·보행 이해 및 운동 관련 교육을 진행합니다.</p><p class="source-note">자료: 첨부 「최영호_약력」. 자료 정리일: 2026년 11월 6일. 생년월일과 면허번호는 공개하지 않습니다.</p></div></div></section>`
});

await writePage({route:'/programs/',title:'교육 프로그램',description:'보건소·복지관, 학교·청소년, 기업·임직원, 건강 행사와 전문인력을 위한 걷기 교육 프로그램을 안내합니다.',crumbs:[['/programs/','교육 프로그램']],body:pageTop('대상과 현장에 맞춘 걷기 교육','보건소와 복지관, 학교, 일터와 행사 현장까지. 기관의 목적과 참여자에 맞는 프로그램을 함께 구성합니다.','Our programs',[['/programs/','교육 프로그램']])+`<section class="section"><div class="container"><div class="section-head"><h2>교육 과정</h2>${link('/about/experts/','강사진 소개','text-link')}</div><div class="program-list">${programs.map(p=>`<article class="program-row">${p.eventPhoto ? caseImage(p) : image(p.image,p.alt,'width="640" height="480" loading="lazy"')}<div><span class="pill">${p.category}</span><h2><a href="/programs/${p.slug}/">${p.title}</a></h2><p>${p.description}</p><div class="field-links">${link('/programs/'+p.slug+'/','프로그램 자세히 보기','text-link')}${p.cases.length ? link('/programs/'+p.slug+'/#related-cases','교육 사례 보기','text-link') : ''}</div></div></article>`).join('')}</div></div></section>`});
for (const p of programs) await writePage({route:`/programs/${p.slug}/`,title:p.title,description:p.description,crumbs:[['/programs/','교육 프로그램'],[`/programs/${p.slug}/`,p.title]],schema:[{'@type':'Service',name:p.title,description:p.description,provider:{'@id':orgId},serviceType:'걷기 교육',audience:{'@type':'Audience',audienceType:p.audience},...(origin?{url:absolute(`/programs/${p.slug}/`)}:{})}],body:pageTop(p.title,p.description,p.category,[['/programs/','교육 프로그램'],[`/programs/${p.slug}/`,p.title]])+`<section class="section"><div class="container page-grid"><article class="prose">${caseImage(p,true)}<h2>누구를 위한 교육인가요?</h2><p>${p.audience}</p><h2>어떤 내용을 배우나요?</h2><ul>${p.items.map(t=>`<li>${t}</li>`).join('')}</ul><h2>교육은 어떻게 구성하나요?</h2><p>${p.note}</p><table class="fact-table"><tbody><tr><th scope="row">운영 방식</th><td>기관 목적과 현장에 맞춰 협의</td></tr><tr><th scope="row">인원·시간</th><td>대상, 공간과 회차에 따라 협의</td></tr><tr><th scope="row">교육 비용</th><td>지역·인원·회차·측정 구성에 따라 협의</td></tr><tr><th scope="row">준비 정보</th><td>교육 대상, 지역, 예상 인원, 희망 시기와 장소</td></tr></tbody></table><div class="callout">측정과 실습, 결과 안내의 제공 범위는 과정별로 다릅니다. 구체적인 진행 내용은 사전에 확인합니다.</div><p class="source-note">교육 내용 근거: 협회 소개자료 및 기관별 활동 기록. 프로그램 이름과 안내는 홈페이지 이용을 위해 정리했습니다.</p></article>${sidebar(p.slug)}</div></section>`+relatedCases(p)});

await writePage({route:'/stories/',title:'교육·활동 사례',description:'대한바른자세걷기협회의 보건소·복지관, 학교, 기업 및 지역 행사 교육·활동 사례를 기관별로 확인하세요.',crumbs:[['/stories/','활동 사례']],body:pageTop('함께 배우고 걸어온 현장','지역사회, 학교와 일터에서 진행한 교육을 소개합니다. 기관과 대상에 따른 실제 활동 내용을 살펴보세요.','Field stories',[['/stories/','활동 사례']])+`<section class="section"><div class="container"><div class="section-head"><h2>교육·활동 사례</h2>${link('/gallery/','행사 사진 보기','text-link')}</div><div class="filters" role="group" aria-label="활동 분야 선택">${['all',...programs.map(program=>program.category)].map((cat,i)=>`<button type="button" class="filter" data-filter="${cat}" aria-pressed="${i===0}">${i===0?'전체 활동':cat}</button>`).join('')}</div><p id="result-count" class="status-filter" role="status">${cases.length}개의 활동 사례</p><div class="cases-grid">${cases.map(caseCard).join('')}</div></div></section>`});
for (const c of cases) await writePage({route:`/stories/${c.slug}/`,title:`${c.institution} · ${c.title}`,description:c.summary,crumbs:[['/stories/','활동 사례'],[`/stories/${c.slug}/`,c.title]],type:'article',schema:[{'@type':'Article',headline:c.title,description:c.summary,author:{'@id':orgId},publisher:{'@id':orgId},inLanguage:'ko-KR',about:{'@id':orgId},citation:c.source,...(origin?{mainEntityOfPage:absolute(`/stories/${c.slug}/`),image:absolute(caseImageUrl(c))}:{})}],body:pageTop(c.title,c.summary,c.category,[['/stories/','활동 사례'],[`/stories/${c.slug}/`,c.title]])+`<section class="section"><div class="container page-grid"><article class="prose">${caseImage(c,true)}${c.photoNote?`<p class="caption">${esc(c.photoNote)}</p>`:c.referencePhoto?'<p class="caption">사진: 협회의 다른 교육 현장 참고 이미지입니다.</p>':''}<h2>교육 개요</h2><table class="fact-table"><tbody><tr><th scope="row">기관</th><td>${c.institution}</td></tr><tr><th scope="row">진행 시기</th><td>${c.period}</td></tr><tr><th scope="row">대상</th><td>${c.audience}</td></tr></tbody></table><h2>현장에서 함께한 내용</h2><p>${c.body}</p><ul>${c.items.map(x=>`<li>${x}</li>`).join('')}</ul><h2>비슷한 교육을 준비하고 계신가요?</h2><p>대상과 현장 환경에 따라 프로그램을 구성합니다. <a href="/programs/${c.program}/">관련 교육 프로그램</a>을 살펴보거나 기관 교육을 문의해 주세요.</p><p class="source-note">내용 근거: ${c.source}. 자료 정리일: 2026년 11월 6일. 이 기록은 교육 내용을 소개하며, 별도의 검증 자료가 없는 효과 수치나 만족도는 제시하지 않습니다.</p></article>${sidebar(c.program)}</div></section>`});

await writePage({route:'/insights/',title:'걷기 정보',description:'족압 측정의 의미와 협회의 걷기·운동 교육 방식, 기관 교육 준비 방법을 알기 쉽게 안내합니다.',crumbs:[['/insights/','걷기 정보']],body:pageTop('걷기를 이해하는 작은 시작','발과 보행, 운동과 교육에 관한 궁금증을 풀어봅니다. 협회 자료를 바탕으로 교육 내용을 쉽게 안내합니다.','Walking notes',[['/insights/','걷기 정보']])+`<section class="section"><div class="container info-grid">${articles.map(articleCard).join('')}</div></section>`});
for (const a of articles) await writePage({route:`/insights/${a.slug}/`,title:a.title,description:a.lead,type:'article',crumbs:[['/insights/','걷기 정보'],[`/insights/${a.slug}/`,a.title]],schema:[{'@type':'Article',headline:a.title,description:a.lead,author:{'@id':orgId},publisher:{'@id':orgId},datePublished:'2026-11-06',dateModified:config.contentUpdated,inLanguage:'ko-KR',citation:a.source,...(origin?{mainEntityOfPage:absolute(`/insights/${a.slug}/`),image:absolute(`/assets/images/${a.image}-1280.webp`)}:{})}],body:pageTop(a.title,a.lead,a.category,[['/insights/','걷기 정보'],[`/insights/${a.slug}/`,a.title]])+`<section class="section"><div class="container page-grid"><article class="prose"><p class="caption" style="margin-top:0">작성: 대한바른자세걷기협회 자료 편집 · <time datetime="2026-11-06">2026년 11월 6일</time></p><nav class="toc" aria-label="이 글의 내용"><h2>이 글의 내용</h2><ol>${a.sections.map(([t],i)=>`<li><a href="#section-${i+1}">${t}</a></li>`).join('')}</ol></nav>${a.sections.map(([t,p],i)=>`<h2 id="section-${i+1}">${t}</h2><p>${p}</p>`).join('')}<p class="source-note">내용 근거: ${a.source}. 이 글은 협회 교육 안내이며, 개인의 질환을 판단하거나 진료를 대신하지 않습니다. <a href="/editorial/">콘텐츠 작성 기준</a></p></article>${sidebar('')}</div></section>`});

await writePage({route:'/faq/',title:'자주 묻는 질문',description:'걷기 교육 대상, 족압 측정 포함 여부, 교육 시간과 비용, 개인 참가 안내 등 자주 묻는 질문에 답합니다.',crumbs:[['/faq/','자주 묻는 질문']],schema:[faqSchema(faqs)],body:pageTop('자주 묻는 질문','교육과 협회 활동에 관해 많이 궁금해하시는 내용을 모았습니다.','Questions & answers',[['/faq/','자주 묻는 질문']])+`<section class="section"><div class="container">${faqBlock(faqs)}</div></section>`});

await writePage({route:'/news/',title:'협회 소식',description:'대한바른자세걷기협회의 최근 활동 기록과 교육 안내, 자주 묻는 질문을 확인하세요.',crumbs:[['/news/','협회 소식']],body:pageTop('협회의 소식을 전합니다','교육 현장의 기록과 프로그램 이용 안내를 확인하세요.','Association news',[['/news/','협회 소식']])+`<section class="section"><div class="container content-width"><p class="callout">아래 항목은 활동 기록과 상시 안내입니다. 현재 모집 중인 교육 공고를 뜻하지 않습니다.</p>${[['2026.09','/stories/school-project/','학생 바른 성장 프로젝트','권선구보건소 학생 대상 교육 활동 기록'],['2026.07','/stories/shinsegae/','기업 임직원 족압·보행 교육','신세계그룹 임직원 대상 교육 기록'],['상시 안내','/insights/prepare-class/','기관 교육 문의 안내','교육 대상, 인원과 희망 시기를 정리해 주세요.'],['상시 안내','/faq/','교육 전에 궁금한 점','족압 측정, 교육 비용과 개인 참가 안내']].map(([date,url,t,p])=>`<a class="news-row" href="${url}"><span>${date}</span><div><h2>${t}</h2><p>${p}</p></div>${arrow}</a>`).join('')}</div></section>`});

await writePage({route:'/contact/',title:'기관 교육 문의',description:'보건소·복지관·학교·기업 걷기 교육을 문의하세요. 대표 전화 02-3472-4177, 이메일 kptchoi7205@gmail.com 또는 기관 교육 문의 양식을 이용할 수 있습니다.',crumbs:[['/contact/','기관 교육 문의']],showCta:false,body:pageTop('우리 기관의 바른 걸음,\n함께 준비해 보세요.','교육 목적과 대상, 희망 내용을 알려주세요. 기관에 맞는 프로그램을 함께 협의하겠습니다.','Let’s walk together',[['/contact/','기관 교육 문의']])+`<section class="section"><div class="container contact-grid"><div class="contact-details"><h2>어떤 교육이 필요하신가요?</h2><p>일정이 아직 확정되지 않아도 괜찮습니다. 교육 대상과 궁금한 내용을 남겨주세요.</p><div class="contact-method"><span>전화 문의</span><a href="tel:0234724177">${config.phone}</a></div><div class="contact-method"><span>이메일 문의</span><a href="mailto:${config.email}">${config.email}</a></div><p>개인 참가를 원하시면 해당 교육을 주관하는 기관의 모집 안내를 먼저 확인해 주세요.</p></div><form id="inquiry-form" class="form" action="mailto:kptchoi7205@gmail.com" method="post" enctype="text/plain"><h2>기관 교육 문의서</h2><p class="form-intro"><span class="required">*</span> 필수 항목입니다. 작성 후 버튼을 누르면 내용이 입력된 Gmail 창이 열립니다. Gmail에서 ‘보내기’를 눌러야 전송됩니다.</p><noscript><p class="callout">온라인 문의는 JavaScript가 필요합니다. 전화 또는 이메일로도 문의하실 수 있습니다.</p></noscript><div class="form-grid"><label class="field">기관명 <span class="required">*</span><input name="organization" autocomplete="organization" required maxlength="100" placeholder="기관 또는 단체명"></label><label class="field">담당자명 <span class="required">*</span><input name="name" autocomplete="name" required maxlength="60" placeholder="담당자 성함"></label><label class="field">연락처 <span class="required">*</span><input name="phone" type="tel" autocomplete="tel" required maxlength="30" placeholder="연락받으실 전화번호"></label><label class="field">이메일<input name="email" type="email" autocomplete="email" maxlength="200" placeholder="회신받으실 이메일"></label><label class="field">희망 프로그램 <span class="required">*</span><select name="program" required><option value="">선택해 주세요</option>${programs.map(p=>`<option value="${p.slug}">${p.title}</option>`).join('')}<option value="other">기타 · 프로그램 상담</option></select></label><label class="field">교육 지역<input name="region" maxlength="100" placeholder="예: 서울 서초구"></label><label class="field">예상 인원<input name="participants" type="number" min="1" max="100000" placeholder="미정이면 비워두세요"></label><label class="field">희망 시기<input name="schedule" maxlength="100" placeholder="예: 2027년 3월 또는 미정"></label><label class="field full">문의 내용 <span class="required">*</span><textarea name="message" required minlength="10" maxlength="4000" placeholder="교육 대상, 목적, 희망 내용 등을 10자 이상 작성해 주세요."></textarea></label></div><div class="hp" aria-hidden="true"><label>이 항목은 비워주세요<input name="website" tabindex="-1" autocomplete="off"></label></div><label class="consent"><input type="checkbox" name="consent" required><span><a href="/privacy/" target="_blank" rel="noopener">개인정보 수집·이용 안내</a>를 확인하고 문의 상담을 위한 필수 정보 수집·이용에 동의합니다. <span class="required">*</span></span></label><button type="submit" class="button">Gmail에서 문의 보내기 ${arrow}</button><p id="form-status" class="status" role="status" aria-live="polite" aria-atomic="true"></p></form></div></section>`});

await writePage({route:'/privacy/',title:'개인정보 수집·이용 안내',description:'기관 교육 문의 양식의 개인정보 수집 항목, 이용 목적, 보관 및 삭제, 문의 방법을 안내합니다.',crumbs:[['/privacy/','개인정보 안내']],showCta:false,body:pageTop('개인정보 수집·이용 안내','기관 교육 문의를 보내기 전에 확인해 주세요.','Privacy',[['/privacy/','개인정보 안내']])+`<section class="section"><div class="container content-width prose"><h2>문의 상담을 위한 정보</h2><p>대한바른자세걷기협회는 기관 교육 문의에 답변하고 교육 일정과 내용을 협의하기 위해 아래 정보를 이용합니다.</p><ul><li>필수: 기관명, 담당자명, 연락처, 희망 프로그램, 문의 내용, 수집·이용 동의 여부</li><li>선택: 이메일, 교육 지역, 예상 인원, 희망 시기</li></ul><h2>Gmail을 통한 문의</h2><p>이 양식은 작성한 내용을 Gmail 작성창에 전달합니다. 실제 메일은 방문자가 Gmail에서 ‘보내기’를 누른 뒤 발송됩니다. 홈페이지 서버나 별도 폼 전송 서비스에 문의 내용을 자동 저장하지 않습니다.</p><h2>보관과 삭제</h2><p>메일로 받은 문의 정보는 수신일로부터 최대 90일간 보관합니다. 동의 철회나 삭제를 원하시면 대표 이메일로 요청해 주세요. 문의 내용에는 주민등록번호, 개인 건강검사 결과 등 민감한 정보를 입력하지 말아 주세요.</p><h2>동의 여부</h2><p>정보 수집·이용에 동의하지 않을 수 있습니다. 다만 필수 항목 수집에 동의하지 않으면 온라인 문의를 접수할 수 없습니다. 전화와 이메일로도 상담할 수 있습니다.</p><h2>사이트 이용</h2><p>문의 양식은 방문자의 정보를 브라우저 저장소에 보관하지 않습니다. 이 사이트에는 광고 추적 코드와 별도 방문 분석 스크립트를 설치하지 않았습니다. 호스팅 서비스는 서비스 제공과 보안 목적의 접속 기록을 처리할 수 있습니다.</p><h2>문의처</h2><p>대한바른자세걷기협회<br>전화 <a href="tel:0234724177">02-3472-4177</a><br>이메일 <a href="mailto:kptchoi7205@gmail.com">kptchoi7205@gmail.com</a></p><p class="source-note">안내 작성일: 2026년 11월 6일. 실제 운영 시 개인정보 처리 업무, 수탁·이전 현황 등 운영 환경에 맞춘 추가 안내가 필요할 수 있습니다.</p></div></section>`});

await writePage({route:'/editorial/',title:'콘텐츠 작성 기준',description:'협회 자료에 근거한 콘텐츠 작성과 활동 기록, 사진 사용, 건강 정보 및 수정 요청 기준을 안내합니다.',crumbs:[['/editorial/','콘텐츠 기준']],showCta:false,body:pageTop('정보의 근거를 분명하게','협회의 활동과 교육 내용을 정확하게 전달하기 위한 기준입니다.','Editorial standards',[['/editorial/','콘텐츠 기준']])+`<section class="section"><div class="container content-width prose"><h2>협회 자료에 근거합니다</h2><p>협회 소개자료, 최영호 약력과 첨부 강의자료를 바탕으로 내용을 정리했습니다. 활동 사례에는 해당 자료의 쪽수를 표시합니다. 전체 누적 실적이나 만족도, 확인되지 않은 후기는 임의로 만들지 않습니다.</p><h2>활동과 교육 효과를 구분합니다</h2><p>활동 기록은 교육 대상과 진행 내용을 설명합니다. 사전·사후 측정을 했다는 사실을 치료 효과나 개선율이 입증됐다는 의미로 사용하지 않습니다. 개인에 대한 진단이나 치료 결과를 보장하지 않습니다.</p><h2>사진과 기관명을 구분해 표시합니다</h2><p>첨부 자료에 수록된 사진을 사용합니다. 해당 사례의 직접 사진이 아닌 경우 참고 사진이라고 표시합니다. 교육 수행기관을 모두 공식 협약기관으로 표기하지 않습니다.</p><h2>작성과 수정</h2><p>콘텐츠는 협회 자료를 홈페이지 이용 목적에 맞게 편집한 내용입니다. 별도 전문가 검수 사실이 확인되지 않은 글에 검수자 표시를 넣지 않습니다. 오류나 수정이 필요한 내용을 발견하시면 <a href="mailto:kptchoi7205@gmail.com">kptchoi7205@gmail.com</a>으로 알려주세요.</p><p class="source-note">자료 정리 기준일: 2026년 11월 6일</p></div></section>`});
await writePage({route:'/404.html',title:'페이지를 찾을 수 없습니다',description:'요청하신 페이지가 없습니다. 대한바른자세걷기협회 홈이나 교육 프로그램을 확인해 주세요.',noindex:true,showCta:false,body:`<section class="empty-page"><div class="container"><p class="eyebrow">404 · Page not found</p><h1>페이지를 찾을 수 없습니다.</h1><p>주소가 변경되었거나 없는 페이지입니다.<br>홈에서 필요한 정보를 다시 찾아보세요.</p>${link('/','홈으로 돌아가기')}</div></section>`});

await writePage({route:'/press/',title:'보도자료와 협회 이야기',description:'대한바른자세걷기협회의 보도자료와 새로운 활동 소식을 만나보세요.',crumbs:[['/press/','보도자료']],showCta:false,body:pageTop('바른 걸음으로 이어지는 이야기','협회의 보도자료와 새로운 활동 소식을 전합니다.','Newsroom',[['/press/','보도자료']])+'<section class="section"><div class="container">'+pressPromotionVideo()+'<div class="press-empty"><h2>새로운 소식을 준비하고 있습니다</h2><p>협회의 보도자료와 현장 이야기를 이곳에서 전합니다.</p></div><div class="press-list-footer"><a href="/news/">협회 소식</a><a href="/admin/">관리자 로그인</a></div></div></section>'});
await writePage({route:'/admin/',title:'보도자료 관리',description:'대한바른자세걷기협회 보도자료 관리자 로그인과 글 편집 화면입니다.',noindex:true,showCta:false,body:await fs.readFile(path.join(root,'assets','admin.html'),'utf8')});
await fs.cp(path.join(root,'server'),path.join(dist,'_server'),{recursive:true});
await fs.writeFile(path.join(dist,'_server','runtime-config.mjs'),'export default '+JSON.stringify({...config,origin,production})+';\n');
await fs.writeFile(path.join(dist,'_worker.js'),"export { default } from './_server/worker.mjs';\n");
await fs.writeFile(path.join(dist,'_routes.json'),JSON.stringify({version:1,include:['/*'],exclude:['/assets/*']},null,2));
const indexed = pages.filter(p=>!p.noindex);
await fs.writeFile(path.join(dist,'robots.txt'),production?`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${absolute('/sitemap.xml')}\n`:'User-agent: *\nDisallow: /\n');
await fs.writeFile(path.join(dist,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${production?indexed.map(p=>`\n<url><loc>${esc(absolute(p.route))}</loc></url>`).join(''):''}\n</urlset>\n`);
await fs.writeFile(path.join(dist,'_headers'),`/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  X-Frame-Options: DENY\n  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'\n/assets/*\n  Cache-Control: public, max-age=86400\n${production?'':'/*\n  X-Robots-Tag: noindex, nofollow\n'}`);
await fs.writeFile(path.join(root,'build-report.json'),JSON.stringify({mode:production?'production':'preview',origin:origin||null,pages:pages.length,indexable:production?indexed.length:0,routes:pages.map(p=>p.route)},null,2));
console.log(`Built ${pages.length} HTML pages → ${dist}\nMode: ${production?'PRODUCTION':'PREVIEW (noindex)'}${origin?'\nOrigin: '+origin:'\nDomain is not configured; production build is protected.'}`);
