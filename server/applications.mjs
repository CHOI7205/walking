import { apiJson, sameOrigin, readJsonBody } from './storage.mjs';
import { isAdmin } from './auth.mjs';
const schema = [
  `CREATE TABLE IF NOT EXISTS applications (id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, ip_hash TEXT NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL, program TEXT NOT NULL, consent INTEGER NOT NULL)`,
  'CREATE INDEX IF NOT EXISTS applications_rate ON applications(ip_hash, created_at)',
  `CREATE TABLE IF NOT EXISTS application_notifications (application_id TEXT PRIMARY KEY, status TEXT NOT NULL, FOREIGN KEY(application_id) REFERENCES applications(id) ON DELETE CASCADE)`
];
export async function handleApplications(request, env) {
  const admin = new URL(request.url).pathname === '/api/admin/applications';
  if (admin && !await isAdmin(request, env)) return apiJson(401,{message:'관리자 로그인이 필요합니다.'});
  if (request.method !== (admin?'GET':'POST')) return apiJson(405,{message:'지원하지 않는 요청입니다.'});
  if (!admin && !sameOrigin(request)) return apiJson(403,{message:'홈페이지에서 신청해 주세요.'});
  if (!env.DB) return apiJson(503,{message:'접수 연결을 확인하고 있습니다. 잠시 후 다시 시도해 주세요.'});
  let data;
  if (!admin) {
    try { data = await readJsonBody(request,4096); } catch { return apiJson(400,{message:'신청 내용을 확인해 주세요.'}); }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return apiJson(400,{message:'신청 내용을 확인해 주세요.'});
    for (const [key,max] of Object.entries({name:60,phone:30,email:200})) {
      if (typeof data[key] !== 'string' || !data[key].trim() || data[key].length>max || /[\x00-\x1f]/.test(data[key])) return apiJson(400,{message:'이름, 전화번호, 이메일을 확인해 주세요.'});
      data[key]=data[key].trim();
    }
    if (!/^[+\d ().-]{7,30}$/.test(data.phone) || (data.phone.match(/\d/g)||[]).length<7 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || data.program!=='슬로우조깅' || data.consent!==true || data.website) return apiJson(400,{message:'입력 내용과 개인정보 수집·이용 동의를 확인해 주세요.'});
  }
  await env.DB.batch(schema.map(sql=>env.DB.prepare(sql)));
  const now=Math.floor(Date.now()/1000);
  await env.DB.prepare('DELETE FROM applications WHERE expires_at <= ?').bind(now).run();
  if (admin) {
    const rows=await env.DB.prepare('SELECT id, created_at, name, phone, email, program FROM applications ORDER BY created_at DESC LIMIT 200').all();
    return apiJson(200,{applications:rows.results});
  }
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode((env.INQUIRY_HASH_SALT||env.ADMIN_PASSWORD||new URL(request.url).origin)+':'+Math.floor(now/86400)+':'+(request.headers.get('CF-Connecting-IP')||'unknown')));
  const ipHash=Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
  const reference='JOG-'+crypto.randomUUID();
  const result=await env.DB.prepare(`INSERT INTO applications (id,created_at,expires_at,ip_hash,name,phone,email,program,consent) SELECT ?,?,?,?,?,?,?,?,1 WHERE (SELECT COUNT(*) FROM applications WHERE ip_hash=? AND created_at>?)<5`).bind(reference,now,now+89*86400,ipHash,data.name,data.phone,data.email,data.program,ipHash,now-3600).run();
  if(result.meta?.changes!==1)return apiJson(429,{message:'신청이 여러 번 접수되었습니다. 잠시 후 다시 시도해 주세요.'});
  const notification = await notifyApplication(env, reference, data);
  return apiJson(201,{reference,notification,message:'신청이 접수되었습니다.'});
}

export async function notifyApplication(env, reference, data) {
  let status = 'not_configured';
  if (env.RESEND_API_KEY && env.CONTACT_FROM) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method:'POST',
        headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':reference},
        body:JSON.stringify({from:env.CONTACT_FROM,to:['physiocompany@naver.com'],reply_to:data.email,
          subject:'[대한바른자세걷기협회] 슬로우조깅 신청 '+reference,
          text:`슬로우조깅 신청이 접수되었습니다.\n접수번호: ${reference}\n이름: ${data.name}\n전화번호: ${data.phone}\n이메일: ${data.email}\n프로그램: ${data.program}`}),
        signal:AbortSignal.timeout(10000)
      });
      status = response.ok ? 'sent' : 'failed';
    } catch { status = 'failed'; }
  }
  // A mail failure must not lose an application already saved in the database.
  try { await env.DB.prepare('INSERT OR REPLACE INTO application_notifications (application_id,status) VALUES (?,?)').bind(reference,status).run(); } catch {}
  return status;
}
