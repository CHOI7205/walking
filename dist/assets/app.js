const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
function closeMenu() {
  nav?.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
}
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('open', open);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (nav && !nav.contains(event.target) && !menuButton?.contains(event.target)) closeMenu();
});
window.matchMedia('(min-width: 851px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

const filterButtons = document.querySelectorAll('[data-filter]');
const resultCount = document.querySelector('#result-count');
filterButtons.forEach(button => button.addEventListener('click', () => {
  const category = button.dataset.filter;
  let count = 0;
  filterButtons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  document.querySelectorAll('[data-category]').forEach(card => {
    card.hidden = category !== 'all' && card.dataset.category !== category;
    if (!card.hidden) count++;
  });
  if (resultCount) resultCount.textContent = `${count}개의 활동 사례`;
}));

const form = document.querySelector('#inquiry-form');
if (form) {
  const chosen = new URLSearchParams(location.search).get('program');
  if ([...form.elements.program.options].some(option => option.value === chosen)) form.elements.program.value = chosen;
  const status = document.querySelector('#form-status');
  const submit = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    submit.disabled = true;
    submit.textContent = '접수 중입니다…';
    status.className = 'status';
    status.textContent = '';
    const data = Object.fromEntries(new FormData(form));
    data.consent = form.elements.consent.checked;
    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(20000)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || '접수를 완료하지 못했습니다. 잠시 후 다시 시도하거나 전화·이메일로 문의해 주세요.');
      status.className = 'status success';
      status.textContent = `교육 문의가 접수되었습니다.\n접수번호: ${result.reference}\n남겨주신 연락처로 문의 내용을 확인해 안내드리겠습니다.`;
      form.reset();
    } catch (error) {
      status.className = 'status error';
      status.textContent = error.name === 'TimeoutError'
        ? '접수 결과를 확인하지 못했습니다. 중복 접수 전 02-3472-4177 또는 kptchoi7205@gamil.com으로 확인해 주세요.'
        : error.message;
    } finally {
      submit.disabled = false;
      submit.innerHTML = '교육 문의 보내기 <span aria-hidden="true">↗</span>';
    }
  });
}
