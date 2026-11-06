import { apiJson, ensurePressSchema, sameOrigin, readJsonBody, boundedBody } from './storage.mjs';
import { isAdmin } from './auth.mjs';
import { bundledPosts } from './bundled-posts.mjs';
export const categories=['보도자료','협회소식'];
export function validatePost(raw) {
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('글 내용을 확인해 주세요.');
  const limits={title:180,excerpt:300,body:50000,author:100,source_name:100,source_url:2000,cover_id:80,cover_alt:300,slug:100};
  const post={};
  for(const [key,max] of Object.entries(limits)){if(raw[key]!=null&&typeof raw[key]!=='string')throw new Error('입력 형식을 확인해 주세요.');post[key]=(raw[key]||'').trim();if(post[key].length>max)throw new Error(`${key} 항목이 너무 깁니다.`);}
  if(!post.title||post.body.length<10)throw new Error('제목과 본문(10자 이상)을 입력해 주세요.');
  post.excerpt ||= post.body.replace(/[#*\[\]]/g,'').slice(0,160);
  post.author ||= '대한바른자세걷기협회';
  post.slug ||= 'post-'+new Date().toISOString().slice(0,10)+'-'+crypto.randomUUID().slice(0,8);
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug))throw new Error('글 주소는 영문 소문자, 숫자와 하이픈으로 입력해 주세요.');
  if(post.source_url){try{const u=new URL(post.source_url);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)throw 0;}catch{throw new Error('기사 원문 링크는 http 또는 https 주소로 입력해 주세요.');}}
  if(!categories.includes(raw.category))throw new Error('글 분류를 선택해 주세요.');
  if(!['draft','published'].includes(raw.status))throw new Error('저장 상태를 확인해 주세요.');
  if(!Array.isArray(raw.asset_ids)||raw.asset_ids.length>20||raw.asset_ids.some(id=>typeof id!=='string'||!/^[a-f0-9-]{36}$/.test(id)))throw new Error('첨부파일 목록을 확인해 주세요.');
  post.asset_ids=[...new Set([...raw.asset_ids,...(post.cover_id?[post.cover_id]:[])])];
  if(post.asset_ids.length>20)throw new Error('파일은 최대 20개까지 연결할 수 있습니다.');
  post.category=raw.category;post.status=raw.status;
  return post;
}
export const publicPost = post => ({...post,asset_ids:JSON.parse(post.asset_ids||'[]')});
export async function listPublished(db,{q='',category='',page=1,limit=9}={}) {
  const bundled=bundledPosts.filter(post=>(!q||(post.title+' '+post.excerpt).includes(q))&&(!categories.includes(category)||post.category===category));
  const where=['status = ?'],args=['published'];
  if(q){where.push('(title LIKE ? OR excerpt LIKE ?)');args.push('%'+q+'%','%'+q+'%');}
  if(categories.includes(category)){where.push('category = ?');args.push(category);}
  let rows=[];
  if(db){await ensurePressSchema(db);const result=await db.prepare(`SELECT id,slug,title,excerpt,category,author,cover_id,cover_alt,published_at,updated_at FROM press_posts WHERE ${where.join(' AND ')} ORDER BY published_at DESC,id DESC LIMIT ? OFFSET ?`).bind(...args,page*limit+1,0).all();rows=result.results;}
  const slugs=new Set(rows.map(post=>post.slug));
  const posts=[...rows,...bundled.filter(post=>!slugs.has(post.slug))].sort((a,b)=>b.published_at.localeCompare(a.published_at)||b.id.localeCompare(a.id));
  return {posts:posts.slice((page-1)*limit,page*limit),hasMore:posts.length>page*limit};
}
function fileType(bytes,declared) {
  const header=Array.from(bytes.subarray(0,12));
  if(declared==='image/jpeg'&&header[0]===255&&header[1]===216&&header[2]===255)return 'jpg';
  if(declared==='image/png'&&[137,80,78,71,13,10,26,10].every((n,i)=>header[i]===n))return 'png';
  if(declared==='image/webp'&&new TextDecoder().decode(bytes.subarray(0,4))==='RIFF'&&new TextDecoder().decode(bytes.subarray(8,12))==='WEBP')return 'webp';
  if(declared==='application/pdf'&&new TextDecoder().decode(bytes.subarray(0,5))==='%PDF-')return 'pdf';
  return null;
}
export async function handleUploads(request,env) {
  if(!env.MEDIA)return apiJson(503,{message:'R2 저장소 연결을 확인해 주세요.'});
  const type=(request.headers.get('Content-Type')||'').split(';')[0].trim();
  let bytes;try{bytes=await boundedBody(request,10*1024*1024);}catch{return apiJson(413,{message:'파일은 10MB 이하로 올려주세요.'});}
  const ext=fileType(bytes,type);
  if(!ext)return apiJson(400,{message:'JPG, PNG, WebP 이미지 또는 PDF 파일만 업로드할 수 있습니다.'});
  let filename;try{filename=decodeURIComponent(request.headers.get('X-Filename')||'file.'+ext).replace(/[\r\n\u0000]/g,'').slice(0,180);}catch{return apiJson(400,{message:'파일 이름을 확인해 주세요.'});}
  const id=crypto.randomUUID(),key='press/'+id+'.'+ext;
  await env.MEDIA.put(key,bytes,{httpMetadata:{contentType:type}});
  try{await env.DB.prepare('INSERT INTO press_media(id,object_key,filename,content_type,size,created_at) VALUES(?,?,?,?,?,?)').bind(id,key,filename,type,bytes.length,new Date().toISOString()).run();}
  catch(e){await env.MEDIA.delete(key);throw e;}
  return apiJson(201,{id,filename,content_type:type,size:bytes.length,url:'/media/'+id});
}
export async function handlePressAdmin(request,env) {
  if(!await isAdmin(request,env))return apiJson(401,{message:'관리자 로그인이 필요합니다.'});
  if(!env.DB)return apiJson(503,{message:'D1 연결을 확인해 주세요.'});
  if(request.method!=='GET'&&!sameOrigin(request))return apiJson(403,{message:'같은 사이트에서 요청해 주세요.'});
  await ensurePressSchema(env.DB);
  const url=new URL(request.url),path=url.pathname;
  if(path==='/api/admin/preview'&&request.method==='POST'){
    let post;try{post=validatePost(await readJsonBody(request));}catch(e){return apiJson(400,{message:e.message});}
    const {renderMarkdown,escapeHtml}=await import('./render-press.mjs');
    return apiJson(200,{html:`<span class="pill">${escapeHtml(post.category)}</span><h2>${escapeHtml(post.title)}</h2><p class="lead">${escapeHtml(post.excerpt)}</p>${post.cover_id?`<img class="preview-cover" src="/media/${escapeHtml(post.cover_id)}" alt="${escapeHtml(post.cover_alt||post.title)}">`:''}${renderMarkdown(post.body,post.asset_ids)}`});
  }
  if(path==='/api/admin/uploads'&&request.method==='POST')return handleUploads(request,env);
  if(path==='/api/admin/posts'&&request.method==='GET'){
    const list=await env.DB.prepare('SELECT id,slug,title,status,category,updated_at,version FROM press_posts ORDER BY updated_at DESC LIMIT 200').all();
    return apiJson(200,{posts:list.results});
  }
  const id=path.match(/^\/api\/admin\/posts\/([a-f0-9-]{36})$/)?.[1];
  if(id&&request.method==='GET'){
    const post=await env.DB.prepare('SELECT * FROM press_posts WHERE id=?').bind(id).first();
    if(!post)return apiJson(404,{message:'글을 찾을 수 없습니다.'});
    const ids=JSON.parse(post.asset_ids||'[]'),assets=[];
    for(const aid of ids){const a=await env.DB.prepare('SELECT id,filename,content_type,size FROM press_media WHERE id=?').bind(aid).first();if(a)assets.push(a);}
    return apiJson(200,{post:publicPost(post),assets});
  }
  if((!id&&path==='/api/admin/posts'&&request.method==='POST')||(id&&request.method==='PUT')){
    let raw,post;try{raw=await readJsonBody(request);post=validatePost(raw);}catch(e){return apiJson(400,{message:e.message==='BODY_TOO_LARGE'?'글이 너무 깁니다.':e.message});}
    let old=null;
    if(id){old=await env.DB.prepare('SELECT * FROM press_posts WHERE id=?').bind(id).first();if(!old)return apiJson(404,{message:'글을 찾을 수 없습니다.'});if(old.version!==raw.version)return apiJson(409,{message:'다른 창에서 수정한 내용이 있습니다. 글을 다시 열어 주세요.'});if(old.published_at&&old.slug!==post.slug)return apiJson(409,{message:'한 번 발행한 글의 주소는 유지해 주세요.'});}
    for(const assetId of post.asset_ids){const asset=await env.DB.prepare('SELECT content_type FROM press_media WHERE id=?').bind(assetId).first();if(!asset)return apiJson(400,{message:'존재하지 않는 첨부파일이 있습니다.'});if(assetId===post.cover_id&&!asset.content_type.startsWith('image/'))return apiJson(400,{message:'대표 사진에는 이미지 파일을 선택해 주세요.'});}
    // Images embedded in body must belong to this post and exist in storage metadata.
    for(const match of post.body.matchAll(/!\[[^\]]*\]\(\/media\/([a-f0-9-]{36})\)/g))if(!post.asset_ids.includes(match[1]))return apiJson(400,{message:'본문 사진을 첨부파일 목록에 연결해 주세요.'});
    const now=new Date().toISOString(),postId=id||crypto.randomUUID(),published=old?.published_at||(post.status==='published'?now:null);
    try{
      let saved;
      if(id){saved=await env.DB.prepare(`UPDATE press_posts SET slug=?,title=?,excerpt=?,body=?,category=?,author=?,source_name=?,source_url=?,cover_id=?,cover_alt=?,asset_ids=?,status=?,updated_at=?,published_at=?,version=version+1 WHERE id=? AND version=?`).bind(post.slug,post.title,post.excerpt,post.body,post.category,post.author,post.source_name,post.source_url,post.cover_id,post.cover_alt,JSON.stringify(post.asset_ids),post.status,now,published,postId,raw.version).run();if(saved.meta.changes!==1)return apiJson(409,{message:'다른 창에서 먼저 저장했습니다. 글을 다시 열어 주세요.'});}
      else await env.DB.prepare('INSERT INTO press_posts(id,slug,title,excerpt,body,category,author,source_name,source_url,cover_id,cover_alt,asset_ids,status,created_at,updated_at,published_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(postId,post.slug,post.title,post.excerpt,post.body,post.category,post.author,post.source_name,post.source_url,post.cover_id,post.cover_alt,JSON.stringify(post.asset_ids),post.status,now,now,published).run();
      return apiJson(id?200:201,{id:postId,slug:post.slug,status:post.status,version:(old?.version||0)+1});
    }catch(e){if(String(e.message).includes('UNIQUE'))return apiJson(409,{message:'같은 글 주소가 있습니다. 다른 주소를 입력해 주세요.'});throw e;}
  }
  return apiJson(405,{message:'지원하지 않는 요청입니다.'});
}
export async function serveMedia(request,env) {
  const id=new URL(request.url).pathname.match(/^\/media\/([a-f0-9-]{36})$/)?.[1];
  if(!id||!env.DB||!env.MEDIA)return new Response('Not found',{status:404});
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
  await ensurePressSchema(env.DB);
  const admin=await isAdmin(request,env);
  const media=await env.DB.prepare(`SELECT * FROM press_media WHERE id=? ${admin?'':"AND EXISTS (SELECT 1 FROM press_posts,json_each(press_posts.asset_ids) WHERE press_posts.status='published' AND json_each.value=press_media.id)"}`).bind(id).first();
  if(!media)return new Response('Not found',{status:404,headers:{'Cache-Control':'no-store'}});
  const object=await env.MEDIA.get(media.object_key);
  if(!object)return new Response('Not found',{status:404});
  const disposition=media.content_type==='application/pdf'?`attachment; filename*=UTF-8''${encodeURIComponent(media.filename)}`:'inline';
  return new Response(request.method==='HEAD'?null:object.body,{headers:{'Content-Type':media.content_type,'Content-Length':String(media.size),'Content-Disposition':disposition,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex','Content-Security-Policy':"default-src 'none'; sandbox"}});
}
