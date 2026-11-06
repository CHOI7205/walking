import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import {handleInquiry,validateInquiry,purgeExpired} from '../server/inquiries.mjs';

const valid = {organization:'교육 검증용 기관',name:'테스트 담당자',phone:'02-0000-0000',email:'test@example.org',program:'community',region:'서울',participants:'20',schedule:'미정',message:'테스트를 위한 기관 교육 문의입니다.',consent:true,website:''};
const request = (data=valid,extra={})=>new Request('https://walk.test/api/inquiries',{method:'POST',headers:{Origin:'https://walk.test','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.20',...extra.headers},body:JSON.stringify(data),...extra});
function database() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(fs.readFileSync(new URL('../migrations/0001_inquiries.sql',import.meta.url),'utf8'));
  const wrap = (sql,args=[])=>({bind(...values){return wrap(sql,values);},async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}};}});
  return {sqlite,prepare:wrap,async batch(statements){sqlite.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());sqlite.exec('COMMIT');return results;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
}
test('server validates mandatory fields and consent',()=>{
  for (const change of [{name:''},{organization:''},{phone:'no-phone'},{email:'bad'},{program:'invalid'},{consent:false},{consent:'true'},{participants:'-1'},{message:'짧음'},{message:'x'.repeat(4001)}]) assert.ok(validateInquiry({...valid,...change}).error);
  assert.equal(validateInquiry(valid).data.participants,20);
  assert.equal(validateInquiry({...valid,participants:''}).data.participants,null);
});
test('requires same-origin JSON and protects unavailable storage',async()=>{
  assert.equal((await handleInquiry(request(valid,{headers:{Origin:'https://evil.test','Content-Type':'application/json'}}),{})).status,403);
  assert.equal((await handleInquiry(new Request('https://walk.test/api/inquiries'),{})).status,405);
  assert.equal((await handleInquiry(request(),{})).status,503);
  assert.equal((await handleInquiry(request({...valid,website:'spam'}),{})).status,400);
});
test('stores a validated inquiry before returning a receipt; no raw IP stored',async()=>{
  const db=database();
  const response=await handleInquiry(request({...valid,unexpected:'do not store'}),{DB:db,INQUIRY_HASH_SALT:'test-only-secret'});
  assert.equal(response.status,201);
  const result=await response.json();
  const row=db.sqlite.prepare('SELECT * FROM inquiries WHERE id = ?').get(result.reference);
  assert.ok(row);
  assert.match(row.ip_hash,/^[0-9a-f]{64}$/);
  assert.equal(JSON.parse(row.payload).unexpected,undefined);
  assert.equal(JSON.parse(row.payload).phone,valid.phone);
  assert.ok(row.expires_at-row.created_at < 90*86400);
  db.sqlite.close();
});
test('rate limit is applied to persisted inserts',async()=>{
  const db=database(), env={DB:db,INQUIRY_HASH_SALT:'test-only-secret'};
  for(let i=0;i<5;i++) assert.equal((await handleInquiry(request(),env)).status,201);
  assert.equal((await handleInquiry(request(),env)).status,429);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM inquiries').get().n,5);
  db.sqlite.close();
});
test('never reports success when storage fails',async()=>{
  const db={prepare(){return {bind(){return this;}};},async batch(){throw new Error('unavailable');}};
  assert.equal((await handleInquiry(request(),{DB:db,INQUIRY_HASH_SALT:'test-only-secret'})).status,503);
});
test('expired personal data is removed by scheduled cleanup',async()=>{
  const db=database();
  await handleInquiry(request(),{DB:db,INQUIRY_HASH_SALT:'test-only-secret'});
  await purgeExpired({DB:db},Date.now()+90*86400*1000);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM inquiries').get().n,0);
  db.sqlite.close();
});
