const MAX_BYTES = 16384;
const DAY = 86400;
const json = (status, value, extra = {}) => new Response(JSON.stringify(value), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex', ...extra }
});
const failure = (status, message, headers) => json(status, { message }, headers);
const strings = {organization:100,name:60,phone:30,email:200,region:100,schedule:100,message:4000};
const allowedPrograms = new Set(['community','school','workplace','experience','instructor','other']);

export function validateInquiry(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { error:'문의 내용을 확인해 주세요.' };
  const data = {};
  for (const [key,max] of Object.entries(strings)) {
    if (raw[key] != null && typeof raw[key] !== 'string') return {error:'입력 형식을 확인해 주세요.'};
    data[key] = (raw[key] || '').trim();
    if (data[key].length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(data[key])) return {error:'입력 내용이 너무 길거나 올바르지 않습니다.'};
  }
  if (!data.organization || !data.name || !data.phone || data.message.length < 10) return {error:'기관명, 담당자명, 연락처와 문의 내용(10자 이상)을 확인해 주세요.'};
  if (!/^[+\d\s().-]{7,30}$/.test(data.phone) || (data.phone.match(/\d/g)||[]).length < 7) return {error:'연락받으실 전화번호를 확인해 주세요.'};
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return {error:'이메일 주소를 확인해 주세요.'};
  if (!allowedPrograms.has(raw.program)) return {error:'희망 프로그램을 선택해 주세요.'};
  data.program = raw.program;
  if (raw.consent !== true) return {error:'개인정보 수집·이용 동의가 필요합니다.'};
  data.consent = true;
  data.participants = raw.participants === '' || raw.participants == null ? null : Number(raw.participants);
  if (data.participants !== null && (!Number.isInteger(data.participants) || data.participants < 1 || data.participants > 100000)) return {error:'예상 인원은 1명 이상의 숫자로 입력해 주세요.'};
  return {data};
}

async function readLimitedBody(request) {
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks = []; let length = 0;
  while (true) {
    const {done,value} = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_BYTES) { await reader.cancel(); throw new Error('TOO_LARGE'); }
    chunks.push(value);
  }
  const joined = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { joined.set(chunk,offset); offset += chunk.length; }
  return new TextDecoder().decode(joined);
}

export async function notifyInquiry(env, reference, data) {
  // Optional transactional email. A successful inquiry never depends on email delivery.
  if (!env.RESEND_API_KEY || !env.CONTACT_FROM) return;
  const labels = {organization:'기관명',name:'담당자',phone:'연락처',email:'이메일',program:'희망 프로그램',region:'교육 지역',participants:'예상 인원',schedule:'희망 시기',message:'문의 내용'};
  const text = `기관 교육 문의가 접수되었습니다.\n접수번호: ${reference}\n\n` + Object.entries(labels).map(([key,label])=>`${label}: ${data[key] ?? '미정'}`).join('\n');
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method:'POST',
      headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':reference},
      body:JSON.stringify({from:env.CONTACT_FROM,to:[env.CONTACT_TO || 'kptchoi7205@gamil.com'],subject:'[대한바른자세걷기협회] 기관 교육 문의 '+reference,text,...(data.email?{reply_to:data.email}:{})}),
      signal:AbortSignal.timeout(10000)
    });
    await env.DB.prepare('UPDATE inquiries SET notification_status = ? WHERE id = ?').bind(response.ok?'sent':'failed',reference).run();
  } catch {
    await env.DB.prepare('UPDATE inquiries SET notification_status = ? WHERE id = ?').bind('failed',reference).run();
  }
}

export async function handleInquiry(request, env, ctx = {}) {
  if (request.method !== 'POST') return failure(405,'POST 요청만 지원합니다.',{Allow:'POST'});
  const origin = request.headers.get('Origin');
  if (!origin || origin !== new URL(request.url).origin) return failure(403,'사이트의 문의 양식을 이용해 주세요.');
  if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) return failure(415,'올바른 문의 양식을 이용해 주세요.');
  if (Number(request.headers.get('Content-Length')) > MAX_BYTES) return failure(413,'문의 내용이 너무 깁니다.');
  let raw;
  try { raw = JSON.parse(await readLimitedBody(request)); }
  catch (e) { return failure(e.message==='TOO_LARGE'?413:400,'문의 내용을 읽지 못했습니다. 입력 내용을 확인해 주세요.'); }
  if (typeof raw?.website === 'string' && raw.website.trim()) return failure(400,'문의 양식을 확인해 주세요.');
  const result = validateInquiry(raw);
  if (result.error) return failure(400,result.error);
  if (!env.DB || !env.INQUIRY_HASH_SALT) return failure(503,'현재 온라인 접수 연결을 준비하고 있습니다. 02-3472-4177 또는 kptchoi7205@gamil.com으로 문의해 주세요.');
  const reference = 'WALK-' + crypto.randomUUID();
  const now = Math.floor(Date.now()/1000);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const hashBuffer = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(env.INQUIRY_HASH_SALT+':'+ip));
  const ipHash = Array.from(new Uint8Array(hashBuffer),b=>b.toString(16).padStart(2,'0')).join('');
  try {
    const operations = [
      env.DB.prepare('DELETE FROM inquiries WHERE expires_at <= ?').bind(now),
      env.DB.prepare(`INSERT INTO inquiries (id, created_at, expires_at, ip_hash, payload, notification_status)
        SELECT ?, ?, ?, ?, ?, ?
        WHERE (SELECT COUNT(*) FROM inquiries WHERE ip_hash = ? AND created_at > ?) < 5`)
        .bind(reference,now,now+89*DAY,ipHash,JSON.stringify(result.data),env.RESEND_API_KEY&&env.CONTACT_FROM?'pending':'not_configured',ipHash,now-3600)
    ];
    const outcome = await env.DB.batch(operations);
    if (outcome[1]?.meta?.changes !== 1) return failure(429,'문의가 여러 번 접수되었습니다. 한 시간 후 다시 시도하거나 전화로 문의해 주세요.',{'Retry-After':'3600'});
  } catch {
    return failure(503,'접수를 저장하지 못했습니다. 입력 내용은 그대로 유지됩니다. 잠시 후 다시 시도하거나 전화·이메일로 문의해 주세요.');
  }
  if (ctx.waitUntil) ctx.waitUntil(notifyInquiry(env,reference,result.data));
  else await notifyInquiry(env,reference,result.data);
  return json(201,{reference,message:'문의가 접수되었습니다.'});
}

export async function purgeExpired(env, timestamp = Date.now()) {
  if (env.DB) await env.DB.prepare('DELETE FROM inquiries WHERE expires_at <= ?').bind(Math.floor(timestamp/1000)).run();
}
