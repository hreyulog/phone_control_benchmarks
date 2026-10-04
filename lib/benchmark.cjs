const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const writeJson=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const name=v=>{if(typeof v!=='string'||!/^[-A-Za-z0-9_]{1,80}$/.test(v))throw Error('Invalid run/context name');return v;};
function within(root,relative,mustExist=true){
 if(typeof relative!=='string'||!relative||path.isAbsolute(relative)||/^[A-Za-z]:|\\|(^|\/)\.\.(\/|$)/.test(relative))throw Error('Evidence path must be a relative path inside this trial');
 const base=fs.realpathSync(root),p=path.resolve(base,relative);
 if(!p.startsWith(base+path.sep))throw Error('Path escapes trial');
 if(mustExist){const real=fs.realpathSync(p);if(!real.startsWith(base+path.sep)||!fs.statSync(real).isFile())throw Error('Evidence is not a regular file inside trial');return real;}return p;
}
function iso(v){if(typeof v!=='string'||!/(Z|[+-]\d{2}:\d{2})$/.test(v)||!Number.isFinite(Date.parse(v)))throw Error('Timestamp requires ISO date/time with explicit timezone');return Date.parse(v);}
function load(root){return {suite:readJson(path.join(root,'dataset/tasks.json')),rubric:readJson(path.join(root,'dataset/rubric.json')),manifest:readJson(path.join(root,'dataset/manifest.json'))};}
function language(v='zh-CN'){if(!['zh-CN','en'].includes(v))throw Error('Unsupported language: use en or zh-CN');return v;}
function localize(task,lang='zh-CN'){
 language(lang);if(lang==='zh-CN')return task;
 const tr=task.translations?.en;if(!tr)throw Error('Missing English translation: '+task.id);
 return {...task,...tr};
}
function validate(root){
 const {suite,rubric,manifest}=load(root),tasks=suite.tasks;
 if(tasks.length!==100||suite.total!==100||manifest.task_count!==100)throw Error('Expected 100 tasks');
 if(new Set(tasks.map(t=>t.id)).size!==100)throw Error('Duplicate task identities');
 for(let i=0;i<100;i++){const t=tasks[i];if(t.id!==`S${String(i+1).padStart(3,'0')}`||!t.user_prompt||!t.acceptance?.length||!t.preconditions?.length||!t.optimization_focus||!t.expected_outcome)throw Error('Invalid task '+t.id);}
 if(JSON.stringify(suite.languages)!==JSON.stringify(['zh-CN','en']))throw Error('Dataset languages missing');
 for(const t of tasks){const e=t.translations?.en;for(const key of ['title','category','user_prompt','optimization_focus','assessor_instruction'])if(typeof e?.[key]!=='string'||!e[key].trim())throw Error('Missing English field: '+t.id+'/'+key);for(const key of ['preconditions','acceptance','run_sequence'])if(!Array.isArray(e[key])||e[key].length!==t[key].length||e[key].some(x=>typeof x!=='string'||!x.trim()))throw Error('Invalid English array: '+t.id+'/'+key);}
 if(rubric.criteria.some(c=>!c.instruction_en))throw Error('English rubric missing');
 const groups={};for(const t of tasks)groups[t.category]=(groups[t.category]||0)+1;
 if(Object.keys(groups).length!==10||Object.values(groups).some(n=>n!==10))throw Error('Category counts');
 if(tasks.filter(t=>t.split==='holdout').length!==20||tasks.filter(t=>t.split==='tuning').length!==80||tasks.filter(t=>t.smoke).length!==20||tasks.some(t=>t.smoke&&t.split!=='tuning'))throw Error('Split counts');
 if(rubric.criteria.reduce((s,c)=>s+c.weight,0)!==100||new Set(rubric.criteria.map(c=>c.id)).size!==6)throw Error('Rubric weights/identities');
 const required=['dataset/tasks.json','dataset/rubric.json',...fs.readdirSync(path.join(root,'fixtures')).sort().map(n=>'fixtures/'+n)];
 if(required.length!==manifest.files.length||new Set(manifest.files.map(x=>x.file)).size!==manifest.files.length)throw Error('Frozen file list');
 for(const file of required){const record=manifest.files.find(f=>f.file===file);if(!record||sha(fs.readFileSync(within(root,file)))!==record.sha256)throw Error('Dataset/fixture hash mismatch: '+file);}
 return {tasks:100,categories:10,tuning:80,holdout:20,smoke:20,manifest_sha256:sha(fs.readFileSync(path.join(root,'dataset/manifest.json')))};
}
function selected(tasks,batch){if(!['all','smoke','tuning','holdout'].includes(batch))throw Error('Unknown batch');return tasks.filter(t=>batch==='all'||(batch==='smoke'?t.smoke:t.split===batch));}
function validateEnvironment(e,execution=false){
 if(e.schema_version!==1||!['sofia-normal-chat','direct-phone-agent','simulation'].includes(e.execution_mode)||!e.target_agent||!e.timezone||!Array.isArray(e.devices))throw Error('Invalid environment schema');
 if(execution&&e.execution_mode!=='simulation'){
  if(!e.target_agent_version||!e.model||!e.operator||!e.environment_checked_at||!e.devices.length)throw Error('Fill target version/model/operator/current device environment before real execution');
  iso(e.environment_checked_at);try{new Intl.DateTimeFormat('en',{timeZone:e.timezone});}catch{throw Error('Invalid environment timezone');}
  if(new Set(e.devices.map(d=>d.alias)).size!==e.devices.length)throw Error('Device aliases must be unique');
  for(const d of e.devices)if(!d.alias||!d.platform||!d.os_version)throw Error('Device alias/platform/os_version missing');
 }
 return e;
}
function init(root,run,batch,repeat,environment,lang='zh-CN'){
 validate(root);language(lang);name(run);if(!Number.isInteger(repeat)||repeat<1||repeat>20)throw Error('repeat must be 1..20');validateEnvironment(environment);
 const dir=path.join(root,'runs',run);if(fs.existsSync(dir))throw Error('Run exists: preserved; choose a new name');
 const {suite,rubric}=load(root),tasks=selected(suite.tasks,batch);
 fs.mkdirSync(dir,{recursive:true});
 const session={schema_version:1,language:lang,run_id:run,dataset_version:suite.dataset_version,rubric_version:rubric.version,manifest_sha256:sha(fs.readFileSync(path.join(root,'dataset/manifest.json'))),created_at:new Date().toISOString(),batch,repeat,task_ids:tasks.map(t=>t.id),planned_trials:tasks.flatMap(t=>Array.from({length:repeat},(_,i)=>({task_id:t.id,trial:i+1}))),environment};
 writeJson(path.join(dir,'session.json'),session);writeJson(path.join(dir,'session.lock.json'),{sha256:sha(fs.readFileSync(path.join(dir,'session.json')))});return session;
}
function session(root,run){name(run);validate(root);const s=readJson(path.join(root,'runs',run,'session.json')),d=load(root);
 if(readJson(path.join(root,'runs',run,'session.lock.json')).sha256!==sha(fs.readFileSync(path.join(root,'runs',run,'session.json'))))throw Error('Frozen session changed; start a new run instead of changing environment/denominator');
 if(s.run_id!==run||s.schema_version!==1||s.manifest_sha256!==sha(fs.readFileSync(path.join(root,'dataset/manifest.json')))||s.rubric_version!==d.rubric.version||s.dataset_version!==d.suite.dataset_version)throw Error('Run identity or frozen dataset changed');
 const ids=selected(d.suite.tasks,s.batch).map(t=>t.id),plan=ids.flatMap(task_id=>Array.from({length:s.repeat},(_,i)=>({task_id,trial:i+1})));
 if(!Number.isInteger(s.repeat)||s.repeat<1||s.repeat>20||JSON.stringify(ids)!==JSON.stringify(s.task_ids)||JSON.stringify(plan)!==JSON.stringify(s.planned_trials))throw Error('Run denominator/plan changed');
 if(s.language!==language(s.language))throw Error('Session language missing');validateEnvironment(s.environment);return s;
}
function location(root,run,id,trial){const dir=path.join(root,'runs',run,id,`r${String(trial).padStart(2,'0')}`);const base=fs.realpathSync(root);for(const p of [path.join(root,'runs',run),path.dirname(dir),dir])if(fs.existsSync(p)&&!fs.realpathSync(p).startsWith(base+path.sep))throw Error('Trial directory escapes repository');return dir;}
function trialDir(root,run,id,trial){const s=session(root,run);if(!s.planned_trials.some(t=>t.task_id===id&&t.trial===trial))throw Error('Task/trial is not in frozen run plan');return location(root,run,id,trial);}
function bind(task,params,context,lang='zh-CN'){
 task=localize(task,lang);
 if(typeof context!=='string'||!/^[-A-Za-z0-9_]{1,128}$/.test(context))throw Error('Invalid context identity');params={...params,RUN_ID:context};
 for(const k of task.parameters){if(typeof params[k]!=='string'||!params[k].trim()||/REPLACE|YYYY-MM-DD|assigned-by-prepare/i.test(params[k]))throw Error('Missing/unbound parameter: '+k);}
 for(const k of ['travel_date','visit_date'])if(task.parameters.includes(k)){const v=params[k];if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)throw Error('Invalid date: '+k);}
 let prompt=task.user_prompt.replaceAll('RUN_ID',context);
 const direct=lang==='en'?{DATE_AT_TIME:'DATE_AT_TIME',device_a:'device A',device_b:'device B',travel_date:'the test date',music_app:'the installed music app',hotel:'the specified hotel'}:{DATE_AT_TIME:'DATE_AT_TIME',device_a:'设备 A',device_b:'设备 B',travel_date:'测试日期',music_app:'已安装音乐 App',hotel:'指定酒店'};
 for(const [k,label]of Object.entries(direct))if(task.parameters.includes(k))prompt=prompt.replaceAll(label,params[k]);
 const suffix=lang==='en'?{visit_date:'Visit date',museum_a:'First museum and official website',museum_b:'Second museum and official website',fixture_url:'Test page URL'}:{visit_date:'参观日期',museum_a:'第一家博物馆及官网',museum_b:'第二家博物馆及官网',fixture_url:'测试网页 URL'};
 for(const [k,label]of Object.entries(suffix))if(task.parameters.includes(k))prompt+=`\n${label}${lang==='en'?': ':'：'}${params[k]}`;
 if(task.number===89)prompt+=`\n${lang==='en'?'Execution time: ':'执行时刻：'}${params.DATE_AT_TIME}`;
 if(task.parameters.includes('fixture_url')){const u=new URL(params.fixture_url);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error('Fixture URL must be plain HTTP(S)');}
 if(/RUN_ID|DATE_AT_TIME|REPLACE-WITH/.test(prompt))throw Error('Unresolved prompt placeholder');
 const attachments=task.number===48?['long-note-600.txt']:task.number===49?['long-note-1500.txt']:task.number===58?['sample-utf8.txt','long-note-600.txt']:task.number===68?[params.calendar_event_attachment]:[];
 return {prompt,params,attachments};
}
function prepare(root,run,id,trial,params){
 const s=session(root,run),source=load(root).suite.tasks.find(t=>t.id===id);if(!source)throw Error('Unknown task');const task=localize(source,s.language);
 const dir=trialDir(root,run,id,trial);if(fs.existsSync(path.join(dir,'submission.json')))throw Error('Prepared input exists; preserved');
 const context=`${run}-${id}-r${trial}`,bound=bind(source,params,context,s.language),promptHash=sha(Buffer.from(bound.prompt));
 fs.mkdirSync(path.join(dir,'evidence'),{recursive:true});
 fs.writeFileSync(path.join(dir,'prompt.txt'),bound.prompt+'\n');
 writeJson(path.join(dir,'submission.json'),{schema_version:1,language:s.language,task_id:id,trial,context_id:context,user_prompt:bound.prompt,required_attachments:bound.attachments,execution_mode:s.environment.execution_mode});
 writeJson(path.join(dir,'operator-checklist.json'),{language:s.language,do_not_send_to_target:true,preconditions:task.preconditions,parameters:bound.params,run_sequence:task.run_sequence,acceptance:task.acceptance,assessor_instruction:task.assessor_instruction,expected_outcome:task.expected_outcome,gate:task.gate});
 writeJson(path.join(dir,'preflight.json'),{schema_version:1,observed_at:null,device_alias:null,os_version:null,unlocked:null,battery_percent:null,active_tasks_before:null,phone_ready:null,web_ready:null,file_ready:null,required_apps_checked:null,fixtures_ready:null,preparation_notes:null});
 writeJson(path.join(dir,'assessment.json'),{schema_version:1,language:s.language,task_id:id,trial,prompt_sha256:promptHash,execution_mode:s.environment.execution_mode,status:'not_run',assessor:{name:null,kind:null,independent_from_target:null},started_at:null,finished_at:null,submission_evidence:null,execution_evidence:null,trace_path:null,criteria:Object.fromEntries(load(root).rubric.criteria.map(c=>[c.id,{verdict:'unverified',evidence:[],reason:''}])),unexpected_side_effects:[],blocker:null,timings:{model_ms:null,tool_ms:null,approval_wait_ms:null,human_takeover_ms:null},total_tool_calls:null,artifact:{uploaded:null,received:null,byte_hash_match:null},notes:''});
 return {dir,submission:path.join(dir,'submission.json'),prompt_sha256:promptHash};
}
function requiredCaps(task){
 const n=task.number;
 const web=(n>=11&&n<=20)||[50,76,80,82,85,87,88,89,92,96,97,98,100].includes(n);
 const phone=(n<=10)||(n>=21&&n<=50)||(n>=61&&n<=79&&![71,76].includes(n))||[83,85,86,90,91,93,94,95,97,98,99,100].includes(n);
 const file=(n>=51&&n<=60)||[30,50,69,90,95,97,98,99,100].includes(n);
 return {web,phone,file};
}
function checkPreflight(dir,task,environment,start){
 const p=readJson(path.join(dir,'preflight.json'));
 if(p.schema_version!==1||!environment.devices.some(d=>d.alias===p.device_alias)||!p.os_version||p.unlocked!==true||p.active_tasks_before!==0||!Number.isFinite(p.battery_percent)||p.battery_percent<15||p.battery_percent>100||p.required_apps_checked!==true||p.fixtures_ready!==true)throw Error('Task preflight is incomplete/not ready');
 const when=iso(p.observed_at);if(when>start||start-when>15*60*1000)throw Error('Preflight must be observed within 15 minutes before trial start');
 const caps=requiredCaps(task);for(const c of ['phone','web','file'])if(caps[c]&&p[c+'_ready']!==true)throw Error('Required capability not ready: '+c);
 return p;
}
function assess(root,run,id,trial,assessment){
 const s=session(root,run),task=load(root).suite.tasks.find(t=>t.id===id),rubric=load(root).rubric,dir=trialDir(root,run,id,trial);
 const a=assessment||readJson(path.join(dir,'assessment.json'));
 if(a.schema_version!==1||a.task_id!==id||a.trial!==trial||a.execution_mode!==s.environment.execution_mode||a.language!==s.language)throw Error('Assessment identity/mode/language mismatch');
 const states=['not_run','ineligible_precondition','completed','partial','blocked','cancelled','awaiting_approval'];
 if(!states.includes(a.status))throw Error('Invalid assessment status');
 if(['not_run','ineligible_precondition'].includes(a.status))return {task_id:id,trial,status:a.status,score:0,goal_complete:false,real_executed:false,independent_verified:false,blocker:a.blocker||null,evidence:[]};
 validateEnvironment(s.environment,true);
 if(!a.assessor?.name||!['human','agent'].includes(a.assessor.kind)||a.assessor.independent_from_target!==true)throw Error('Independent assessor identity is required');
 const sub=readJson(path.join(dir,'submission.json'));
 if(sub.language!==s.language||sub.task_id!==id||sub.trial!==trial||sub.execution_mode!==s.environment.execution_mode||sub.context_id!==`${run}-${id}-r${trial}`||sha(Buffer.from(sub.user_prompt))!==a.prompt_sha256||fs.readFileSync(path.join(dir,'prompt.txt'),'utf8')!==sub.user_prompt+'\n')throw Error('Prepared input changed/mismatched');
 const check=readJson(path.join(dir,'operator-checklist.json')),rebound=bind(task,check.parameters,sub.context_id,s.language);
 if(rebound.prompt!==sub.user_prompt||JSON.stringify(rebound.attachments)!==JSON.stringify(sub.required_attachments))throw Error('Prepared input differs from frozen task and bound parameters');
 const start=iso(a.started_at),finish=iso(a.finished_at);if(finish<start||finish>Date.now()+5*60*1000)throw Error('Invalid execution time interval');
 if(s.environment.execution_mode!=='simulation'){checkPreflight(dir,task,s.environment,start);if([82,84,87,88,89,90].includes(task.number)&&s.environment.devices.length<2)throw Error('This peer task needs at least two distinct test devices');}
 if(!Array.isArray(a.unexpected_side_effects))throw Error('Side effect list missing');
 const proofs=new Map();
 function proof(ref){const p=within(dir,ref),bytes=fs.readFileSync(p);if(!bytes.length)throw Error('Empty evidence file');if(s.environment.execution_mode!=='simulation'&&bytes.includes(Buffer.from('PHONE_BENCH_SIMULATION_ONLY')))throw Error('Simulation evidence cannot score as real');proofs.set(ref,{file:ref,bytes:bytes.length,sha256:sha(bytes)});}
 proof(a.submission_evidence);proof(a.execution_evidence);
 if(s.environment.execution_mode!=='simulation')proof('preflight.json');
 if(Object.keys(a.criteria||{}).length!==6)throw Error('All six rubric criteria are required');
 for(const c of rubric.criteria){const v=a.criteria[c.id];if(!v||!['pass','partial','fail','unverified'].includes(v.verdict)||(!c.allow_partial&&v.verdict==='partial')||!Array.isArray(v.evidence))throw Error('Invalid verdict '+c.id);
  if(v.verdict!=='unverified'&&(!v.reason||!v.reason.trim()))throw Error('Reason required: '+c.id);
  if(['pass','partial'].includes(v.verdict)&&!v.evidence.length)throw Error('Evidence required: '+c.id);
  for(const ref of v.evidence)proof(ref);
 }
 if(a.criteria.traceability.verdict==='pass'){if(!a.trace_path)throw Error('Actual trace path required');proof(a.trace_path);}
 const primary=a.criteria.goal_primary.verdict,independent=a.criteria.independent_outcome.verdict==='pass',constraint=a.criteria.constraints.verdict;
 if(task.expected_outcome==='user-goal'&&['blocked','cancelled'].includes(a.status)&&['pass','partial'].includes(primary))throw Error('Blocked/cancelled positive task cannot claim goal points');
 if(a.status==='partial'&&primary==='pass'&&a.criteria.goal_completeness.verdict==='pass')throw Error('Partial status cannot claim complete goal');
 if(a.status==='awaiting_approval'&&task.gate!=='final-step-approval')throw Error('Unexpected approval state for this task');
 const points={};for(const c of rubric.criteria){const v=a.criteria[c.id].verdict;points[c.id]=v==='pass'?c.weight:v==='partial'?c.weight/2:0;if(c.id.startsWith('goal_')&&!independent)points[c.id]=0;}
 let score=Object.values(points).reduce((a,b)=>a+b,0);
 const cap=constraint==='fail'||a.unexpected_side_effects.length>0;if(cap)score=0;
 for(const [k,v]of Object.entries(a.timings||{}))if(v!==null&&(!Number.isFinite(v)||v<0))throw Error('Invalid timing '+k);
 if(a.total_tool_calls!==null&&(!Number.isInteger(a.total_tool_calls)||a.total_tool_calls<0))throw Error('Invalid call count');
 return {task_id:id,trial,status:a.status,score,criterion_points:points,goal_complete:!cap&&independent&&constraint==='pass'&&primary==='pass'&&a.criteria.goal_completeness.verdict==='pass',real_executed:s.environment.execution_mode!=='simulation',independent_verified:independent,elapsed_ms:finish-start,timings:a.timings,total_tool_calls:a.total_tool_calls,artifact:a.artifact,blocker:a.blocker||null,critical_violation:cap,evidence:[...proofs.values()],assessor:a.assessor,expected_outcome:task.expected_outcome,notes:a.notes||''};
}
const percentile=(values,q)=>{if(!values.length)return null;const s=values.slice().sort((a,b)=>a-b);return s[Math.max(0,Math.ceil(q*s.length)-1)];};
function score(root,run){
 const s=session(root,run),{suite}=load(root),trials=[];
 for(const p of s.planned_trials){const dir=location(root,run,p.task_id,p.trial),f=path.join(dir,'assessment.json');
  if(!fs.existsSync(f)){trials.push({...p,status:'not_run',score:0,goal_complete:false,real_executed:false,independent_verified:false,evidence:[]});continue;}
  try{trials.push(assess(root,run,p.task_id,p.trial));}catch(e){trials.push({...p,status:'invalid_assessment',score:0,goal_complete:false,real_executed:false,independent_verified:false,error:e.message,evidence:[]});}
 }
 const tasks=s.task_ids.map(id=>{const t=localize(suite.tasks.find(x=>x.id===id),s.language),ts=trials.filter(x=>x.task_id===id);return {task_id:id,title:t.title,category:t.category,difficulty:t.difficulty,score:ts.reduce((sum,x)=>sum+x.score,0)/s.repeat,completed_trials:ts.filter(x=>x.goal_complete).length,planned_trials:s.repeat};});
 const modes=s.environment.execution_mode,simulation=modes==='simulation',counts={};for(const t of trials)counts[t.status]=(counts[t.status]||0)+1;
 const durations=trials.filter(t=>t.real_executed&&Number.isFinite(t.elapsed_ms)).map(t=>t.elapsed_ms),executed=trials.filter(t=>t.real_executed).length,goals=trials.filter(t=>t.real_executed&&t.goal_complete).length;
 const out={schema_version:1,language:s.language,run_id:run,dataset_version:s.dataset_version,rubric_version:s.rubric_version,manifest_sha256:s.manifest_sha256,generated_at:new Date().toISOString(),batch:s.batch,task_count:s.task_ids.length,total_dataset_tasks:100,repeat:s.repeat,planned_trials:s.planned_trials.length,execution_mode:modes,simulation,overall_score:simulation?null:tasks.reduce((sum,t)=>sum+t.score,0)/tasks.length,simulation_pipeline_score:simulation?tasks.reduce((sum,t)=>sum+t.score,0)/tasks.length:null,goal_completion_rate:simulation?null:goals/s.planned_trials.length,goal_complete_trials:simulation?0:goals,real_executed_trials:executed,real_execution_coverage:executed/s.planned_trials.length,independent_verified_trials:simulation?0:trials.filter(t=>t.real_executed&&t.independent_verified).length,status_counts:counts,elapsed_ms:{n:durations.length,p50:percentile(durations,.5),p95:percentile(durations,.95)},environment:s.environment,limitations:['Evidence file validation is mechanical; factual/semantic verdicts are supplied by the named independent assessor.','Public holdout and same-workspace directories do not certify isolation.','Blocked, invalid and unrun trials remain in the planned denominator.','Different execution modes/languages/environments are not automatically comparable.'],by_category:Object.fromEntries([...new Set(tasks.map(t=>t.category))].map(k=>{const list=tasks.filter(t=>t.category===k);return[k,{count:list.length,score:simulation?null:list.reduce((a,t)=>a+t.score,0)/list.length}];})),by_difficulty:Object.fromEntries(['easy','medium','hard'].map(k=>{const list=tasks.filter(t=>t.difficulty===k);return[k,{count:list.length,score:!list.length||simulation?null:list.reduce((a,t)=>a+t.score,0)/list.length}];})),tasks,trials};
 const dir=path.join(root,'runs',run);writeJson(path.join(dir,'score.json'),out);fs.writeFileSync(path.join(dir,'report.html'),report(out));return out;
}
const report=require('./report.cjs');
module.exports={sha,readJson,writeJson,within,validate,load,selected,validateEnvironment,init,session,trialDir,bind,prepare,checkPreflight,assess,score,report,requiredCaps,language,localize};
