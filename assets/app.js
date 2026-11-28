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
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (form.dataset.submitting || form.dataset.complete || !form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    if (data.website?.trim()) return;
    data.consent = form.elements.consent.checked;
    const button = form.querySelector('[type="submit"]');
    form.dataset.submitting = 'true';
    button.disabled = true;
    button.textContent = '접수 중…';
    status.className = 'status';
    status.textContent = '';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch('/api/inquiries', {method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:controller.signal});
      const result = await response.json();
      if (!response.ok || !result.reference) throw new Error(result.message || '문의를 접수하지 못했습니다.');
      form.dataset.complete = 'true';
      button.textContent = '문의 접수 완료';
      status.className = 'status success';
      status.textContent = '문의가 접수되었습니다. 접수번호: ' + result.reference + (result.notification === 'sent' ? ' · 협회 이메일로 문의 내용을 전송했습니다.' : ' · 문의는 안전하게 저장됐지만 이메일 알림은 전송되지 않았습니다. 확인이 필요하시면 02-3472-4177로 연락해 주세요.') + ' 담당자가 확인 후 연락드리겠습니다.';
    } catch (error) {
      status.className = 'status error';
      status.textContent = error.name === 'AbortError' ? '접수 결과를 확인하지 못했습니다. 중복 접수를 피하려면 02-3472-4177로 확인해 주세요. 입력 내용은 유지됩니다.' : error.message + ' 입력 내용은 유지됩니다.';
      button.disabled = false;
      button.textContent = '문의하기';
    } finally {
      clearTimeout(timeout);
      delete form.dataset.submitting;
    }
  });
}

const classNotice = document.querySelector('.class-notice');
if (classNotice && typeof classNotice.showModal === 'function') {
  const noticeKey = 'slow-jogging-park-notice-v1';
  const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
  let hiddenToday = false;
  try { hiddenToday = localStorage.getItem(noticeKey) === today(); } catch {}
  classNotice.querySelector('[data-notice-close]').addEventListener('click', () => classNotice.close());
  classNotice.querySelector('[data-notice-today]').addEventListener('click', () => {
    try { localStorage.setItem(noticeKey, today()); } catch {}
    classNotice.close();
  });
  classNotice.addEventListener('click', event => {
    if (event.target !== classNotice) return;
    const rect = classNotice.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) classNotice.close();
  });
  if (!hiddenToday) classNotice.showModal();
}

const applicationForm = document.querySelector('#application-form');
applicationForm?.addEventListener('submit', async event => {
  event.preventDefault();
  if (applicationForm.dataset.submitting || applicationForm.dataset.complete || !applicationForm.reportValidity()) return;
  const button = applicationForm.querySelector('[type="submit"]');
  const status = document.querySelector('#application-status');
  applicationForm.dataset.submitting = 'true';
  button.disabled = true;
  button.textContent = '접수 중…';
  status.textContent = '';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const data = Object.fromEntries(new FormData(applicationForm));
    data.consent = applicationForm.elements.consent.checked;
    const response = await fetch('/api/applications', {method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data), signal:controller.signal});
    const result = await response.json();
    if (!response.ok || !result.reference) throw new Error(result.message || '접수를 완료하지 못했습니다.');
    applicationForm.dataset.complete = 'true';
    button.textContent = '신청 완료';
    status.textContent = '신청이 접수되었습니다. 접수번호: ' + result.reference + (result.notification === 'sent' ? ' · 협회 이메일로 신청 알림을 전송했습니다.' : ' · 신청은 저장되었습니다. 이메일 알림은 미전송 상태이며 협회에서 관리자 화면으로 확인할 수 있습니다.') + ' 일정 안내는 협회에서 연락드립니다.';
    status.className = 'status success';
  } catch (error) {
    status.className = 'status error';
    status.textContent = error.name === 'AbortError' ? '접수 결과를 확인하지 못했습니다. 중복 신청을 피하려면 협회에 확인해 주세요. 입력 내용은 유지됩니다.' : (error.message + ' 입력 내용은 유지됩니다. 다시 시도해 주세요.');
    button.disabled = false;
    button.textContent = '신청하기';
  } finally {
    clearTimeout(timeout);
    delete applicationForm.dataset.submitting;
  }
});
