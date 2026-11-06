export const normalizeEnv = env => ({...env,DB:env['walking-db'] || env.DB,MEDIA:env['walking-r2'] || env.MEDIA});
export const pressSchema = [
  `CREATE TABLE IF NOT EXISTS press_posts (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, excerpt TEXT NOT NULL, body TEXT NOT NULL, category TEXT NOT NULL, author TEXT NOT NULL, source_name TEXT NOT NULL DEFAULT '', source_url TEXT NOT NULL DEFAULT '', cover_id TEXT NOT NULL DEFAULT '', cover_alt TEXT NOT NULL DEFAULT '', asset_ids TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(asset_ids)), status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')), created_at TEXT NOT NULL, updated_at TEXT NOT NULL, published_at TEXT, version INTEGER NOT NULL DEFAULT 1)`,
  'CREATE INDEX IF NOT EXISTS press_public ON press_posts(status, published_at DESC)',
  'CREATE TABLE IF NOT EXISTS press_media (id TEXT PRIMARY KEY, object_key TEXT NOT NULL UNIQUE, filename TEXT NOT NULL, content_type TEXT NOT NULL, size INTEGER NOT NULL, created_at TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS press_login_attempts (id TEXT PRIMARY KEY, ip_hash TEXT NOT NULL, attempted_at INTEGER NOT NULL)',
  'CREATE INDEX IF NOT EXISTS press_login_rate ON press_login_attempts(ip_hash, attempted_at)'
];
const initialized = new WeakMap();
export async function ensurePressSchema(db) {
  if (!db) throw new Error('DB_NOT_CONFIGURED');
  if (!initialized.has(db)) {
    const setup = db.batch(pressSchema.map(sql=>db.prepare(sql))).catch(error=>{initialized.delete(db);throw error;});
    initialized.set(db,setup);
  }
  await initialized.get(db);
}
export const apiJson = (status,data,headers={}) => new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex',...headers}});
export const sameOrigin = request => request.headers.get('Origin') === new URL(request.url).origin;
export async function boundedBody(request,maxBytes) {
  if (Number(request.headers.get('Content-Length')) > maxBytes) throw new Error('BODY_TOO_LARGE');
  const reader=request.body?.getReader(); if(!reader) return new Uint8Array();
  const parts=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>maxBytes){await reader.cancel();throw new Error('BODY_TOO_LARGE');}parts.push(value);}
  const all=new Uint8Array(size);let offset=0;for(const p of parts){all.set(p,offset);offset+=p.length;}return all;
}
export async function readJsonBody(request,maxBytes=150000) {
  if (!(request.headers.get('Content-Type')||'').startsWith('application/json')) throw new Error('JSON_REQUIRED');
  return JSON.parse(new TextDecoder().decode(await boundedBody(request,maxBytes)));
}
