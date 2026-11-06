// A repeating 15-second timeline with no visible playback controls.
const hero = document.querySelector('[data-kinetic-hero]');
if (hero && typeof Element.prototype.animate === 'function') {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 15000;
  const scenes = [...hero.querySelectorAll('[data-scene]')];
  const animations = [];
  let elapsed = 0, last = null, frame = null, playing = false, inView = true;
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
    hero.dataset.motionState = reduced.matches ? 'static' : playing ? 'playing' : 'paused';
  }
  function tick(now) {
    if (!playing) return;
    if (last !== null) elapsed = (elapsed + now - last) % duration;
    last = now;
    paint();
    frame = requestAnimationFrame(tick);
  }
  function pause() {
    playing = false; last = null; cancelAnimationFrame(frame); paint();
  }
  function play() {
    if (reduced.matches || document.hidden || !inView || playing) return;
    playing = true; last = null; paint(); frame = requestAnimationFrame(tick);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); else play(); });
  // Avoid spending frames on an animation the visitor has scrolled past.
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (inView) play(); else pause();
  }, { threshold: 0 }).observe(hero);
  function motionPreference() {
    pause();
    if (reduced.matches) { elapsed = duration; paint(); }
    else { elapsed = 0; play(); }
  }
  reduced.addEventListener('change', motionPreference);
  // Wait briefly for the local font; never leave visitors waiting for a font.
  Promise.race([document.fonts.load('800 1em Pretendard'), new Promise(resolve => setTimeout(resolve, 1200))])
    .catch(() => {}).then(() => { if (reduced.matches) { elapsed = duration; paint(); } else if (!document.hidden) play(); });
}
