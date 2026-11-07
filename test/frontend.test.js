import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const script=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const role={id:1,company:'<img src=x onerror=alert(1)>',role:'API Intern',location:'Remote',description:'Build accessible APIs',durationWeeks:8,stipend:0};
const response=(data,status=200)=>({ok:status<400,status,json:async()=>data});
const flush=()=>new Promise(r=>setTimeout(r,5));
function setup(fetch){const dom=new JSDOM(html,{runScripts:'outside-only',url:'http://localhost:3002'});dom.window.fetch=fetch;dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};dom.window.eval(script);return dom;}
test('frontend loading, failure, retry, safe rendering and empty results',async()=>{
 let reject;const dom=setup(()=>new Promise((_resolve,r)=>reject=r));const d=dom.window.document;
 try{assert.match(d.querySelector('#status').textContent,/Loading/);reject(Error('offline'));await flush();assert.equal(d.querySelector('#load-error').hidden,false);dom.window.fetch=async()=>response({data:[role],meta:{total:1,totalPages:1}});d.querySelector('#retry').click();await flush();assert.equal(d.querySelectorAll('.internship-card').length,1);assert.equal(d.querySelector('#cards img'),null);assert.match(d.querySelector('#cards').textContent,/<img/);dom.window.fetch=async()=>response({data:[],meta:{total:0,totalPages:0}});d.querySelector('#filters').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));await flush();assert.match(d.querySelector('#status').textContent,/No opportunities/);}finally{dom.window.close();}
});
test('frontend form validation, failed submission preserves values, retry succeeds',async()=>{
 const dom=setup(async()=>response({data:[role],meta:{total:1,totalPages:1}}));const d=dom.window.document;
 try{await flush();d.querySelector('#cards button').click();assert.equal(d.querySelector('dialog').open,true);d.querySelector('#full-name').value='Demo Student';d.querySelector('#email').value='demo@example.test';d.querySelector('#cover-letter').value='I enjoy building accessible interfaces and reliable APIs.';d.querySelector('#consent').checked=true;
 const submit=()=>d.querySelector('#application-form').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));
 dom.window.fetch=async()=>{throw Error('offline');};submit();await flush();assert.equal(d.querySelector('#email').value,'demo@example.test');assert.equal(d.querySelector('#submit').disabled,false);assert.match(d.querySelector('#form-message').textContent,/preserved/);
 dom.window.fetch=async(_url,options)=>{assert.equal(JSON.parse(options.body).internshipId,1);return response({data:{id:9,status:'received'}},201);};submit();await flush();assert.match(d.querySelector('#form-message').textContent,/#9/);assert.equal(d.querySelector('#submit').disabled,true);
 }finally{dom.window.close();}
});
