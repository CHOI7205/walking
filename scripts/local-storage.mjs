import { DatabaseSync } from 'node:sqlite';
export function localBindings(){
  const sqlite=new DatabaseSync(':memory:');
  const wrap=(sql,args=[])=>({bind(...values){return wrap(sql,values);},async run(){const result=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(result.changes)}};},async first(){return sqlite.prepare(sql).get(...args)||null;},async all(){return {results:sqlite.prepare(sql).all(...args)};}});
  const DB={prepare:wrap,async batch(statements){sqlite.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());sqlite.exec('COMMIT');return results;}catch(error){sqlite.exec('ROLLBACK');throw error;}}};
  const files=new Map();
  const MEDIA={async put(key,value){files.set(key,new Uint8Array(value));},async get(key){const value=files.get(key);return value?{body:value}:null;},async delete(key){files.delete(key);}};
  return {DB,MEDIA,ADMIN_PASSWORD:'preview-only-walking-2026',close(){sqlite.close();}};
}
