import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleInquiry } from '../server/inquiries.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg'};
const server = http.createServer(async (req,res)=>{
  try {
    const url = new URL(req.url,'http://127.0.0.1:4173');
    if (url.pathname === '/api/inquiries') {
      const request = new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:req,duplex:'half'}:{})});
      const response = await handleInquiry(request,{});
      res.writeHead(response.status,Object.fromEntries(response.headers));
      res.end(await response.text());
      return;
    }
    if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405);res.end();return;}
    const pathname = decodeURIComponent(url.pathname);
    let target = path.resolve(root,'.'+pathname);
    if (!target.startsWith(root+path.sep) && target !== root) {res.writeHead(403);res.end();return;}
    if ((await fs.stat(target).catch(()=>null))?.isDirectory()) target = path.join(target,'index.html');
    let status = 200;
    let bytes;
    try {bytes=await fs.readFile(target);} catch {status=404;target=path.join(root,'404.html');bytes=await fs.readFile(target);}
    res.writeHead(status,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'});
    res.end(req.method==='HEAD'?undefined:bytes);
  } catch {res.writeHead(500);res.end('Preview server error');}
});
server.listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173\nPreview only. Online inquiries are not stored locally.'));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>server.close(()=>process.exit(0)));
