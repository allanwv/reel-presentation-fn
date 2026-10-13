const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/110f701c48e68d66/node_modules/hyperframes/package.json'),sharp=req('sharp');
const root=process.cwd(),out='analysis/exercise-typing',baseline=fs.readFileSync('analysis/interaction-fixes/floating-cards-before.js.txt','utf8'),current=fs.readFileSync('assets/ui/floating/floating-cards.js','utf8');
const withoutInput=s=>s.replace(/\r\n/g,'\n').replace(/  const inputSequence=\(card,entries\)=>\{[\s\S]*?\n  \};\n  sync\(\);/,'  INPUT_SEQUENCE\n  sync();');
const scopePreserved=withoutInput(baseline)===withoutInput(current),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((q,r)=>{const url=decodeURIComponent(q.url.split('?')[0]),f=path.resolve(root,'.'+url);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)){r.writeHead(404).end();return;}const ext=path.extname(f);r.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'})[ext]||'application/octet-stream'});if(q.headers['x-before']==='1'&&url==='/assets/ui/floating/floating-cards.js')r.end(baseline);else fs.createReadStream(f).pipe(r);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await req('puppeteer-core').launch({executablePath:'C:/Users/aweis/.cache/puppeteer/chrome-headless-shell/win64-152.0.7977.75/chrome-headless-shell-win64/chrome-headless-shell.exe',headless:true});
  const page=await browser.newPage(),runtimeErrors=[];await page.setViewport({width:1080,height:1920});await page.evaluateOnNewDocument('window.__timelines={};');page.on('pageerror',e=>runtimeErrors.push(e.message));
  async function enter(before){await page.setExtraHTTPHeaders({'x-before':before?'1':'0'});await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction('Boolean(window.__timelines?.main)');const missing=await page.evaluate(async()=>{await document.fonts.ready;await Promise.allSettled([...document.images].map(n=>n.decode()));return [...document.images].filter(n=>!n.naturalWidth).map(n=>n.src);});if(missing.length)throw Error('Missing images:'+missing);}
  function capture(){
   const timeline=window.__timelines.main,fields=['series','reps','rir','rest'],times=[5.199,5.2,5.52,5.62,5.7299,5.73,5.98,6.0899,6.09,6.2199,6.22,6.34,6.4499,6.45,6.70,6.8099,6.81,7.32,7.6,8.1,...Array.from({length:73},(_,i)=>(156+i)/30)].sort((a,b)=>a-b),samples={};
   const snap=()=>({fields:Object.fromEntries(['#exercise-card','#floating-exercise-card'].map(root=>[root,fields.map(name=>{const f=document.querySelector(root+' [data-field="'+name+'"]'),op=s=>{const n=f.querySelector(s);return n?Number(getComputedStyle(n).opacity):0;};return{name,transform:f.style.transform,empty:op('.ui-field-empty'),initial:op('.ui-field-initial'),full:op('.ui-field-value'),prefix:op('.ui-field-typed-prefix')};})])),cardTransforms:['#exercise-card','#floating-exercise-card'].map(s=>{const n=document.querySelector(s);return[n.style.transform,n.style.opacity,n.style.borderRadius,n.style.boxShadow];}),phones:Object.fromEntries(['coach','client'].map(role=>{const p=window.__fitnodePhoneYaw[role];return[role,{angle:p.pose.angle,rig:p.rig.style.transform,quad:p.projectedQuad()}];}))});
   timeline.totalTime(Number(document.querySelector('#root').dataset.duration)-.001,false);for(const t of times){timeline.totalTime(t,false);samples[t]=snap();}const reverseErrors=[];for(const t of [...times].reverse()){timeline.totalTime(t,false);if(JSON.stringify(snap())!==JSON.stringify(samples[t]))reverseErrors.push(t);}return{duration:timeline.duration(),rootDuration:document.querySelector('#root').dataset.duration,samples,reverseErrors};
  }
  await enter(true);const before=await page.evaluate(capture);await enter(false);const after=await page.evaluate(capture),failures=[];
  if(!scopePreserved)failures.push('Helper changed outside inputSequence');if(before.duration!==after.duration||before.rootDuration!==after.rootDuration)failures.push('Timeline duration changed');
  for(const[t,s]of Object.entries(after.samples)){
   const b=before.samples[t];if(JSON.stringify(s.phones)!==JSON.stringify(b.phones)||JSON.stringify(s.cardTransforms)!==JSON.stringify(b.cardTransforms))failures.push('Phone/card motion changed:'+t);
   for(const[root,fields]of Object.entries(s.fields))for(let i=0;i<fields.length;i++){
    const f=fields[i],at=[5.62,5.98,6.34,6.70][i],time=Number(t),expectedFull=time+1e-7>=(at+(i===1?.24:.11))?1:0,expectedPrefix=i===1&&time+1e-7>=6.09&&time+1e-7<6.22?1:0;
    if(f.transform!==b.fields[root][i].transform)failures.push('Focus motion changed:'+t+':'+f.name);
    if(time>=5.2&&f.initial!==0)failures.push('Old value showing:'+t+':'+f.name);
    if(f.full!==expectedFull||f.prefix!==expectedPrefix)failures.push('Typing state:'+t+':'+f.name+':'+JSON.stringify(f));
    if(f.empty!==1||![0,1].includes(f.full)||![0,1].includes(f.prefix)||f.full+f.prefix>1)failures.push('Input layer flash/overlap:'+t+':'+f.name);
   }
  }
  if(after.reverseErrors.length)failures.push('Reverse seek states changed');
  const originals=JSON.parse(fs.readFileSync('iphone-refinement-proof/original-hashes.json','utf8')),originalFailures=Object.entries(originals).filter(([p,h])=>sha(p)!==h).map(([p])=>p);if(originalFailures.length)failures.push('Original assets changed');
  const proofTimes=[5.5,5.84,6.13,6.25,6.48,6.85,7.35,7.61],panels=[];
  for(const t of proofTimes){
   await page.evaluate(t=>{window.__timelines.main.totalTime(t,false);for(const n of document.querySelectorAll('[data-start][data-duration]'))n.style.visibility=t>=Number(n.dataset.start)&&t<Number(n.dataset.start)+Number(n.dataset.duration)?'visible':'hidden';},t);
   const file=out+'/frame-'+String(t).replace('.','_')+'.png';await page.screenshot({path:file});
   const box=await page.evaluate(t=>{const b=document.querySelector(t<7.6?'#floating-exercise-card':'#exercise-card').getBoundingClientRect();return{left:Math.max(0,Math.floor(b.x-15)),top:Math.max(0,Math.floor(b.y-15)),width:Math.min(1080-Math.max(0,Math.floor(b.x-15)),Math.ceil(b.width+30)),height:Math.min(1920-Math.max(0,Math.floor(b.y-15)),Math.ceil(b.height+30))};},t);
   panels.push(await sharp(file).extract(box).resize({width:420,height:330,fit:'contain',background:'#061a2c'}).png().toBuffer());
  }
  await sharp({create:{width:1680,height:660,channels:3,background:'#061a2c'}}).composite(panels.map((input,i)=>({input,left:i%4*420,top:Math.floor(i/4)*330}))).png().toFile(out+'/typing-contact.png');
  const report={runtimeErrors,failures,scopePreserved,duration:after.duration,rootDuration:after.rootDuration,sampleCount:Object.keys(after.samples).length,reverseErrors:after.reverseErrors,originalCount:Object.keys(originals).length,originalFailures,typing:{focusStarts:[5.62,5.98,6.34,6.70],singleDigitDelay:.11,repsFirstAt:6.09,repsFullAt:6.22,repsPrefixHold:.13,cardWindow:[5.2,7.6]},samples:after.samples,proofTimes};
  fs.writeFileSync(out+'/verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify({runtimeErrors,failures,scopePreserved,duration:after.duration,rootDuration:after.rootDuration,sampleCount:report.sampleCount,reverseErrors:after.reverseErrors,originalCount:report.originalCount,originalFailures}));if(runtimeErrors.length||failures.length)process.exitCode=1;
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
