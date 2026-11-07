import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {openDatabase} from '../src/database.js';
import {createApp} from '../src/integration.js';
const valid={internshipId:1,fullName:'Demo Student',email:'demo@example.test',coverLetter:'I enjoy building accessible interfaces and tested web applications.',consent:true};
async function fixture(options={}){const dir=mkdtempSync(join(tmpdir(),'secure-board-')),path=join(dir,'test.sqlite');const db=openDatabase(path);db.exec(readFileSync(new URL('../db/seed.sql',import.meta.url),'utf8'));const server=createApp(db,{applicationLimit:100,...options}).listen(0,'127.0.0.1');await once(server,'listening');return {db,path,url:`http://127.0.0.1:${server.address().port}`,close:async()=>{await new Promise(r=>server.close(r));db.close();rmSync(dir,{recursive:true,force:true});}};}
test('integrated API security and application persistence',async t=>{
 const f=await fixture();const send=(body,headers={})=>fetch(f.url+'/api/applications',{method:'POST',headers:{'Content-Type':'application/json','X-Application-Request':'1',...headers},body:JSON.stringify(body)});
 try{
 await t.test('frontend, data and secure headers',async()=>{const r=await fetch(f.url);assert.equal(r.status,200);assert.match(r.headers.get('content-security-policy'),/script-src 'self'/);assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.equal(r.headers.get('x-powered-by'),null);assert.match(await r.text(),/application-form/);const j=await (await fetch(f.url+'/api/internships?limit=3')).json();assert.equal(j.data.length,3);assert.equal(j.meta.total,6);});
 await t.test('client-independent validation',async()=>{for(const body of [{},null,[],{...valid,consent:false},{...valid,email:'bad'},{...valid,coverLetter:'short'},{...valid,internshipId:'1'},{...valid,extra:'x'}]){const r=await send(body);assert.equal(r.status,400);assert.ok((await r.json()).error);}assert.equal((await send({...valid,internshipId:999})).status,404);});
 await t.test('cross-origin, content-type and request-header protection',async()=>{assert.equal((await send(valid,{Origin:'https://evil.example'})).status,403);assert.equal((await send(valid,{'X-Application-Request':''})).status,403);assert.equal((await send(valid,{'Content-Type':'text/plain'})).status,415);});
 await t.test('malformed and oversized bodies',async()=>{const r=await fetch(f.url+'/api/applications',{method:'POST',headers:{'Content-Type':'application/json','X-Application-Request':'1'},body:'{'});assert.equal(r.status,400);assert.equal((await r.json()).error.code,'INVALID_JSON');assert.equal((await send({...valid,coverLetter:'x'.repeat(20000)})).status,413);});
 await t.test('success, normalization and duplicate retry',async()=>{const r=await send({...valid,email:' DEMO@example.test '});assert.equal(r.status,201);assert.deepEqual(Object.keys((await r.json()).data).sort(),['id','status']);assert.equal((await send(valid)).status,409);const reopened=openDatabase(f.path);assert.equal(reopened.prepare('SELECT email FROM applications').get().email,'demo@example.test');reopened.close();});
 await t.test('parameterized SQL and private data',async()=>{assert.equal((await send({...valid,email:'sql@example.test',fullName:"O'Brien'; DROP TABLE applications;--"})).status,201);assert.equal(f.db.prepare('SELECT count(*) AS n FROM applications').get().n,2);assert.equal((await fetch(f.url+'/api/applications')).status,404);for(const method of ['POST','PUT','PATCH','DELETE'])assert.equal((await fetch(f.url+'/api/internships/1',{method})).status,405);});
 }finally{await f.close();}
});
test('application rate limiting returns 429 and retry information',async()=>{const f=await fixture({applicationLimit:2});try{for(let i=0;i<2;i++)assert.equal((await fetch(f.url+'/api/applications',{method:'POST'})).status,403);const r=await fetch(f.url+'/api/applications',{method:'POST'});assert.equal(r.status,429);assert.ok(r.headers.get('retry-after'));assert.equal((await r.json()).error.code,'RATE_LIMITED');}finally{await f.close();}});
test('general API limiter',async()=>{const f=await fixture({apiLimit:1});try{assert.equal((await fetch(f.url+'/api/internships')).status,200);assert.equal((await fetch(f.url+'/api/internships')).status,429);}finally{await f.close();}});
