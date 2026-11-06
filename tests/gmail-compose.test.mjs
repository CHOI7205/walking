import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('Gmail inquiry preserves Korean content and special characters with a fixed recipient',()=>{
  const context=vm.createContext({URL,URLSearchParams,
    document:{querySelector(){return null;},querySelectorAll(){return [];},addEventListener(){}},
    window:{matchMedia(){return {addEventListener(){}};}}
  });
  vm.runInContext(fs.readFileSync(new URL('../assets/app.js',import.meta.url),'utf8'),context);
  const message='교육 일정 & 비용을 문의합니다.\n오전 10시 가능할까요? + # 확인';
  const url=new URL(context.createGmailInquiryUrl({organization:'걷기 & 건강센터',name:'테스트 담당자',phone:'02-0000-0000',message,to:'other@example.org'},'지역사회 바른 걷기'));
  assert.equal(url.origin,'https://mail.google.com');
  assert.equal(url.searchParams.get('to'),'kptchoi7205@gmail.com');
  assert.equal(url.searchParams.get('su'),'[기관 교육 문의] 걷기 & 건강센터');
  assert.ok(url.searchParams.get('body').includes(message));
  assert.ok(url.searchParams.get('body').includes('희망 프로그램: 지역사회 바른 걷기'));
  assert.ok(url.searchParams.get('body').includes('예상 인원: 미정'));
  assert.equal(url.searchParams.get('cc'),null);
});
