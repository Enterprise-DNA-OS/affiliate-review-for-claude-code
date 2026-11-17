import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { REPO_ROOT, getDb } from './lib/db.mjs';
import { migrate } from './migrate.mjs';
import { seed } from './seed.mjs';
import { run, format } from './affiliate.mjs';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'affiliate-demo-'));
process.env.DATABASE_URL='';process.env.DATA_DIR=path.join(root,'db');process.env.OUTPUT_DIR=root;
let db;
try{
 db=await getDb();await migrate(db);await seed(db);
 const captures=[];
 for(const [title,ask,cmd] of [
  ['Decisions overdue','Which conversions still need a decision?','validation-queue'],
  ['Amounts by partner','What is ready for review and what is still pending?','partner-margins'],
  ['Disclosure evidence','Which partner advertisements need another look?','disclosure-check']
 ]){const output=format(await run(db,[cmd]));console.log('\n'+ask+'\n'+output);captures.push({title,ask,command:`node scripts/affiliate.mjs ${cmd}`,output});}
 fs.writeFileSync(path.join(root,'screens.json'),JSON.stringify(captures,null,2));
 await db.close();db=null;
 for(const name of ['view','docs']){const p=spawnSync(process.execPath,[`scripts/${name}.mjs`],{cwd:REPO_ROOT,env:process.env,encoding:'utf8'});if(p.status!==0)throw Error(p.stderr||p.stdout);console.log(p.stdout.trim());}
 console.log('Demo PASS. '+(process.argv.includes('--keep')?`Files: ${root}`:'Temporary data removed.'));
}finally{if(db)await db.close();if(!process.argv.includes('--keep'))fs.rmSync(root,{recursive:true,force:true});}
