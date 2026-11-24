import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function setup(email,ok=true){
  let submit,requests=0,opened=0;
  const data={organization:'건강 & 교육센터',name:'검증 담당자',phone:'0200000000',email,program:'community',message:'학생들을 위한 교육프로그램 제작 문의입니다.',website:''};
  const button={},status={};
  const form={dataset:{},elements:{program:{options:[]},consent:{checked:true}},reportValidity:()=>true,querySelector:()=>button,addEventListener:(type,fn)=>{submit=fn;}};
  const context=vm.createContext({URL,URLSearchParams,AbortController,setTimeout,clearTimeout,location:{search:''},
    FormData:function(){return Object.entries(data);},
    document:{querySelector:s=>s==='#inquiry-form'?form:s==='#form-status'?status:null,querySelectorAll:()=>[],addEventListener(){}},
    window:{matchMedia:()=>({addEventListener(){}}),open:()=>opened++},
    fetch:async(url,options)=>{requests++;assert.equal(url,'/api/inquiries');const body=JSON.parse(options.body);assert.equal(body.email,email);assert.equal(body.message,data.message);assert.equal(body.consent,true);return {ok,json:async()=>ok?{reference:'WALK-test',notification:'sent'}:{message:'접수 오류'}};}
  });
  vm.runInContext(fs.readFileSync(new URL('../assets/app.js',import.meta.url),'utf8'),context);
  return {form,button,status,submit:()=>submit({preventDefault(){}}),counts:()=>({requests,opened})};
}
test('inquiry submits directly for different email providers and prevents duplicate submissions',async()=>{
  for(const email of ['contact@naver.com','contact@daum.net','contact@gmail.com','contact@example.org']){
    const ui=setup(email);await ui.submit();await ui.submit();
    assert.deepEqual(ui.counts(),{requests:1,opened:0});
    assert.equal(ui.button.textContent,'문의 접수 완료');assert.ok(ui.status.textContent.includes('WALK-test'));
  }
});
test('failed inquiry keeps the form available for correction and retry',async()=>{
  const ui=setup('contact@example.org',false);await ui.submit();
  assert.equal(ui.form.dataset.complete,undefined);assert.equal(ui.button.disabled,false);
  assert.ok(ui.status.textContent.includes('입력 내용은 유지됩니다'));
});
