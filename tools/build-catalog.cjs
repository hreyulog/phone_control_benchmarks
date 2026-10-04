const fs=require('node:fs'),path=require('node:path'),B=require('../lib/benchmark.cjs');
const root=path.resolve(__dirname,'..');B.validate(root);
const data=JSON.stringify(B.load(root).suite.tasks).replaceAll('<','\\u003c');
const template=fs.readFileSync(path.join(__dirname,'catalog-template.html'),'utf8');
fs.writeFileSync(path.join(root,'index.html'),template.replace('__TASK_DATA__',()=>data));
console.log('Built bilingual portable offline task catalog.');
