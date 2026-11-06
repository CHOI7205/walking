(() => {
const $=selector=>document.querySelector(selector);
const form=$('#post-form'),loginForm=$('#login-form');
let current=null,assets=[],coverId='',posts=[],dirty=false,busy=false;
function message(target,text,error=false){target.textContent=text;target.className='status'+(error?' error':'');}
async function api(path,options={}){
  const response=await fetch(path,{credentials:'same-origin',...options});
  const data=await response.json().catch(()=>({message:'서버 응답을 확인하지 못했습니다.'}));
  if(!response.ok){if(response.status===401&&path!=='/api/admin/login')showLogin();throw new Error(data.message||'요청을 완료하지 못했습니다.');}
  return data;
}
function jsonRequest(method,data){return {method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)};}
function showLogin(){$('#login-panel').hidden=false;$('#cms-workspace').hidden=true;}
function showWorkspace(){$('#login-panel').hidden=true;$('#cms-workspace').hidden=false;}
function setBusy(value){busy=value;form.querySelectorAll('button').forEach(b=>b.disabled=value);$('#new-post').disabled=value;$('#logout').disabled=value;$('#upload-file').disabled=value;}
function formValue(name){return form.elements.namedItem(name).value;}
function payload(status){return {...Object.fromEntries(new FormData(form)),status,asset_ids:assets.map(a=>a.id),cover_id:coverId,version:current?.version};}
function dirtyState(){dirty=true;$('#save-state').textContent='저장하지 않은 변경사항';}
form.addEventListener('input',dirtyState);
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
function confirmLeave(){return !dirty||window.confirm('저장하지 않은 내용이 있습니다. 이동하시겠습니까?');}
function renderList(){
  const list=$('#post-list');list.replaceChildren();
  const q=$('#post-filter').value.trim().toLowerCase();
  const visible=posts.filter(p=>p.title.toLowerCase().includes(q));
  if(!visible.length){const p=document.createElement('p');p.className='cms-hint';p.textContent='작성한 글이 없습니다. 새 글을 시작해 보세요.';list.append(p);return;}
  for(const post of visible){const button=document.createElement('button');button.type='button';button.className='cms-post-item'+(post.id===current?.id?' active':'');const badge=document.createElement('span');badge.className='pill';badge.textContent=post.status==='published'?'발행됨':'임시저장';const title=document.createElement('strong');title.textContent=post.title;const time=document.createElement('small');time.textContent=new Date(post.updated_at).toLocaleDateString('ko-KR');button.append(badge,title,time);button.addEventListener('click',()=>{if(!busy&&confirmLeave())loadPost(post.id);});list.append(button);}
}
async function refreshList(){try{posts=(await api('/api/admin/posts')).posts;renderList();message($('#list-status'),'');}catch(e){message($('#list-status'),e.message,true);}}
$('#post-filter').addEventListener('input',renderList);
function renderAssets(){
  const list=$('#asset-list');list.replaceChildren();
  for(const asset of assets){const row=document.createElement('div');row.className='cms-asset';const image=asset.content_type.startsWith('image/');if(image){const img=document.createElement('img');img.src='/media/'+asset.id;img.alt=asset.filename;row.append(img);}const info=document.createElement('div');info.className='cms-asset-info';const title=document.createElement('strong');title.textContent=asset.filename;info.append(title);const actions=document.createElement('div');actions.className='cms-asset-actions';
    function button(label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>{if(!busy)fn();});actions.append(b);}
    if(image){button(coverId===asset.id?'✓ 대표 사진':'대표 사진으로',()=>{coverId=asset.id;dirtyState();renderAssets();});button('본문에 넣기',()=>{const textarea=form.elements.body;const marker='\n\n!['+asset.filename.replace(/[\[\]]/g,'')+'](/media/'+asset.id+')\n\n';textarea.setRangeText(marker,textarea.selectionStart,textarea.selectionEnd,'end');textarea.focus();dirtyState();});}
    button('연결 해제',()=>{const marker='](/media/'+asset.id+')';if(formValue('body').includes(marker)){message($('#upload-status'),'본문에서 이 사진을 먼저 지워주세요.',true);return;}assets=assets.filter(a=>a.id!==asset.id);if(coverId===asset.id)coverId='';dirtyState();renderAssets();});info.append(actions);row.append(info);list.append(row);}
}
function resetEditor(){current=null;assets=[];coverId='';form.reset();form.elements.slug.readOnly=false;dirty=false;$('#editor-state').textContent='새 글';$('#save-state').textContent='저장 전';$('#unpublish-button').hidden=true;$('#published-link').hidden=true;$('#post-preview').hidden=true;message($('#editor-status'),'');message($('#upload-status'),'');renderAssets();renderList();}
$('#new-post').addEventListener('click',()=>{if(confirmLeave()){resetEditor();form.elements.title.focus();}});
async function loadPost(id){setBusy(true);try{const result=await api('/api/admin/posts/'+id);current=result.post;assets=result.assets;coverId=current.cover_id;for(const [key,value] of Object.entries(current)){const field=form.elements.namedItem(key);if(field&&typeof field.value==='string')field.value=value??'';}form.elements.slug.readOnly=!!current.published_at;$('#editor-state').textContent=current.status==='published'?'발행된 글':'임시저장';$('#save-state').textContent='마지막 저장 '+new Date(current.updated_at).toLocaleString('ko-KR');$('#unpublish-button').hidden=current.status!=='published';$('#published-link').hidden=current.status!=='published';$('#published-link').href='/press/'+current.slug+'/';dirty=false;$('#post-preview').hidden=true;renderAssets();renderList();message($('#editor-status'),'');}catch(e){message($('#editor-status'),e.message,true);}finally{setBusy(false);}}
loginForm.addEventListener('submit',async event=>{event.preventDefault();const button=loginForm.querySelector('button');button.disabled=true;try{await api('/api/admin/login',jsonRequest('POST',{password:loginForm.elements.password.value}));loginForm.reset();showWorkspace();resetEditor();await refreshList();}catch(e){message($('#login-status'),e.message,true);}finally{button.disabled=false;}});
$('#logout').addEventListener('click',async()=>{if(!confirmLeave())return;try{await api('/api/admin/logout',jsonRequest('POST',{}));dirty=false;resetEditor();posts=[];renderList();showLogin();}catch(e){message($('#editor-status'),e.message,true);}});
async function savePost(status){
  if(busy||!form.reportValidity())return;
  if(status==='published'&&!window.confirm('이 글을 홈페이지에 공개하시겠습니까?'))return;
  setBusy(true);message($('#editor-status'),'저장 중입니다…');
  try{const result=await api('/api/admin/posts'+(current?'/'+current.id:''),jsonRequest(current?'PUT':'POST',payload(status)));dirty=false;await loadPost(result.id);await refreshList();message($('#editor-status'),status==='published'?'발행했습니다. 보도자료 목록에서 확인할 수 있습니다.':'임시저장했습니다. 공개 목록에는 표시되지 않습니다.');}
  catch(e){message($('#editor-status'),e.message,true);}finally{setBusy(false);}
}
form.addEventListener('submit',event=>{event.preventDefault();savePost(event.submitter?.dataset.action||'draft');});
$('#unpublish-button').addEventListener('click',()=>{if(window.confirm('공개 목록과 기사 페이지에서 이 글을 비공개로 전환하시겠습니까?'))savePost('draft');});
$('#upload-file').addEventListener('change',async event=>{
  const files=[...event.target.files];if(!files.length||busy)return;
  if(assets.length+files.length>20){message($('#upload-status'),'글에는 파일을 최대 20개까지 연결할 수 있습니다.',true);event.target.value='';return;}
  setBusy(true);
  try{for(const file of files){if(file.size>10*1024*1024)throw new Error('파일은 10MB 이하로 올려주세요.');if(!['image/jpeg','image/png','image/webp','application/pdf'].includes(file.type))throw new Error('JPG, PNG, WebP 또는 PDF 파일을 선택해 주세요.');message($('#upload-status'),file.name+' 업로드 중…');const asset=await api('/api/admin/uploads',{method:'POST',headers:{'Content-Type':file.type,'X-Filename':encodeURIComponent(file.name)},body:file});assets.push(asset);if(!coverId&&asset.content_type.startsWith('image/'))coverId=asset.id;dirtyState();renderAssets();}message($('#upload-status'),'업로드했습니다. 글을 저장하면 파일 연결이 반영됩니다.');}
  catch(e){message($('#upload-status'),e.message,true);}finally{setBusy(false);event.target.value='';}
});
$('#preview-button').addEventListener('click',async()=>{if(!form.reportValidity()||busy)return;setBusy(true);try{const data=await api('/api/admin/preview',jsonRequest('POST',payload('draft')));$('#preview-content').innerHTML=data.html;$('#post-preview').hidden=false;$('#post-preview').scrollIntoView({behavior:'smooth',block:'start'});}catch(e){message($('#editor-status'),e.message,true);}finally{setBusy(false);}});
api('/api/admin/session').then(async result=>{if(result.authenticated){showWorkspace();resetEditor();await refreshList();}else if(!result.configured){message($('#login-status'),'관리자 비밀번호 설정 후 이용할 수 있습니다. Cloudflare의 ADMIN_PASSWORD 비밀값을 확인해 주세요.',true);}}).catch(error=>message($('#login-status'),error.message,true));
})();
