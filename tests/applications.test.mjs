import test from 'node:test';
import assert from 'node:assert/strict';
import {notifyApplication} from '../server/applications.mjs';
import worker from '../server/worker.mjs';
import {localBindings} from '../scripts/local-storage.mjs';
const valid={name:'신청 테스트',phone:'010-1234-5678',email:'test@example.org',program:'슬로우조깅',consent:true};
const request=(data=valid,origin='https://walk.test')=>new Request('https://walk.test/api/applications',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1'},body:JSON.stringify(data)});
test('application saves before receipt, validates input, rate limits and protects applicant list',async()=>{
  const env=localBindings();
  const call=req=>worker.fetch(req,env,{});
  assert.equal((await call(request(valid,'https://evil.test'))).status,403);
  assert.equal((await call(request({...valid,consent:false}))).status,400);
  assert.equal((await call(request({...valid,email:'invalid'}))).status,400);
  const response=await call(request());
  assert.equal(response.status,201);
  const {reference}=await response.json();
  const row=await env.DB.prepare('SELECT * FROM applications WHERE id=?').bind(reference).first();
  assert.equal(row.name,valid.name);
  assert.equal(row.phone,valid.phone);
  assert.equal((await call(new Request('https://walk.test/api/admin/applications'))).status,401);
  const login=await call(new Request('https://walk.test/api/admin/login',{method:'POST',headers:{Origin:'https://walk.test','Content-Type':'application/json'},body:JSON.stringify({password:env.ADMIN_PASSWORD})}));
  const list=await call(new Request('https://walk.test/api/admin/applications',{headers:{Cookie:login.headers.get('Set-Cookie').split(';')[0]}}));
  assert.equal((await list.json()).applications[0].id,reference);
  for(let i=0;i<4;i++)assert.equal((await call(request())).status,201);
  assert.equal((await call(request())).status,429);
});
test('application never succeeds without durable storage',async()=>{
  assert.equal((await worker.fetch(request(),{},{})).status,503);
  const DB={prepare(){return {};},async batch(){throw Error('storage failed');}};
  assert.equal((await worker.fetch(request(),{DB},{})).status,503);
});

test('phone accepts numbers without hyphens',async()=>{
  const response=await worker.fetch(request({...valid,phone:'01012345678'}),localBindings(),{});
  assert.equal(response.status,201);
  assert.equal((await response.json()).notification,'not_configured');
});
test('application notification goes to designated inbox and reports provider failure',async()=>{
  const original=globalThis.fetch;
  const env={...localBindings(),RESEND_API_KEY:'test-key',CONTACT_FROM:'notice@example.org'};
  try {
    globalThis.fetch=async(url,options)=>{
      assert.equal(url,'https://api.resend.com/emails');
      const payload=JSON.parse(options.body);
      assert.deepEqual(payload.to,['physiocompany@naver.com']);
      assert.equal(payload.reply_to,valid.email);
      assert.ok(payload.text.includes(valid.phone));
      return new Response('{}',{status:200});
    };
    assert.equal(await notifyApplication(env,'JOG-test',valid),'sent');
    globalThis.fetch=async()=>new Response('{}',{status:403});
    assert.equal(await notifyApplication(env,'JOG-fail',valid),'failed');
  } finally {globalThis.fetch=original;}
});
