export function renderHero() {
  const scenes = [
    { n: '01', label: '바른 자세에서 시작하는 걸음', image: 'community', lines: ['바른 자세,', '바른 걸음.'], detail: '작은 움직임부터, 바르게.' },
    { n: '02', label: '측정으로 이해하는 나의 움직임', image: 'walking-test', lines: ['내 걸음을', '이해하는 시간.'], detail: '족압과 보행 습관을 함께 살펴봅니다.' },
    { n: '03', label: '배움을 일상으로 연결하는 걷기 교육', image: 'hero-walk', lines: ['함께 걷는', '건강한 일상.'], detail: '대한바른자세걷기협회가 함께합니다.' }
  ];
  return `<section class="kinetic-hero" aria-labelledby="walking-hero-title" data-kinetic-hero>
    <h1 id="walking-hero-title" class="visually-hidden">바른 자세, 바른 걸음. 함께 걷는 건강한 일상.</h1>
    <div class="kinetic-stage" aria-hidden="true">
      <div class="kinetic-watermark">WALK</div>
      ${scenes.map((s, i) => `<div class="kinetic-scene kinetic-scene-${i + 1}" data-scene="${i}">
        <div class="kinetic-photo"><img src="/assets/images/${s.image}-1280.webp" alt="" width="1280" height="960" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async"></div>
        <div class="kinetic-copy"><p class="kinetic-kicker"><span>${s.n}</span> ${s.label}</p>
          <p class="kinetic-title">${s.lines.map((line, l) => `<span class="kinetic-line ${l ? 'kinetic-line-accent' : ''}">${[...line].map((c, j) => `<span class="kinetic-char" data-order="${l * 8 + j}">${c === ' ' ? '&nbsp;' : c}</span>`).join('')}</span>`).join('')}</p>
          <p class="kinetic-detail">${s.detail}</p>
        </div>
      </div>`).join('')}
      <div class="kinetic-signature">BETTER STEPS.<br>BETTER EVERYDAY.</div>
    </div>
    <div class="kinetic-dock container">
      <div class="kinetic-purpose"><span>걸음을 배우고, 일상에서 실천합니다</span><p>물리치료사의 전문성으로 만나는 걷기 교육</p></div>
      <div class="kinetic-actions"><a class="button light" href="/contact/">기관 교육 문의 <span aria-hidden="true">↗</span></a><a class="kinetic-link" href="/stories/">교육 현장 보기 <span aria-hidden="true">↗</span></a></div>
    </div>
  </section>`;
}
