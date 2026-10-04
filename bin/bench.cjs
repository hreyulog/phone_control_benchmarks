#!/usr/bin/env node
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{spawnSync}=require('node:child_process');
const B=require('../lib/benchmark.cjs'),root=path.resolve(__dirname,'..');
const args=process.argv.slice(2),cmd=args[0]||'help';
const opt=(k,def)=>{const i=args.indexOf('--'+k);return i<0?def:args[i+1];};
const req=k=>{const v=opt(k);if(!v||v.startsWith('--'))throw Error('Missing --'+k);return v;};
const trial=()=>Number(opt('trial',1));
const help=`Phone benchmark CLI (Node 20+, no dependencies)
  doctor [--environment local/environment.json]
  validate
  list --batch smoke|tuning|holdout|all [--lang en|zh-CN]
  init --run NAME --batch smoke --repeat 1 --environment local/environment.json [--lang en|zh-CN]
  prepare --run NAME --task S001 [--trial 1] [--params local/params.json]
  dispatch --run NAME --task S001 --adapter /path/to/adapter.cjs [--trial 1]
  score --run NAME
  demo --run demo-01 [--lang en|zh-CN]
  preview [--port 4188]
Default prompt language: zh-CN. Select --lang en at init; prepare/dispatch/score inherit it.
Language is frozen per run. Read AGENTS.md (English) or AGENTS.zh-CN.md before real phone tests. score requires independently assessed evidence.
`;
function demo(run,lang){
 const now=new Date(),env={schema_version:1,execution_mode:'simulation',target_agent:'PHONE_BENCH_SIMULATION_ONLY',target_agent_version:'demo',model:'none',timezone:'Europe/Moscow',devices:[{alias:'simulated-phone',platform:'simulation',os_version:'none'}],operator:'demo-generator',environment_checked_at:now.toISOString()};
 const s=B.init(root,run,'smoke',1,env,lang),p=B.prepare(root,run,'S001',1,{}),dir=p.dir;
 fs.writeFileSync(path.join(dir,'evidence/simulated.txt'),'PHONE_BENCH_SIMULATION_ONLY\nThis is synthetic pipeline evidence, not a device trace or a real observation.\n');
 const a=B.readJson(path.join(dir,'assessment.json'));
 Object.assign(a,{status:'completed',assessor:{name:'demo-generator',kind:'agent',independent_from_target:true},started_at:new Date(now.getTime()-1000).toISOString(),finished_at:now.toISOString(),submission_evidence:'evidence/simulated.txt',execution_evidence:'evidence/simulated.txt',trace_path:'evidence/simulated.txt',total_tool_calls:0});
 for(const c of Object.values(a.criteria))Object.assign(c,{verdict:'pass',evidence:['evidence/simulated.txt'],reason:'SIMULATION ONLY: exercise the record and scoring pipeline.'});
 B.writeJson(path.join(dir,'assessment.json'),a);return B.score(root,run);
}
try{
 if(Number(process.versions.node.split('.')[0])<20)throw Error('Node.js 20+ is required');
 switch(cmd){
  case 'help':console.log(help);break;
  case 'validate':console.log(JSON.stringify(B.validate(root),null,2));break;
  case 'doctor':{
   const verified=B.validate(root),envFile=opt('environment',path.join(root,'local/environment.json'));let environment={configured:false,next:'Copy config/environment.example.json to local/environment.json and fill observed values.'};
   if(fs.existsSync(envFile)){const env=B.readJson(envFile);try{B.validateEnvironment(env,true);environment={configured:true,execution_mode:env.execution_mode,target_agent:env.target_agent,warning:'Per-trial current device preflight is still required.'};}catch(e){environment={configured:false,error:e.message};}}
   console.log(JSON.stringify({node:process.versions.node,dataset:verified,environment,phone_access_probed:false,message:'doctor validates local tools and declared config; it does not prove a phone is reachable.'},null,2));break;
  }
  case 'list':for(const source of B.selected(B.load(root).suite.tasks,opt('batch','smoke'))){const t=B.localize(source,B.language(opt('lang','zh-CN')));console.log(`${t.id}\t${t.difficulty}\t${t.title}\t${t.expected_outcome}`);}break;
  case 'init':{const env=B.readJson(path.resolve(req('environment')));const s=B.init(root,req('run'),opt('batch','smoke'),Number(opt('repeat',1)),env,B.language(opt('lang','zh-CN')));console.log(`Prepared ${s.run_id}: ${s.task_ids.length} tasks / ${s.planned_trials.length} planned trials. No phone actions sent.`);break;}
  case 'prepare':{if(opt('lang')&&B.language(opt('lang'))!==B.session(root,req('run')).language)throw Error('Language is frozen: start a new run to change it');const params=opt('params')?B.readJson(path.resolve(opt('params'))):{};console.log(JSON.stringify(B.prepare(root,req('run'),req('task'),trial(),params),null,2));break;}
  case 'dispatch':{
   const run=req('run'),id=req('task'),r=trial(),s=B.session(root,run);B.validateEnvironment(s.environment,true);
   if(s.environment.execution_mode==='simulation')throw Error('dispatch is for real, explicitly configured adapters; use demo for simulation');
   const dir=B.trialDir(root,run,id,r),input=path.join(dir,'submission.json'),task=B.load(root).suite.tasks.find(t=>t.id===id);
   if(!fs.existsSync(input))throw Error('prepare the task first');
   B.checkPreflight(dir,task,s.environment,Date.now());
   const receipt=path.join(dir,'dispatch.json');if(fs.existsSync(receipt))throw Error('Dispatch already attempted; inspect real target task before retrying. Automatic replay prohibited.');
   const adapter=fs.realpathSync(path.resolve(req('adapter')));if(!fs.statSync(adapter).isFile()||!adapter.endsWith('.cjs'))throw Error('adapter must be an explicitly selected local .cjs file');
   const prepared=B.readJson(input),checklist=B.readJson(path.join(dir,'operator-checklist.json')),bound=B.bind(task,checklist.parameters,`${run}-${id}-r${r}`,s.language);
   if(prepared.language!==s.language||prepared.user_prompt!==bound.prompt||prepared.execution_mode!==s.environment.execution_mode||prepared.task_id!==id||prepared.trial!==r)throw Error('Prepared input changed; no dispatch');
   fs.writeFileSync(receipt,JSON.stringify({attempted_at:new Date().toISOString(),task_id:id,trial:r,status:'dispatch_uncertain',message:'No automatic retry. Check target task after process completion/failure.'},null,2)+'\n',{flag:'wx'});
   // argv only: no shell interpolation. Adapter receives no evaluator criteria.
   const result=spawnSync(process.execPath,[adapter,input],{shell:false,env:{...process.env,PHONE_BENCH_TRIAL_DIR:dir},timeout:60000,maxBuffer:1024*1024,encoding:'utf8'});
   // stdout may contain secrets: keep it in ignored local evidence, never print to terminal/report.
   fs.writeFileSync(path.join(dir,'evidence/adapter-output.txt'),(result.stdout||'')+'\n'+(result.stderr||''));
   B.writeJson(receipt,{attempted_at:B.readJson(receipt).attempted_at,finished_at:new Date().toISOString(),task_id:id,trial:r,status:result.status===0?'adapter_returned':'dispatch_uncertain',exit_code:result.status,error:result.error?'Adapter error/timeout; inspect target before retrying.':null,not_an_assessment:true});
   console.log('Adapter returned. Inspect real target state and independent evidence; this is not a score.');if(result.status!==0)process.exitCode=2;break;
  }
  case 'score':{const s=B.score(root,req('run'));console.log(JSON.stringify({run_id:s.run_id,scope:s.batch,planned_tasks:s.task_count,planned_trials:s.planned_trials,execution_mode:s.execution_mode,overall_score:s.overall_score,goal_complete_trials:s.goal_complete_trials,real_executed_trials:s.real_executed_trials,status_counts:s.status_counts,report:`runs/${s.run_id}/report.html`},null,2));break;}
  case 'demo':{const s=demo(req('run'),B.language(opt('lang','zh-CN')));console.log(`SIMULATION ONLY: ${s.planned_trials} planned trials; real score = null; real executed = 0.\nOpen runs/${s.run_id}/report.html`);break;}
  case 'preview':{
   const port=Number(opt('port',4188));if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid port');
   const types={'.html':'text/html; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml','.zip':'application/zip'};
   http.createServer((req,res)=>{let p;try{p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(p==='/')p='/index.html';const f=B.within(root,p.slice(1)),real='/'+path.relative(fs.realpathSync(root),f).split(path.sep).join('/');if([p,real].some(v=>['/.git/','/local/','/runs/'].some(prefix=>v.startsWith(prefix))))throw Error('private');res.setHeader('Content-Type',types[path.extname(f)]||'text/plain; charset=utf-8');res.end(fs.readFileSync(f));}catch{res.writeHead(404).end('Not found');}}).listen(port,'127.0.0.1',()=>console.log(`Task catalog only: http://127.0.0.1:${port} (local/runs denied)`));break;
  }
  default:throw Error('Unknown command\n'+help);
 }
}catch(e){console.error(e.message);process.exitCode=1;}
