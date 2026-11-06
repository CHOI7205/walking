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

function createGmailInquiryUrl(data, programLabel) {
  const lines = [
    '대한바른자세걷기협회 기관 교육 문의', '',
    `기관명: ${data.organization || ''}`, `담당자: ${data.name || ''}`,
    `연락처: ${data.phone || ''}`, `회신 이메일: ${data.email || '미기재'}`,
    `희망 프로그램: ${programLabel || data.program || ''}`,
    `교육 지역: ${data.region || '미정'}`, `예상 인원: ${data.participants || '미정'}`,
    `희망 시기: ${data.schedule || '미정'}`, '', '문의 내용', data.message || ''
  ];
  const url = new URL('https://mail.google.com/mail/');
  url.search = new URLSearchParams({view:'cm', fs:'1', to:'kptchoi7205@gmail.com',
    su:`[기관 교육 문의] ${data.organization || ''}`, body:lines.join('\n')});
  return url.href;
}

const form = document.querySelector('#inquiry-form');
if (form) {
  const chosen = new URLSearchParams(location.search).get('program');
  if ([...form.elements.program.options].some(option => option.value === chosen)) form.elements.program.value = chosen;
  const status = document.querySelector('#form-status');
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    if (data.website?.trim()) return;
    const label = form.elements.program.selectedOptions[0]?.textContent;
    const url = createGmailInquiryUrl(data, label);
    // Open synchronously in the visitor's click, without an API or mail-service signup.
    window.open(url, '_blank', 'noopener,noreferrer');
    status.className = 'status';
    status.textContent = 'Gmail 작성창에서 받는 사람과 내용을 확인한 뒤, Gmail의 ‘보내기’를 눌러 주세요. 아직 메일을 발송한 상태는 아닙니다. ';
    const retry = document.createElement('a');
    retry.href = url;
    retry.target = '_blank';
    retry.rel = 'noopener noreferrer';
    retry.textContent = 'Gmail 작성창 다시 열기';
    retry.style.textDecoration = 'underline';
    status.append(retry);
  });
}
