import express from 'express';
import helmet from 'helmet';
import {rateLimit} from 'express-rate-limit';
import {fileURLToPath} from 'node:url';
import {createApp as createRecordsApi} from './app.js';
const error=(res,status,code,message,details=[])=>res.status(status).json({error:{code,message,details}});
export function createApp(db,{apiLimit=120,applicationLimit=5,windowMs=60000,origin=process.env.PUBLIC_ORIGIN||`http://127.0.0.1:${process.env.PORT||3002}`}={}) {
 const app=express();app.disable('x-powered-by');
 app.use(helmet({contentSecurityPolicy:{directives:{defaultSrc:["'self'"],scriptSrc:["'self'"],styleSrc:["'self'"],imgSrc:["'self'"],connectSrc:["'self'"],formAction:["'self'"],frameAncestors:["'none'"],upgradeInsecureRequests:null}},strictTransportSecurity:false}));
 app.use('/api',(_req,res,next)=>{res.set('Cache-Control','no-store');next();});
 const limiter=limit=>rateLimit({windowMs,limit,standardHeaders:'draft-8',legacyHeaders:false,handler:(_req,res)=>error(res,429,'RATE_LIMITED','Too many requests. Wait before retrying.')});
 app.use('/api',limiter(apiLimit));
 app.use('/api/applications',limiter(applicationLimit));
 app.use('/api', (req,res,next)=>{
  if(['GET','HEAD'].includes(req.method))return next();
  if(req.path!=='/applications'||req.method!=='POST')return error(res,405,'METHOD_NOT_ALLOWED','This board only allows reading roles and submitting applications.');
  if((req.get('Origin')&&req.get('Origin')!==origin)||req.get('Sec-Fetch-Site')==='cross-site')return error(res,403,'FORBIDDEN','Cross-origin submission is not allowed.');
  if(req.get('X-Application-Request')!=='1')return error(res,403,'FORBIDDEN','Missing application request header.');
  if(!req.is('application/json'))return error(res,415,'UNSUPPORTED_MEDIA_TYPE','Use application/json.');next();
 });
 app.use(express.json({limit:'16kb'}));
 app.post('/api/applications',(req,res)=>{
  const body=req.body,details=[];
  if(!body||typeof body!=='object'||Array.isArray(body))return error(res,400,'VALIDATION_ERROR','A JSON object is required.');
  for(const key of Object.keys(body))if(!['internshipId','fullName','email','coverLetter','consent'].includes(key))details.push(`${key}: unknown field`);
  const name=typeof body.fullName==='string'?body.fullName.trim():'';
  const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
  const letter=typeof body.coverLetter==='string'?body.coverLetter.trim():'';
  if(!Number.isSafeInteger(body.internshipId)||body.internshipId<1)details.push('internshipId: positive integer required');
  if(name.length<2||name.length>100||/[\x00-\x1f]/.test(name))details.push('fullName: 2–100 characters required');
  if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))details.push('email: valid email required');
  if(letter.length<30||letter.length>3000)details.push('coverLetter: 30–3000 characters required');
  if(body.consent!==true)details.push('consent: explicit agreement required');
  if(details.length)return error(res,400,'VALIDATION_ERROR','Please correct your application.',details);
  if(!db.prepare('SELECT id FROM internships WHERE id=?').get(body.internshipId))return error(res,404,'NOT_FOUND','This internship is no longer available.');
  // An atomic uniqueness constraint makes uncertain network retries safe.
  const result=db.prepare('INSERT INTO applications (internshipId,fullName,email,coverLetter,consent) VALUES (?,?,?,?,1) ON CONFLICT(internshipId,email) DO NOTHING').run(body.internshipId,name,email,letter);
  if(!result.changes)return error(res,409,'ALREADY_SUBMITTED','An application for this email and role has already been received.');
  res.status(201).json({data:{id:Number(result.lastInsertRowid),status:'received'}});
 });
 app.use(express.static(fileURLToPath(new URL('../public/',import.meta.url))));
 app.use(createRecordsApi(db));
 app.use((err,_req,res,_next)=>{
  if(err.type==='entity.parse.failed')return error(res,400,'INVALID_JSON','Invalid JSON body.');
  if(err.type==='entity.too.large')return error(res,413,'PAYLOAD_TOO_LARGE','Body exceeds 16kb.');
  console.error('Application request failed:',err.code||'internal');
  return error(res,500,'INTERNAL_ERROR','The request could not be completed. Please retry.');
 });return app;
}
