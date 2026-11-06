import { apiJson, boundedBody, ensurePressSchema, sameOrigin } from './storage.mjs';
const encoder=new TextEncoder();
const cookieName='walking_admin';
const hex=buffer=>Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,'0')).join('');
async function sign(secret,value){const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',key,encoder.encode(value)));}
async function equal(a,b){const [x,y]=await Promise.all([crypto.subtle.digest('SHA-256',encoder.encode(a)),crypto.subtle.digest('SHA-256',encoder.encode(b))]);const p=new Uint8Array(x),q=new Uint8Array(y);let n=0;for(let i=0;i<p.length;i++)n|=p[i]^q[i];return n===0;}
export function authReady(env){return typeof env.ADMIN_PASSWORD==='string'&&env.ADMIN_PASSWORD.length>=16;}
export async function isAdmin(request,env) {
  if(!authReady(env)) return false;
  const token=(request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);
  if(!token||token.length>300)return false;
  const [expiry,nonce,signature,...rest]=token.split('.');
  if(rest.length||!/^\d+$/.test(expiry)||!/^[a-f0-9-]{36}$/.test(nonce||'')||!/^[a-f0-9]{64}$/.test(signature||''))return false;
  const now=Math.floor(Date.now()/1000);
  if(Number(expiry)<=now||Number(expiry)>now+28800)return false;
  return equal(signature,await sign(env.ADMIN_PASSWORD,expiry+'.'+nonce));
}
export async function handleAuth(request,env) {
  const pathname=new URL(request.url).pathname;
  if(pathname==='/api/admin/session'&&request.method==='GET')return apiJson(200,{authenticated:await isAdmin(request,env),configured:authReady(env)});
  if(request.method!=='POST')return apiJson(405,{message:'지원하지 않는 요청입니다.'});
  if(!sameOrigin(request))return apiJson(403,{message:'같은 사이트에서 로그인해 주세요.'});
  const secure=new URL(request.url).protocol==='https:'?'; Secure':'';
  if(pathname==='/api/admin/logout')return apiJson(200,{ok:true},{'Set-Cookie':`${cookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`});
  if(!authReady(env))return apiJson(503,{message:'Cloudflare의 ADMIN_PASSWORD 비밀값을 16자 이상으로 설정한 뒤 다시 배포해 주세요.'});
  if(!env.DB)return apiJson(503,{message:'D1 데이터베이스 연결을 확인해 주세요.'});
  let input;try{input=JSON.parse(new TextDecoder().decode(await boundedBody(request,1024)));}catch{return apiJson(400,{message:'로그인 정보를 확인해 주세요.'});}
  if(typeof input.password!=='string'||input.password.length>512)return apiJson(400,{message:'비밀번호를 확인해 주세요.'});
  await ensurePressSchema(env.DB);
  const now=Math.floor(Date.now()/1000),ipHash=await sign(env.ADMIN_PASSWORD,request.headers.get('CF-Connecting-IP')||'local');
  const rate=await env.DB.batch([
    env.DB.prepare('DELETE FROM press_login_attempts WHERE attempted_at < ?').bind(now-900),
    env.DB.prepare('INSERT INTO press_login_attempts(id,ip_hash,attempted_at) SELECT ?,?,? WHERE (SELECT COUNT(*) FROM press_login_attempts WHERE ip_hash=? AND attempted_at>=?)<5').bind(crypto.randomUUID(),ipHash,now,ipHash,now-900)
  ]);
  if(rate[1]?.meta?.changes!==1)return apiJson(429,{message:'로그인 시도가 많습니다. 15분 후 다시 시도해 주세요.'},{'Retry-After':'900'});
  if(!await equal(input.password,env.ADMIN_PASSWORD))return apiJson(401,{message:'비밀번호가 올바르지 않습니다.'});
  const value=String(now+28800)+'.'+crypto.randomUUID();
  return apiJson(200,{authenticated:true},{'Set-Cookie':`${cookieName}=${value}.${await sign(env.ADMIN_PASSWORD,value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${secure}`});
}
