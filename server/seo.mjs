// Shared by static education pages and server-rendered articles.
export const seoUpdated = '2026-11-27T02:44:46+00:00';
const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export const brandedTitle = (title, name) => title.includes(name) ? title : `${title} | ${name}`;
export const topicsFor = text => [
  ['posture','바른 자세 걷기',/자세|보행|보폭|팔|시선/],
  ['foot','족압 분석과 신발 선택',/족압|신발|전투화|깔창|발 건강|발 아치|운동화/],
  ['exercise','걷기와 근력·균형운동',/근력|균형|근육|근지구력|노쇠|낙상|지근|속근/],
  ['habit','일상 속 걷기 운동',/속도|습관|기록|수면|산책|휴식|실내|저녁|일상/],
  ['class','걷기 교육',/교육|보건소|복지관|학교|기업|강사|강좌/],
].filter(([, , pattern]) => pattern.test(text)).map(([id, name]) => ({id, name}));
export function relatedEducation(text, currentPath = '') {
  const topics = topicsFor(text);
  const links = [
    ...(topics.some(t=>t.id==='foot') ? [['/insights/plantar-pressure/','족압 분석과 발바닥 압력 이해하기']] : []),
    ['/insights/walking-exercise/','바른 자세 걷기와 근력·균형운동 배우기'],
    ...(topics.some(t=>t.id==='class') ? [['/insights/prepare-class/','기관 걷기 교육 준비 방법']] : []),
    ['/programs/','대상별 걷기 교육 프로그램'],
    ['/stories/','대한바른자세걷기협회 교육·활동 사례'],
  ].filter(([href])=>href!==currentPath).slice(0,3);
  return `<nav class="related-reading" aria-label="관련 걷기 정보와 교육"><h2>함께 읽는 걷기 정보와 교육 안내</h2><ul>${links.map(([href,label])=>`<li><a href="${href}">${label}</a></li>`).join('')}</ul></nav>`;
}
export function relatedArticles(post, posts) {
  const own = new Set(topicsFor(post.title+' '+post.excerpt).map(t=>t.id));
  const related = posts.filter(p=>p.slug!==post.slug).map(p=>({post:p,score:topicsFor(p.title+' '+p.excerpt).filter(t=>own.has(t.id)).length})).filter(p=>p.score>0).sort((a,b)=>b.score-a.score||b.post.published_at.localeCompare(a.post.published_at)).slice(0,3);
  return related.length ? `<nav class="related-reading" aria-label="관련 블로그 글"><h2>이 주제의 다른 글</h2><ul>${related.map(({post:p})=>`<li><a href="/press/${escape(p.slug)}/">${escape(p.title)}</a></li>`).join('')}</ul></nav>` : '';
}
export function articleOutline(html) {
  const headings=[];
  const body=html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g,(_,level,label)=>{
    const id='article-section-'+(headings.length+1);
    headings.push({id,label});
    return `<h${level} id="${id}">${label}</h${level}>`;
  });
  // Labels are rendered and escaped by the Markdown renderer before reaching here.
  const toc=headings.length>1 ? `<nav class="toc" aria-label="이 글의 내용"><h2>이 글의 내용</h2><ol>${headings.map(({id,label})=>`<li><a href="#${id}">${label.replace(/<[^>]+>/g,'')}</a></li>`).join('')}</ol></nav>` : '';
  return toc+body;
}
