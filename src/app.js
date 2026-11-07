import express from 'express';
export const fields=['company','role','domain','location','durationWeeks','stipend','description'];
function fail(status,code,message,details=[]) {return Object.assign(new Error(message),{status,code,details});}
function validate(body,partial=false) {
 if(!body || typeof body!=='object' || Array.isArray(body)) throw fail(400,'VALIDATION_ERROR','Body must be a JSON object.');
 const errors=[];const clean={};
 for(const key of Object.keys(body)) if(!fields.includes(key)) errors.push(`${key}: unknown field`);
 for(const key of fields) {
  if(partial && !Object.hasOwn(body,key)) continue;
  const value=body[key];
  if(key==='durationWeeks' || key==='stipend') {
   const min=key==='stipend'?0:1,max=key==='stipend'?10000000:104;
   if(!Number.isInteger(value)||value<min||value>max) errors.push(`${key}: integer between ${min} and ${max} required`);else clean[key]=value;
  }else {
   const max=key==='description'?5000:key==='domain'?80:120;
   if(typeof value!=='string'||!value.trim()||value.trim().length>max) errors.push(`${key}: nonempty string up to ${max} characters required`);else clean[key]=value.trim();
  }
 }
 if(partial&&!Object.keys(body).length) errors.push('At least one field is required');
 if(errors.length) throw fail(400,'VALIDATION_ERROR','Invalid internship.',errors);
 return clean;
}
export function createApp(db) {
 const app=express();app.disable('x-powered-by');
 app.use(express.json({limit:'32kb'}));
 app.get('/health',(_req,res)=>{db.prepare('SELECT 1').get();res.json({data:{status:'ok'}});});
 app.get('/api/internships',(req,res)=>{
  const allowed=['page','limit','domain','q'];
  if(Object.keys(req.query).some(k=>!allowed.includes(k))) throw fail(400,'VALIDATION_ERROR','Unknown query parameter.');
  function number(key,fallback,max){const v=req.query[key];if(v===undefined)return fallback;if(typeof v!=='string'||!/^\d+$/.test(v)||!Number.isSafeInteger(Number(v))||Number(v)<1||Number(v)>max)throw fail(400,'VALIDATION_ERROR',`Invalid ${key}.`);return Number(v);}
  const page=number('page',1,1000000),limit=number('limit',10,100);
  const conditions=[],params=[];
  for(const key of ['domain','q']) if(req.query[key]!==undefined && (typeof req.query[key]!=='string'||req.query[key].length>120))throw fail(400,'VALIDATION_ERROR',`Invalid ${key}.`);
  if(req.query.domain){conditions.push('domain = ? COLLATE NOCASE');params.push(req.query.domain.trim());}
  if(req.query.q){conditions.push("instr(lower(company || ' ' || role || ' ' || description), lower(?)) > 0");params.push(req.query.q.trim());}
  const where=conditions.length?' WHERE '+conditions.join(' AND '):'';
  const total=db.prepare('SELECT count(*) AS total FROM internships'+where).get(...params).total;
  const data=db.prepare('SELECT * FROM internships'+where+' ORDER BY id ASC LIMIT ? OFFSET ?').all(...params,limit,(page-1)*limit);
  res.json({data,meta:{page,limit,total,totalPages:Math.ceil(total/limit)}});
 });
 app.param('id',(req,_res,next,value)=>{
  if(!/^[1-9]\d*$/.test(value)||!Number.isSafeInteger(Number(value))) return next(fail(400,'VALIDATION_ERROR','ID must be a positive integer.'));
  req.record=db.prepare('SELECT * FROM internships WHERE id=?').get(Number(value));
  if(!req.record)return next(fail(404,'NOT_FOUND','Internship not found.'));next();
 });
 app.get('/api/internships/:id',(req,res)=>res.json({data:req.record}));
 function jsonOnly(req){if(!req.is('application/json'))throw fail(415,'UNSUPPORTED_MEDIA_TYPE','Use Content-Type: application/json.');}
 app.post('/api/internships',(req,res)=>{
  jsonOnly(req);const data=validate(req.body);
  const result=db.prepare(`INSERT INTO internships (${fields.join(',')}) VALUES (${fields.map(()=>'?').join(',')})`).run(...fields.map(k=>data[k]));
  const record=db.prepare('SELECT * FROM internships WHERE id=?').get(Number(result.lastInsertRowid));
  res.location(`/api/internships/${record.id}`).status(201).json({data:record});
 });
 for(const method of ['put','patch']) app[method]('/api/internships/:id',(req,res)=>{
  jsonOnly(req);const data=validate(req.body,method==='patch'),keys=Object.keys(data);
  db.prepare(`UPDATE internships SET ${keys.map(k=>k+'=?').join(',')}, updatedAt=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?`).run(...keys.map(k=>data[k]),req.record.id);
  res.json({data:db.prepare('SELECT * FROM internships WHERE id=?').get(req.record.id)});
 });
 app.delete('/api/internships/:id',(req,res)=>{db.prepare('DELETE FROM internships WHERE id=?').run(req.record.id);res.status(204).end();});
 app.use((_req,_res,next)=>next(fail(404,'NOT_FOUND','Route not found.')));
 app.use((err,_req,res,_next)=>{
  if(err.type==='entity.parse.failed')err=fail(400,'INVALID_JSON','Request body is not valid JSON.');
  else if(err.type==='entity.too.large')err=fail(413,'PAYLOAD_TOO_LARGE','JSON body exceeds 32kb.');
  const status=err.status>=400&&err.status<500?err.status:500;
  if(status===500) console.error(err);
  res.status(status).json({error:{code:status===500?'INTERNAL_ERROR':err.code||'BAD_REQUEST',message:status===500?'An unexpected server error occurred.':err.message,details:err.details||[]}});
 });return app;
}
