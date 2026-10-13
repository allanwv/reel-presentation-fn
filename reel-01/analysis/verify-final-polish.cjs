const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/110f701c48e68d66/node_modules/hyperframes/package.json');
const sharp=req('sharp'),root=process.cwd(),out='analysis/final-polish';
(async()=>{
 const server=http.createServer((q,r)=>{
  const url=decodeURIComponent(q.url.split('?')[0]);let f=path.resolve(root,'.'+url);
  if(url==='/before.html')f=path.join(root,out,'index-before.html.txt');
  if(!f.startsWith(root+path.sep)||!fs.existsSync(f)){r.writeHead(404).end();return;}
  const ext=url==='/before.html'?'.html':path.extname(url);
  r.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'})[ext]||'application/octet-stream'});
  if(q.headers['x-baseline']==='1'&&url.endsWith('/floating-cards.css')){
   return r.end(fs.readFileSync(f,'utf8').replace('top:115px; width:240px; height:275px','top:250px; width:240px; height:140px').replace('top:239px; width:240px; height:35.3333333333px','top:104px; width:240px; height:35.3333333333px'));
  }
  if(q.headers['x-baseline']==='1'&&url.endsWith('/completion.css'))return r.end(fs.readFileSync(f,'utf8').replace('top:167.6666666667px','top:32.6666666667px').replace('top:203.3333333333px','top:68.3333333333px'));
  fs.createReadStream(f).pipe(r);
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await req('puppeteer-core').launch({executablePath:'C:/Users/aweis/.cache/puppeteer/chrome-headless-shell/win64-152.0.7977.75/chrome-headless-shell-win64/chrome-headless-shell.exe',headless:true});
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width:1080,height:1920});await page.evaluateOnNewDocument('window.__timelines={};');
  async function enter(before){await page.setExtraHTTPHeaders({'x-baseline':before?'1':'0'});await page.goto('http://127.0.0.1:'+server.address().port+(before?'/before.html':'/index.html'));await page.waitForFunction('Boolean(window.__timelines?.main)');const broken=await page.evaluate(async()=>{await Promise.allSettled([...document.images].map(n=>n.decode()));return [...document.images].filter(n=>!n.naturalWidth).map(n=>n.getAttribute('src'));});if(broken.length)throw Error('Broken images: '+broken.join(','));}
  const capture=()=>{
   const tl=window.__timelines.main,samples={};
   const times=[.01,.5,1.6,1.9,2.2,2.4,2.8,3.08,3.16,3.6,4.35,5.2,6.4,7.8,7.9,7.95,8.35,8.61,8.675,9,9.6,10.55,10.9,11.3,12.4,13.15,13.32,14.5,15.6,16.28,16.83,17.2,17.32,17.5,18.49];
   const selectors='.focus-rig,.depth-rig,.float-rig,.phone-object,#coach-label,#client-label,#hero-line-1,#hero-line-2,#hero-subtitle,#client-finish-button,#coach-update-button,#coach-snackbar,#days-card *,#floating-days-card *,#exercise-card *,#floating-exercise-card *,.client-set-row,.client-record-row,.client-record-row *';
   const snap=()=>[...document.querySelectorAll(selectors)].map((n,i)=>({id:n.id||n.className+':'+i,style:n.style.cssText}));
   tl.totalTime(18.499,false);
   for(const t of times){tl.totalTime(t,false);samples[t]={nodes:snap(),phones:Object.fromEntries(['coach','client'].map(role=>{const p=window.__fitnodePhoneYaw[role];return[role,{angle:p.pose.angle,transform:p.rig.style.transform,quad:p.projectedQuad()}];})),rowRects:[...document.querySelectorAll('#floating-client-series-card .client-set-row,#floating-client-series-card .client-record-row')].map(n=>{const b=n.getBoundingClientRect();return[b.x,b.y,b.width,b.height];})};}
   const reverseErrors=[];for(const t of [...times].reverse()){tl.totalTime(t,false);if(JSON.stringify(snap())!==JSON.stringify(samples[t].nodes))reverseErrors.push(t);}
   return{duration:Number(document.querySelector('#root').dataset.duration),samples,reverseErrors};
  };
  await enter(true);const before=await page.evaluate(capture);await enter(false);const after=await page.evaluate(capture),preservationErrors=[];
  if(before.duration!==after.duration)preservationErrors.push('duration');
  for(const[t,state]of Object.entries(before.samples)){
   const now=after.samples[t];
   if(JSON.stringify(state.nodes)!==JSON.stringify(now.nodes)||JSON.stringify(state.phones)!==JSON.stringify(now.phones))preservationErrors.push('protected animation:'+t);
   if(Number(t)>=10.55&&Number(t)<=13.15&&state.rowRects.some((r,i)=>r.some((v,j)=>Math.abs(v-now.rowRects[i][j])>.04)))preservationErrors.push('series row world geometry:'+t);
  }
  const originals=JSON.parse(fs.readFileSync('iphone-refinement-proof/original-hashes.json','utf8'));
  for(const[f,h]of Object.entries(originals))if(crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')!==h)preservationErrors.push('original:'+f);
  const protected3D=JSON.parse(fs.readFileSync(out+'/protected-3d-before.json','utf8'));
  for(const item of protected3D)if(crypto.createHash('sha256').update(fs.readFileSync(item.Path)).digest('hex').toUpperCase()!==item.Hash)preservationErrors.push('3D source:'+item.Path);
  const validation=await page.evaluate(()=>{
   const tl=window.__timelines.main,meta=window.__fitnodePolishTiming,failures=[];
   const seek=t=>{tl.totalTime(t,false);},opacity=s=>Number(gsap.getProperty(s,'opacity'));
   const meso=[];for(const t of [3.08,3.17,3.20,meta.mesocycle.closeAt,3.326,3.586]){seek(t);meso.push({t,opacity:opacity('#floating-mesocycle-menu'),field:opacity('#floating-mesocycle-card .mesocycle-initial-value'),check:opacity('#floating-mesocycle-menu .mesocycle-selection-check')});}
   if(Math.abs(meta.mesocycle.pause/(3.17-3.08)-1.4)>1e-8)failures.push('mesocycle pause');
   seek(meta.notification.at);const progress=(Number(gsap.getProperty('#client-focus','x'))-50)/(-95-50);
   if(Math.abs(progress-.33)>1e-5)failures.push('notification progress');
   seek(meta.notification.at-.001);if(opacity('#fitnode-notification')!==0)failures.push('early notification');
   seek(meta.notification.at+.05);if(opacity('#fitnode-notification')<=0)failures.push('missing notification');
   const closing=[];for(let f=0;f<555;f++){const t=f/30;seek(t);const title=opacity('#closing-title'),subtitle=opacity('#closing-subtitle');if(t<=meta.closing.phonesGoneAt&&(title!==0||subtitle!==0))failures.push('early closing:'+t);if(t>=17.15&&t<=17.65)closing.push({t,title,subtitle,phones:['#phone-coach-object','#phone-client-object','#coach-label','#client-label'].map(opacity)});}
   if(Math.abs((meta.celebration.end-meta.celebration.start)/(15.53-14.20)-1.25)>1e-8)failures.push('celebration speed');
   const update=[];for(const t of [7.8,7.875,7.919,7.92,7.95,8.055]){seek(t);const poses=['#coach-update-button','#coach-update-button-disabled'].map(s=>({scale:Number(gsap.getProperty(s,'scaleX')),y:Number(gsap.getProperty(s,'y')),opacity:opacity(s)}));if(Math.abs(poses[0].scale-poses[1].scale)>1e-6||Math.abs(poses[0].y-poses[1].y)>1e-6)failures.push('update swap geometry:'+t);update.push({t,poses,snackbar:opacity('#coach-snackbar')});}
   seek(10.54);const card=document.querySelector('#client-series-card'),surface=card.querySelector('.ui-card-surface');
   const series={box:[card.offsetLeft,card.offsetTop,card.offsetWidth,card.offsetHeight],surface:surface.getAttribute('src'),origin:getComputedStyle(document.querySelector('#floating-client-series-card')).transformOrigin};
   seek(18.49);if(opacity('#closing-title')!==1||opacity('#closing-subtitle')!==1||Number(gsap.getProperty('#closing-title','y'))!==0)failures.push('final closing pose');
   return{meta,failures,meso,progress,closing,update,series};
  });
  for(const t of [3.20,7.95,8.68,10.54,10.9,12.4,13.15,14.5,15.7,15.95,17.2,17.4,18.49]){
   await page.evaluate(t=>{window.__timelines.main.totalTime(t,false);for(const el of document.querySelectorAll('[data-start][data-duration]'))el.style.visibility=t>=Number(el.dataset.start)&&t<Number(el.dataset.start)+Number(el.dataset.duration)?'visible':'hidden';},t);
   await page.screenshot({path:out+'/frame-'+String(t).replace('.','_')+'.png'});
  }
  const panels=await Promise.all([3.20,8.68,10.9,12.4,14.5,15.7,17.2,18.49].map(t=>sharp(out+'/frame-'+String(t).replace('.','_')+'.png').resize(270,480).png().toBuffer()));
  await sharp({create:{width:2160,height:480,channels:3,background:'#061a2c'}}).composite(panels.map((input,i)=>({input,left:i*270,top:0}))).png().toFile(out+'/contact-sheet.png');
  const density=JSON.parse(fs.readFileSync('assets/ui/client-completion/density-80/provenance.json','utf8'));
  for(const[f,h]of Object.entries(density.sourceHashes))if(crypto.createHash('sha256').update(fs.readFileSync('assets/ui/client-completion/'+f)).digest('hex')!==h)preservationErrors.push('native atlas:'+f);
  if(Math.abs(density.groupReduction-.20)>.001||density.removedTracks!==548||density.remainingGroups!==2191)preservationErrors.push('particle count');
  const report={runtimeErrors:errors,preservationErrors,reverseErrors:after.reverseErrors,originalHashesVerified:Object.keys(originals).length,duration:after.duration,validation,density:{before:density.totalTracks,after:density.remainingGroups,reduction:density.groupReduction,observationsReduction:density.quantityReduction,physicalIdsAvailable:false}};fs.writeFileSync(out+'/verification.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify({runtimeErrors:errors,preservationErrors,reverseErrors:after.reverseErrors,duration:after.duration,originalHashesVerified:Object.keys(originals).length,failures:validation.failures,timing:validation.meta}));if(errors.length||preservationErrors.length||after.reverseErrors.length||validation.failures.length)process.exitCode=1;
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
