#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { parseCsv } from './lib/csv.mjs';
import { table } from './lib/format.mjs';

export const readQueries = {
 partners:'select id,name,owner,status,agreement_ref,review_on from partners order by name',
 offers:'select id,name,owner,terms_ref,status from offers order by name',
 conversions:'select source_event_id,partner,offer,source_status,decision,currency,revenue_cents,payout_cents,disputed from conversion_review order by source_event_id',
 'validation-queue':"select source_event_id,partner,offer,source_status,currency,payout_cents,overdue_days from conversion_review where decision='pending' order by due_on,source_event_id",
 'partner-margins':'select partner,currency,conversions,pending,approved_payout_cents,approved_margin_cents,pending_payout_cents from partner_balances order by partner,currency',
 'disclosure-check':'select partner,placement,market,outcome,review_on from disclosure_review order by partner,placement',
 'dispute-review':"select d.id,c.source_event_id,p.name partner,d.reason,d.owner,d.due_on,d.status from disputes d join conversions c on c.id=d.conversion_id join partners p on p.id=c.partner_id order by d.status desc,d.due_on",
 'settlement-review':"select source_event_id,partner,offer,currency,revenue_cents,payout_cents,margin_cents from conversion_review where decision='approved' and source_status='approved' and not disputed order by partner,currency,source_event_id",
 attention:'select kind,reference,owner,due_on,issue from attention order by due_on nulls first,kind,reference',
 history:'select action,entity,entity_id,operator,reason,evidence_ref,created_at from activity order by created_at,id',
};
export const questions = [
 ['Which pending conversions are overdue?',"select source_event_id,partner,overdue_days from conversion_review where decision='pending' and overdue_days>0 order by overdue_days desc,source_event_id"],
 ['Which transactions have several distinct conversion events?',"select transaction_id,count(*) events from conversions group by transaction_id having count(*)>1 order by transaction_id"],
 ['Which partners have an approved margin below zero?',"select partner,currency,approved_margin_cents from partner_balances where approved_margin_cents<0 order by partner,currency"],
 ['Which conversions cost more in commission than their recorded revenue?',"select source_event_id,partner,currency,margin_cents from conversion_review where margin_cents<0 order by source_event_id"],
 ['Which approved conversions are held out by a dispute?',"select source_event_id,partner,currency,payout_cents from conversion_review where decision='approved' and disputed order by source_event_id"],
 ['Which active partners lack a current clear disclosure record?',"select p.name partner from partners p where p.status='active' and not exists(select 1 from (select distinct on(partner_id,placement) * from disclosures order by partner_id,placement,checked_on desc,created_at desc,id desc) d where d.partner_id=p.id and d.outcome='clear' and d.review_on>=current_date) order by p.name"],
 ['Which reviewed decisions differ from the imported status?',"select source_event_id,partner,source_status,decision from conversion_review where decision<>'pending' and decision<>source_status order by source_event_id"],
 ['Which records have passed their retention review date?',"select source_event_id,retain_until from conversions where retain_until<current_date order by retain_until,source_event_id"],
 ['Which partners have pending amounts in more than one currency?',"select partner,count(distinct currency) currencies from conversion_review where decision='pending' group by partner having count(distinct currency)>1 order by partner"],
 ['Which approved conversions lack a current partner agreement?',"select c.source_event_id,c.partner from conversion_review c join partners p on p.id=c.partner_id where c.decision='approved' and (p.agreement_ref='' or p.review_on is null or p.review_on<current_date) order by c.source_event_id"],
];
const allowedTables=['partners','offers','conversions','disclosures','disputes','decisions','activity'];
const mutations=['add-partner','add-offer','set-partner','set-offer','record-disclosure','review-conversion','open-dispute','close-dispute','retention-review','import'];
export const commands=[...Object.keys(readQueries),'show','compliance','insights','weekly-review','draft-partner-review','export',...mutations];
const need=(v,label)=>{if(typeof v!=='string'||!v.trim())throw Error(`${label} is required`);return v.trim();};
const oneOf=(v,list,label)=>{if(!list.includes(v))throw Error(`${label} must be ${list.join('|')}`);return v;};
export function date(v,label='date') {v=need(v,label);if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error(`${label} must be a real YYYY-MM-DD date`);return v;}
export function cents(v) {v=need(String(v??''),'money');if(!/^-?\d+(\.\d{1,2})?$/.test(v))throw Error(`Invalid money: ${v}; use signed decimal amounts without currency symbols`);let [whole,fraction='']=v.replace('-','').split('.');let n=(Number(whole)*100+Number(fraction.padEnd(2,'0')))*(v.startsWith('-')?-1:1);if(!Number.isSafeInteger(n)||Math.abs(n)>1e12)throw Error('Money exceeds supported range');return n;}
function timestamp(v,offset) {
 v=need(v,'Date / Time').replace(' ','T');
 if(!/(Z|[+-]\d\d:\d\d)$/.test(v)){if(!/^[+-](0\d|1[0-4]):[0-5]\d$/.test(offset||''))throw Error('Export timestamps without a zone require --timezone-offset=+00:00 (use the actual export offset)');v+=offset;}
 if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d(:\d\d(\.\d{1,3})?)?(Z|[+-]\d\d:\d\d)$/.test(v))throw Error('Date / Time must be ISO date and time');
 date(v.slice(0,10));if(Number(v.slice(11,13))>23)throw Error('Hour must be below 24'); if(!Number.isFinite(Date.parse(v)))throw Error('Invalid Date / Time');return new Date(v).toISOString();
}
function options(args){const pos=[],f={};for(const a of args){if(a.startsWith('--')){const eq=a.indexOf('=');const k=a.slice(2,eq<0?undefined:eq);if(k in f)throw Error(`Repeated option --${k}`);f[k]=eq<0?true:a.slice(eq+1);}else pos.push(a);}return {pos,f};}
export async function resolve(db,entity,ref){
 if(!['partners','offers','conversions','disputes'].includes(entity))throw Error('Unknown record type');need(ref,'record');
 const field=entity==='conversions'?'source_event_id':entity==='disputes'?'reason':'name';
 const exact=await db.query(`select * from ${entity} where id::text=$1 or lower(${field})=lower($1)`,[ref]);if(exact.length===1)return exact[0];
 const rows=await db.query(`select * from ${entity} where starts_with(id::text,$1) or strpos(lower(${field}),lower($1))>0 order by ${field}`,[ref]);
 if(rows.length!==1)throw Error(rows.length?`Ambiguous ${entity}: ${rows.map(r=>`${r.id} ${r[field]}`).join('; ')}`:`No ${entity} match: ${ref}`);return rows[0];
}
async function audit(db,action,entity,id,before,after,f){await db.query('insert into activity(action,entity,entity_id,operator,reason,evidence_ref,before_record,after_record) values($1,$2,$3,$4,$5,$6,$7,$8)',[action,entity,id,f.by,f.reason,f.evidence,before?JSON.stringify(before):null,after?JSON.stringify(after):null]);}
export async function compliance(db){
 const findings=[];const add=(rows,rule,source,message)=>rows.forEach(r=>findings.push({rule,record:r.ref,message,source}));
 add(await db.query("select source_event_id ref from conversions where retain_until<current_date"),'RETENTION-REVIEW','https://www.privacy.org.nz/privacy-principles/9/','Retention purpose review is due. No automatic deletion.');
 add(await db.query("select partner||coalesce(': '||placement,'') ref from disclosure_review"),'DISCLOSURE-EVIDENCE','https://asa.co.nz/codes/guidance-notes/guidance-note-on-influencer-advertising/','Disclosure evidence is missing, stale or needs review. A person must inspect the actual advertisement.');
 add(await db.query("select name ref from partners where status='active' and (agreement_ref='' or owner='' or review_on is null or review_on<current_date)"),'PARTNER-RECORD','internal:partner-policy','Owner, agreement reference or current review is missing.');
 add(await db.query("select name ref from offers where status='active' and (owner='' or terms_ref='')"),'OFFER-TERMS','internal:offer-policy','Offer owner or terms reference is missing.');
 add(await db.query("select c.source_event_id ref from conversions c where c.decision<>'pending' and not exists(select 1 from decisions d where d.conversion_id=c.id and d.decision=c.decision and d.evidence_ref<>'')"),'DECISION-EVIDENCE','internal:decision-policy','A reviewed decision has no matching evidence record.');
 return findings;
}
function savePrivate(folder,name,value){const dir=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,folder);fs.mkdirSync(dir,{recursive:true,mode:0o700});const file=path.join(dir,name);fs.writeFileSync(file,value,{mode:0o600});fs.chmodSync(file,0o600);return file;}
async function importTune(db,file,f){
 const currency=need(f.currency,'--currency').toUpperCase();if(!/^[A-Z]{3}$/.test(currency))throw Error('Currency must be a three-letter code');
 const retention=date(f['retain-until'],'--retain-until');
 const days=Number(f['review-days']??7);if(!Number.isInteger(days)||days<0||days>365)throw Error('--review-days must be 0 to 365');
 const map=f.map?JSON.parse(fs.readFileSync(f.map,'utf8')):{};
 const rows=parseCsv(fs.readFileSync(need(file,'CSV file'),'utf8'));if(!rows.length)throw Error('CSV has no records');
 if(rows.length>10000)throw Error('Import at most 10000 conversions per batch');
 const aliases={event:['Tune Event ID','tune_event_id'],transaction:['Transaction ID','transaction_id'],partner:['Partner','partner'],offer:['Offer','offer'],status:['Status','status'],time:['Date / Time','datetime'],revenue:['Revenue','revenue'],payout:['Payout','payout'],sale:['Sale Amount','sale_amount']};
 const get=(r,k)=>{const names=map[k]?[map[k]]:aliases[k];const h=Object.keys(r).find(h=>names.some(n=>n.toLowerCase()===h.toLowerCase()));return need(h===undefined?undefined:r[h],`CSV ${k}`);};
 const events=new Set();const prepared=rows.map((r,i)=>{try{
  const currencyHeader=Object.keys(r).find(k=>k.toLowerCase()==='currency');if(currencyHeader&&r[currencyHeader].trim().toUpperCase()!==currency)throw Error('Row currency differs from --currency');
  const event=get(r,'event');if(events.has(event))throw Error(`Repeated Tune Event ID ${event}`);events.add(event);
  const occurred=timestamp(get(r,'time'),f['timezone-offset']);
  const due=new Date(Date.parse(occurred)+days*86400000).toISOString().slice(0,10);
  return {source_event_id:event,transaction_id:get(r,'transaction'),partner:get(r,'partner'),offer:get(r,'offer'),occurred_at:occurred,source_status:oneOf(get(r,'status').toLowerCase(),['approved','pending','rejected'],'Status'),currency,revenue_cents:cents(get(r,'revenue')),payout_cents:cents(get(r,'payout')),sale_cents:cents(get(r,'sale')),due_on:due,retain_until:retention,source_ref:f.evidence};
 }catch(e){throw Error(`CSV row ${i+2}: ${e.message}`);}});
 const result={inserted:0,updated:0,unchanged:0,dry_run:!!f['dry-run'],rows:rows.length};
 for(const r of prepared){
  for(const [entity,key] of [['partners','partner'],['offers','offer']]){
   let item=(await db.query(`select * from ${entity} where lower(name)=lower($1)`,[r[key]]))[0];
   if(!item){item=(await db.query(`insert into ${entity}(name) values($1) returning *`,[r[key]]))[0];await audit(db,'import-placeholder',entity,item.id,null,item,f);}
   r[`${key}_id`]=item.id;delete r[key];
  }
  const existing=(await db.query('select * from conversions where source_event_id=$1 for update',[r.source_event_id]))[0];
  if(existing){
   const changed=Object.keys(r).some(k=>{if(k==='source_ref'||k==='due_on'||k==='retain_until')return false;return k==='occurred_at'?new Date(existing[k]).toISOString()!==r[k]:String(existing[k])!==String(r[k]);});
   if(!changed){result.unchanged++;continue;}
   if((await db.query('select id from decisions where conversion_id=$1',[existing.id])).length)throw Error(`Reviewed event ${r.source_event_id} differs from source. Resolve it with a person; import refuses to overwrite review history.`);
   // Review and retention dates are local policy, preserved on a later source refresh.
   r.due_on=existing.due_on;r.retain_until=existing.retain_until;
   const cols=Object.keys(r);const after=(await db.query(`update conversions set ${cols.map((c,i)=>`${c}=$${i+1}`).join(',')} where id=$${cols.length+1} returning *`,[...Object.values(r),existing.id]))[0];
   await audit(db,'import-update','conversions',existing.id,existing,after,f);result.updated++;
  }else{
   const cols=Object.keys(r);const after=(await db.query(`insert into conversions(${cols.join(',')}) values(${cols.map((_,i)=>`$${i+1}`).join(',')}) returning *`,Object.values(r)))[0];
   await audit(db,'import-create','conversions',after.id,null,after,f);result.inserted++;
  }
 }
 return result;
}
export async function run(db,args){
 const {pos,f}=options(args),cmd=pos.shift()||'help';
 if(cmd==='help'||f.help)return {commands};
 const flags={
  'add-partner':['name','owner','agreement','review-on'], 'add-offer':['name','owner','terms'],
  'set-partner':['owner','agreement','review-on','status'], 'set-offer':['owner','terms','status'],
  'record-disclosure':['placement','market','outcome','checked-on','review-on'],
  'review-conversion':['decision'], 'open-dispute':['owner','due-on'], 'close-dispute':['resolution'],
  'retention-review':['retain-until'], import:['currency','retain-until','review-days','timezone-offset','map']
 };
 const valid=['json',...(mutations.includes(cmd)?['by','reason','evidence','dry-run']:[]),...(flags[cmd]||[])];
 for(const k of Object.keys(f))if(!valid.includes(k))throw Error(`Unknown option --${k} for ${cmd}`);
 for(const k of ['json','dry-run'])if(k in f && f[k]!==true)throw Error(`--${k} is a boolean flag without a value`);
 const expected=['show','import'].includes(cmd)?2:['set-partner','set-offer','record-disclosure','review-conversion','open-dispute','close-dispute','retention-review','draft-partner-review'].includes(cmd)?1:0;
 if(pos.length!==expected)throw Error(`${cmd} requires ${expected} positional argument(s)`);
 if(readQueries[cmd])return db.query(readQueries[cmd]);
 if(cmd==='show'){const entity=oneOf(pos[0],['partners','offers','conversions','disputes'],'record type');const r=await resolve(db,entity,pos[1]);return {record:r,history:await db.query('select * from activity where entity=$1 and entity_id=$2 order by created_at,id',[entity,r.id]),...(entity==='conversions'?{decisions:await db.query('select * from decisions where conversion_id=$1 order by created_at,id',[r.id])}:{} )};}
 if(cmd==='compliance')return compliance(db);
 if(cmd==='insights'){const out=[];for(const [question,sql] of questions)out.push({question,rows:await db.query(sql)});return out;}
 if(cmd==='weekly-review')return {pending:await db.query(readQueries['validation-queue']),balances:await db.query(readQueries['partner-margins']),attention:await db.query(readQueries.attention),compliance:await compliance(db)};
 if(cmd==='draft-partner-review'){
  const p=await resolve(db,'partners',pos[0]);const balances=await db.query('select * from partner_balances where partner_id=$1 order by currency',[p.id]);
  const pending=await db.query("select source_event_id,offer,currency,payout_cents,overdue_days from conversion_review where partner_id=$1 and decision='pending' order by due_on",[p.id]);
  const content=`# Partner review: ${p.name}\n\nPrivate draft. Check the source evidence before sharing. No payment instruction.\n\n## Balances by currency\n\n${format(balances)}\n\n## Awaiting decisions\n\n${format(pending)}\n`;
  return {file:savePrivate('drafts',`partner-${p.id}.md`,content)};
 }
 if(cmd==='export'){const data={format:'affiliate-review-v1',exported_at:new Date().toISOString(),records:{}};for(const t of allowedTables)data.records[t]=await db.query(`select * from ${t} order by id`);return {file:savePrivate('exports',`archive-${Date.now()}.json`,JSON.stringify(data,null,2)+'\n'),counts:Object.fromEntries(Object.entries(data.records).map(([t,r])=>[t,r.length]))};}
 if(!mutations.includes(cmd))throw Error(`Unknown command: ${cmd}. Use help.`);
 for(const k of ['by','reason','evidence'])need(f[k],`--${k}`);
 await db.exec('BEGIN');
 try{
  let result;
  if(cmd==='import'){oneOf(pos[0],['tune'],'import source');result=await importTune(db,pos[1],f);}
  if(cmd==='add-partner'||cmd==='add-offer'){
   const entity=cmd==='add-partner'?'partners':'offers';let row;
   if(entity==='partners')row=(await db.query('insert into partners(name,owner,agreement_ref,review_on) values($1,$2,$3,$4) returning *',[need(f.name,'--name'),need(f.owner,'--owner'),need(f.agreement,'--agreement'),date(f['review-on'],'--review-on')]))[0];
   else row=(await db.query('insert into offers(name,owner,terms_ref) values($1,$2,$3) returning *',[need(f.name,'--name'),need(f.owner,'--owner'),need(f.terms,'--terms')]))[0];
   await audit(db,cmd,entity,row.id,null,row,f);result=row;
  }
  if(cmd==='set-partner'){
   const p=await resolve(db,'partners',pos[0]);const r=(await db.query('update partners set owner=$1,agreement_ref=$2,review_on=$3,status=$4 where id=$5 returning *',[need(f.owner,'--owner'),need(f.agreement,'--agreement'),date(f['review-on'],'--review-on'),oneOf(f.status||p.status,['active','paused'],'status'),p.id]))[0];await audit(db,cmd,'partners',p.id,p,r,f);result=r;
  }
  if(cmd==='set-offer'){
   const o=await resolve(db,'offers',pos[0]);const r=(await db.query('update offers set owner=$1,terms_ref=$2,status=$3 where id=$4 returning *',[need(f.owner,'--owner'),need(f.terms,'--terms'),oneOf(f.status||o.status,['active','paused'],'status'),o.id]))[0];await audit(db,cmd,'offers',o.id,o,r,f);result=r;
  }
  if(cmd==='record-disclosure'){
   if(date(f['checked-on'],'--checked-on')>new Date().toISOString().slice(0,10))throw Error('Disclosure check date cannot be in the future');
   const p=await resolve(db,'partners',pos[0]);const r=(await db.query('insert into disclosures(partner_id,placement,market,outcome,evidence_ref,checked_on,review_on) values($1,$2,$3,$4,$5,$6,$7) returning *',[p.id,need(f.placement,'--placement'),oneOf(f.market,['NZ','AU','other'],'market'),oneOf(f.outcome,['clear','missing','needs-review'],'outcome'),f.evidence,date(f['checked-on'],'--checked-on'),date(f['review-on'],'--review-on')]))[0];await audit(db,cmd,'disclosures',r.id,null,r,f);result=r;
  }
  if(cmd==='review-conversion'){
   const found=await resolve(db,'conversions',pos[0]);const c=(await db.query('select * from conversions where id=$1 for update',[found.id]))[0];
   const decision=oneOf(f.decision,['approved','pending','rejected'],'--decision');
   if(decision==='approved'){
    if(c.source_status!=='approved')throw Error('Only source-approved conversions can be locally approved');
    if((await db.query("select id from disputes where conversion_id=$1 and status='open'",[c.id])).length)throw Error('Resolve the open dispute before approving');
    const p=(await db.query('select * from partners where id=$1',[c.partner_id]))[0];if(p.status!=='active')throw Error('Partner is paused');
   }
   await db.query('insert into decisions(conversion_id,decision,operator,reason,evidence_ref) values($1,$2,$3,$4,$5)',[c.id,decision,f.by,f.reason,f.evidence]);
   const r=(await db.query('update conversions set decision=$1 where id=$2 returning *',[decision,c.id]))[0];await audit(db,cmd,'conversions',c.id,c,r,f);result=r;
  }
  if(cmd==='open-dispute'){
   const c=await resolve(db,'conversions',pos[0]);await db.query('select id from conversions where id=$1 for update',[c.id]);
   const r=(await db.query('insert into disputes(conversion_id,reason,owner,due_on,evidence_ref) values($1,$2,$3,$4,$5) returning *',[c.id,f.reason,need(f.owner,'--owner'),date(f['due-on'],'--due-on'),f.evidence]))[0];await audit(db,cmd,'disputes',r.id,null,r,f);result=r;
  }
  if(cmd==='close-dispute'){
   const d=await resolve(db,'disputes',pos[0]);await db.query('select id from conversions where id=$1 for update',[d.conversion_id]);
   const current=(await db.query('select * from disputes where id=$1 for update',[d.id]))[0];if(current.status==='closed')throw Error('Dispute is already closed');
   const r=(await db.query("update disputes set status='closed',resolution=$1,evidence_ref=$2 where id=$3 returning *",[need(f.resolution,'--resolution'),f.evidence,d.id]))[0];
   // Closing a dispute requires a fresh local decision; never silently restore a payable amount.
   const before=(await db.query('select * from conversions where id=$1',[d.conversion_id]))[0];
   const after=(await db.query("update conversions set decision='pending' where id=$1 returning *",[d.conversion_id]))[0];
   await db.query("insert into decisions(conversion_id,decision,operator,reason,evidence_ref) values($1,'pending',$2,$3,$4)",[d.conversion_id,f.by,'Dispute closed; fresh decision required: '+f.reason,f.evidence]);
   await audit(db,'reopen-after-dispute','conversions',d.conversion_id,before,after,f);await audit(db,cmd,'disputes',d.id,current,r,f);result=r;
  }
  if(cmd==='retention-review'){
   const c=await resolve(db,'conversions',pos[0]);const r=(await db.query('update conversions set retain_until=$1 where id=$2 returning *',[date(f['retain-until'],'--retain-until'),c.id]))[0];await audit(db,cmd,'conversions',c.id,c,r,f);result=r;
  }
  await db.exec(f['dry-run']?'ROLLBACK':'COMMIT');return result;
 }catch(e){await db.exec('ROLLBACK');throw e;}
}
export function decimalCents(v){const n=BigInt(String(v));const a=n<0n?-n:n;return `${n<0n?'-':''}${a/100n}.${String(a%100n).padStart(2,'0')}`;}
export function format(value){
 if(!Array.isArray(value))return JSON.stringify(value,null,2);
 if(!value.length)return '(none)';
 if(value[0]?.question)return value.map(x=>x.question+'\n'+format(x.rows)).join('\n\n');
 const keys=Object.keys(value[0]);return table(value,keys.map(key=>({key,label:key.replace(/_cents$/,'').replace(/_/g,' '),format:(v)=>v==null?'':key.endsWith('_cents')?decimalCents(v):v instanceof Date?v.toISOString():typeof v==='object'?JSON.stringify(v):String(v)})));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{db=await getDb();const result=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(result):format(result));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
}
