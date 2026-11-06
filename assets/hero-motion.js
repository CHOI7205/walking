// One 15-second timeline, driven by a single clock so pause/replay never drift.
const hero = document.querySelector('[data-kinetic-hero]');
if (hero && typeof Element.prototype.animate === 'function') {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 15000;
  const scenes = [...hero.querySelectorAll('[data-scene]')];
  const player = hero.querySelector('.kinetic-player');
  const toggle = hero.querySelector('[data-motion-toggle]');
  const replay = hero.querySelector('[data-motion-replay]');
  const progress = hero.querySelector('[data-motion-progress]');
  const time = hero.querySelector('[data-motion-time]');
  const status = hero.querySelector('[data-motion-status]');
  const animations = [];
  let elapsed = 0, last = null, frame = null, playing = false;
  const at = ms => Math.max(0, Math.min(1, ms / duration));
  function animate(element, keyframes) {
    const animation = element.animate(keyframes, { duration, fill: 'both', easing: 'linear' });
    animation.pause();
    animations.push(animation);
  }
  const windows = [[0, 4300, 4900], [4300, 8900, 9500], [8900, 15000, 15000]];
  scenes.forEach((scene, index) => {
    const [start, end, out] = windows[index];
    const fadeIn = index ? start + 550 : 0;
    animate(scene, [
      { opacity: index ? 0 : 1, offset: 0 },
      ...(index ? [{ opacity: 0, offset: at(start) }, { opacity: 1, offset: at(fadeIn) }] : []),
      { opacity: 1, offset: at(end) },
      { opacity: index === 2 ? 1 : 0, offset: at(out) },
      { opacity: index === 2 ? 1 : 0, offset: 1 }
    ]);
    scene.querySelectorAll('.kinetic-char').forEach((char, j) => {
      const enter = start + 130 + j * 42;
      const lean = index === 0 ? 'rotate(-9deg) translateX(-.14em)' : index === 1 ? 'scaleX(.55)' : 'rotate(6deg) translateX(.1em)';
      animate(char, [
        { transform: `translateY(1.12em) ${lean}`, opacity: 0, offset: 0 },
        { transform: `translateY(1.12em) ${lean}`, opacity: 0, offset: at(enter) },
        { transform: 'translateY(-.035em) rotate(0deg) scaleX(1)', opacity: 1, offset: at(enter + 560), easing: 'cubic-bezier(.2,.8,.2,1)' },
        { transform: 'translateY(0) rotate(0deg) scaleX(1)', opacity: 1, offset: at(enter + 760) },
        { transform: 'translateY(0) rotate(0deg) scaleX(1)', opacity: 1, offset: 1 }
      ]);
    });
    animate(scene.querySelector('img'), [
      { transform: 'scale(1.075)', offset: 0 },
      { transform: 'scale(1.075)', offset: at(start) },
      { transform: 'scale(1)', offset: at(out) },
      { transform: 'scale(1)', offset: 1 }
    ]);
    for (const selector of ['.kinetic-kicker', '.kinetic-detail']) {
      const delay = start + (selector.includes('detail') ? 900 : 0);
      animate(scene.querySelector(selector), [
        { opacity: 0, transform: 'translateY(12px)', offset: 0 },
        { opacity: 0, transform: 'translateY(12px)', offset: at(delay) },
        { opacity: 1, transform: 'translateY(0)', offset: at(delay + 650) },
        { opacity: 1, transform: 'translateY(0)', offset: 1 }
      ]);
    }
  });
  function paint() {
    animations.forEach(animation => { animation.currentTime = elapsed; });
    progress.style.transform = `scaleX(${elapsed / duration})`;
    time.textContent = `00:${String(Math.floor(elapsed / 1000)).padStart(2, '0')} / 00:15`;
    hero.dataset.motionState = elapsed === duration ? 'finished' : playing ? 'playing' : 'paused';
  }
  function controls() {
    toggle.disabled = elapsed === duration;
    toggle.setAttribute('aria-label', elapsed === duration ? '모션 재생 완료' : playing ? '모션 일시정지' : '모션 이어서 재생');
    toggle.innerHTML = elapsed === duration ? '재생 완료 <span aria-hidden="true">✓</span>' : playing ? '일시정지 <span aria-hidden="true">Ⅱ</span>' : '이어서 재생 <span aria-hidden="true">▷</span>';
  }
  function tick(now) {
    if (!playing) return;
    if (last !== null) elapsed = Math.min(duration, elapsed + now - last);
    last = now;
    paint();
    if (elapsed < duration) frame = requestAnimationFrame(tick);
    else { playing = false; last = null; controls(); status.textContent = '모션이 끝났습니다. 다시 재생할 수 있습니다.'; }
  }
  function pause() {
    playing = false; last = null; cancelAnimationFrame(frame); controls(); paint();
  }
  function play(restart = false) {
    if (reduced.matches) return;
    if (restart) elapsed = 0;
    if (elapsed >= duration) return;
    cancelAnimationFrame(frame); playing = true; last = null; controls(); paint(); frame = requestAnimationFrame(tick);
  }
  toggle.addEventListener('click', () => {
    if (playing) { pause(); status.textContent = '모션을 일시정지했습니다.'; }
    else { play(); status.textContent = '모션을 이어서 재생합니다.'; }
  });
  replay.addEventListener('click', () => { play(true); status.textContent = '15초 모션을 처음부터 재생합니다.'; });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  // Avoid spending frames on an animation the visitor has scrolled past.
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting && playing) pause();
  }, { threshold: 0 }).observe(hero);
  function motionPreference() {
    pause();
    player.hidden = reduced.matches;
    if (reduced.matches) { elapsed = duration; paint(); }
    else { elapsed = 0; play(); }
  }
  reduced.addEventListener('change', motionPreference);
  player.hidden = reduced.matches;
  // Wait briefly for the local font; never leave visitors waiting for a font.
  Promise.race([document.fonts.load('800 1em Pretendard'), new Promise(resolve => setTimeout(resolve, 1200))])
    .catch(() => {}).then(() => { if (reduced.matches) { elapsed = duration; paint(); } else if (!document.hidden) play(); });
}
