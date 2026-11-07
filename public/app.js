const $=id=>document.getElementById(id);
let page=1,totalPages=0,selected=null,loading=false,submitting=false,requestId=0;
async function request(url,options={}) {
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),10000);
 try {
  const response=await fetch(url,{...options,signal:controller.signal});
  const payload=await response.json();
  if(!response.ok)throw Object.assign(new Error(payload.error?.message||'Request failed.'),{details:payload.error?.details||[],status:response.status});
  return payload;
 }finally{clearTimeout(timeout);}
}
function text(tag,value,className){const element=document.createElement(tag);element.textContent=value;if(className)element.className=className;return element;}
function navigation(){ $('previous').disabled=loading||page<=1;$('next').disabled=loading||page>=totalPages; }
async function load(){
 const current=++requestId;loading=true;navigation();$('cards').setAttribute('aria-busy','true');$('cards').replaceChildren();$('load-error').hidden=true;$('status').textContent='Loading opportunities…';$('page-label').textContent='';
 try {
  const query=new URLSearchParams({page:String(page),limit:'3'});if($('search').value.trim())query.set('q',$('search').value.trim());if($('domain').value)query.set('domain',$('domain').value);
  const payload=await request('/api/internships?'+query);if(current!==requestId)return;
  if(!Array.isArray(payload.data)||!payload.meta||!Number.isInteger(payload.meta.totalPages))throw Error('Invalid response.');
  totalPages=payload.meta.totalPages;
  for(const role of payload.data){
   const card=text('article','','internship-card');card.append(text('p',role.company,'company-name'),text('h2',role.role,'role-title'),text('p',role.location,'location'),text('p',role.description),text('p',`${role.durationWeeks} weeks · ${role.stipend===0?'Unpaid':`₹${role.stipend}/month`}`,'card-meta'));
   const button=text('button','Apply now →','button button-primary');button.type='button';button.addEventListener('click',()=>openApplication(role));card.append(button);$('cards').append(card);
  }
  $('status').textContent=payload.data.length?`${payload.meta.total} opportunities found`:'No opportunities match. Try another search or domain.';
  $('page-label').textContent=totalPages?`Page ${page} of ${totalPages}`:'No results';
 }catch{if(current!==requestId)return;$('status').textContent='';$('load-error').hidden=false;totalPages=0;}
 finally{if(current===requestId){loading=false;$('cards').setAttribute('aria-busy','false');navigation();}}
}
function openApplication(role){selected=role.id;$('application-form').reset();$('submit').disabled=false;$('submit').textContent='Submit application';$('form-message').textContent='';$('role-name').textContent=`${role.role} · ${role.company}`;$('apply-dialog').showModal();}
$('filters').addEventListener('submit',event=>{event.preventDefault();page=1;load();});
$('retry').addEventListener('click',load);
$('previous').addEventListener('click',()=>{page--;load();});$('next').addEventListener('click',()=>{page++;load();});
$('close-dialog').addEventListener('click',()=>{if(!submitting)$('apply-dialog').close();});
$('apply-dialog').addEventListener('cancel',event=>{if(submitting)event.preventDefault();});
$('application-form').addEventListener('submit',async event=>{
 event.preventDefault();if(submitting||!$('application-form').reportValidity())return;
 const body={internshipId:selected,fullName:$('full-name').value.trim(),email:$('email').value.trim(),coverLetter:$('cover-letter').value.trim(),consent:$('consent').checked};
 if(body.fullName.length<2||body.coverLetter.length<30){$('form-message').textContent='Enter at least 2 characters for your name and 30 non-padding characters for your statement.';return;}
 submitting=true;$('submit').disabled=true;$('close-dialog').disabled=true;$('form-message').textContent='Submitting application…';let completed=false;
 try{const result=await request('/api/applications',{method:'POST',headers:{'Content-Type':'application/json','X-Application-Request':'1'},body:JSON.stringify(body)});$('form-message').textContent=`Application received. Reference #${result.data.id}.`;$('submit').textContent='Application received';completed=true;}
 catch(error){$('form-message').textContent=error.status?[error.message,...error.details].join('\n'):'Could not confirm submission. Your details are preserved. Retry to check or complete it.';if(error.status===409){completed=true;$('submit').textContent='Already received';}else $('submit').textContent='Retry submission';}
 finally{submitting=false;$('submit').disabled=completed;$('close-dialog').disabled=false;}
});
load();
