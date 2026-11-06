import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const list=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?list(path.join(dir,e.name)):[path.join(dir,e.name)]);
test('all 29 static pages contain one h1, unique metadata, valid JSON-LD and real internal targets',()=>{
  const pages=list(dist).filter(f=>f.endsWith('.html'));
  assert.equal(pages.length,29);
  const titles=new Set(), descriptions=new Set();
  for (const file of pages) {
    const html=fs.readFileSync(file,'utf8');
    assert.equal((html.match(/<h1[ >]/g)||[]).length,1,file);
    assert.match(html,/<html lang="ko"/);
    const title=html.match(/<title>(.*?)<\/title>/s)[1];
    const description=html.match(/name="description" content="([^"]*)"/)[1];
    assert.ok(!titles.has(title),`duplicate title: ${file}`);titles.add(title);
    assert.ok(!descriptions.has(description),`duplicate description: ${file}`);descriptions.add(description);
    const graph=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    assert.equal(graph['@context'],'https://schema.org');
    assert.ok(graph['@graph'].some(n=>n['@type']==='Organization'));
    assert.match(html,/noindex, nofollow/,'preview must not be indexed');
    for (const match of html.matchAll(/(?:href|src)="(\/[^"?]*)[^" ]*"/g)) {
      const target=match[1].split('#')[0];
      if (target.startsWith('/api/')) continue;
      const local=path.join(dist,target.endsWith('/')?target+'index.html':target);
      assert.ok(fs.existsSync(local),`${file}: broken target ${target}`);
    }
    for(const match of html.matchAll(/<img\b([^>]+)>/g)) assert.match(match[1],/alt="[^"]*"/);
  }
});
test('production build requires a domain and generates canonical URL and sitemap when supplied',()=>{
  assert.throws(()=>execFileSync(process.execPath,['scripts/build.mjs','--production'],{cwd:root,stdio:'pipe',env:{...process.env,SITE_ORIGIN:''}}));
  execFileSync(process.execPath,['scripts/build.mjs','--production'],{cwd:root,stdio:'pipe',env:{...process.env,SITE_ORIGIN:'https://walk.test',BUILD_OUTPUT:'.test-dist'}});
  const output=path.join(root,'.test-dist');
  const html=fs.readFileSync(path.join(output,'index.html'),'utf8');
  assert.match(html,/<link rel="canonical" href="https:\/\/walk.test\/">/);
  assert.match(html,/index, follow, max-image-preview:large/);
  const sitemap=fs.readFileSync(path.join(output,'sitemap.xml'),'utf8');
  assert.equal((sitemap.match(/<loc>/g)||[]).length,27);
  assert.ok(!sitemap.includes('/admin/'));
  assert.ok(!sitemap.includes('404.html'));
  assert.match(fs.readFileSync(path.join(output,'robots.txt'),'utf8'),/Sitemap: https:\/\/walk.test\/sitemap.xml/);
  // Restore the report and preview output. Test output is kept separate from deployable files.
  execFileSync(process.execPath,['scripts/build.mjs'],{cwd:root,stdio:'pipe'});
});
