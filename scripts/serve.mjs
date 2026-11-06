import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../server/worker.mjs';
const demo=process.argv.includes('--cms-demo');
const local=demo?(await import('./local-storage.mjs')).localBindings():{};
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg'};
const server = http.createServer(async (req,res)=>{
  try {
    const url = new URL(req.url,'http://127.0.0.1:4173');
    const request=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:req,duplex:'half'}:{})});
    const ASSETS={fetch:serveStatic};
    const response=await worker.fetch(request,{...local,ASSETS},{waitUntil:promise=>promise.catch(()=>{})});
    res.writeHead(response.status,Object.fromEntries(response.headers));
    res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));
  } catch {res.writeHead(500);res.end('Preview server error');}
});
async function serveStatic(request){
    const url=new URL(request.url);
    const method=request.method;
    if (!['GET','HEAD'].includes(method)) return new Response('Method not allowed',{status:405});
    const pathname = decodeURIComponent(url.pathname);
    let target = path.resolve(root,'.'+pathname);
    if (!target.startsWith(root+path.sep) && target !== root) return new Response('Forbidden',{status:403});
    if ((await fs.stat(target).catch(()=>null))?.isDirectory()) target = path.join(target,'index.html');
    let status = 200;
    let bytes;
    try {bytes=await fs.readFile(target);} catch {status=404;target=path.join(root,'404.html');bytes=await fs.readFile(target);}
    return new Response(method==='HEAD'?null:bytes,{status,headers:{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});
}
server.listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173\nPreview only. Online inquiries are not stored locally.'+(demo?'\nCMS demo uses an in-memory database. Demo password: preview-only-walking-2026':'')));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>server.close(()=>process.exit(0)));
