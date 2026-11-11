import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../server/worker.mjs';
const demo=process.argv.includes('--cms-demo');
const local=demo?(await import('./local-storage.mjs')).localBindings():{};
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.mp4':'video/mp4'};
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
    const type = mime[path.extname(target)] || 'application/octet-stream';
    const headers = new Headers({'Content-Type':type,'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'});
    if (status === 200 && type === 'video/mp4') {
      headers.set('Accept-Ranges', 'bytes');
      const range = method === 'GET' && /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('Range') || '');
      if (range && (range[1] || range[2])) {
        const size = bytes.length;
        const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
        const end = range[1] && range[2] ? Math.min(size - 1, Number(range[2])) : size - 1;
        if (start > end || start >= size) {
          headers.set('Content-Range', `bytes */${size}`);
          return new Response(null, {status:416,headers});
        }
        headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
        bytes = bytes.subarray(start, end + 1);
        status = 206;
      }
      headers.set('Content-Length', String(bytes.length));
    }
    return new Response(method==='HEAD'?null:bytes,{status,headers});
}
server.listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173\nPreview only. Online inquiries are not stored locally.'+(demo?'\nCMS demo uses an in-memory database. Demo password: preview-only-walking-2026':'')));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>server.close(()=>process.exit(0)));
