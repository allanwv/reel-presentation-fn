const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/110f701c48e68d66/node_modules/hyperframes/package.json'),sharp=req('sharp');
const root=process.cwd(),out='iphone-refinement-proof';
(async()=>{
 const server=http.createServer((q,r)=>{
  const url=decodeURIComponent(q.url.split('?')[0]);let f=path.resolve(root,'.'+url);
  if(url==='/before.html')f=path.join(root,out,'before-index.html.txt');
  if(q.headers['x-baseline']==='1'&&/\/phone-3d\.(js|css)$/.test(url))f=path.join(root,out,'before-'+path.basename(url)+'.txt');
  if(!f.startsWith(root+path.sep)||!fs.existsSync(f)){r.writeHead(404).end();return;}
  const ext=url==='/before.html'?'.html':path.extname(url);r.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'})[ext]||'application/octet-stream'});fs.createReadStream(f).pipe(r);
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await req('puppeteer-core').launch({executablePath:'C:/Users/aweis/.cache/puppeteer/chrome-headless-shell/win64-152.0.7977.75/chrome-headless-shell-win64/chrome-headless-shell.exe',headless:true});
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width:1080,height:1920});await page.evaluateOnNewDocument('window.__timelines={};');
  async function enter(before){await page.setExtraHTTPHeaders({'x-baseline':before?'1':'0'});await page.goto('http://127.0.0.1:'+server.address().port+(before?'/before.html':'/index.html'));await page.waitForFunction('Boolean(window.__timelines?.main)');await page.evaluate('Promise.all([...document.images].map(n=>n.decode()))');}
  const capture=()=>{
   const tl=window.__timelines.main,times=[.01,.5,1.6,1.9,2.2,2.4,2.8,3.04,3.15,3.55,3.6,4.35,5.2,6.4,7.8,7.92,8.35,8.61,9,9.6,10.55,11.22,12.4,13.32,14.5,15.6,16.28,16.83,17.8,18.49],samples={};
   const selectors='#logo-art,#hero-line-1,#hero-line-2,#hero-subtitle,#coming-soon,#closing-title,#closing-subtitle,#coach-update-button,#coach-update-button-disabled,#coach-snackbar,#fitnode-notification,#client-finish-button,#client-workout-loading-overlay,#client-completion,#client-celebration,#phone-shadow-track img,.focus-rig,.depth-rig,.float-rig,.phone-object,.ui-card,.ui-card *,.floating-card,.floating-card *';
   function snap(){return [...document.querySelectorAll(selectors)].filter(n=>{const m=n.closest('#mesocycle-card,#floating-mesocycle-card');return !m||m===n;}).map((n,i)=>({id:n.id||n.getAttribute('src')||n.tagName+':'+i,style:n.style.cssText}));}
   tl.totalTime(18.499,false);
   for(const t of times){tl.totalTime(t,false);samples[t]={nodes:snap(),phones:Object.fromEntries(['coach','client'].map(role=>{const p=window.__fitnodePhoneYaw[role];return[role,{angle:p.pose.angle,transform:p.rig.style.transform,quad:p.projectedQuad()}];}))};}
   const reverseErrors=[];for(const t of [...times].reverse()){tl.totalTime(t,false);if(JSON.stringify(snap())!==JSON.stringify(samples[t].nodes))reverseErrors.push(t);}
   return{duration:Number(document.querySelector('#root').dataset.duration),samples,reverseErrors};
  };
  await enter(true);const before=await page.evaluate(capture);await enter(false);const after=await page.evaluate(capture),preservationErrors=[];
  if(before.duration!==after.duration)preservationErrors.push('duration');
  for(const[t,state]of Object.entries(before.samples))if(JSON.stringify(state)!==JSON.stringify(after.samples[t]))preservationErrors.push('protected state:'+t);
  const originals=JSON.parse(fs.readFileSync(out+'/original-hashes.json','utf8'));for(const[f,h]of Object.entries(originals))if(crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')!==h)preservationErrors.push('original:'+f);
  const selection=await page.evaluate(()=>{
   const tl=window.__timelines.main,menu=document.querySelector('#floating-mesocycle-menu'),results={};
   for(const t of [2.8,3.025,3.06,3.12,3.16,3.55,3.6]){tl.totalTime(t,false);results[t]={open:Number(gsap.getProperty(menu,'opacity')),highlightY:Number(gsap.getProperty(menu.querySelector('.mesocycle-highlight'),'y')),checks:menu.querySelectorAll('.mesocycle-selection-check').length,checkY:Number(gsap.getProperty(menu.querySelector('.mesocycle-selection-check'),'y')),checkOpacity:Number(gsap.getProperty(menu.querySelector('.mesocycle-selection-check'),'opacity')),independentColor:getComputedStyle(menu.querySelector('.mesocycle-option-independent')).backgroundColor,mesoColor:getComputedStyle(menu.querySelector('.mesocycle-option-meso')).backgroundColor,fieldOpacity:Number(gsap.getProperty('#floating-mesocycle-card .mesocycle-initial-value','opacity')),dockFieldOpacity:Number(gsap.getProperty('#mesocycle-card .mesocycle-initial-value','opacity'))};}
   const models=Object.fromEntries(['coach','client'].map(role=>{const p=window.__fitnodePhoneYaw[role],screen=document.getElementById('screen-'+role),island=screen.querySelector('.real-phone-island');return[role,{calibration:p.calibration,islands:screen.querySelectorAll('.real-phone-island').length,faces:p.rig.querySelectorAll('.real-phone-edge').length,screen:[screen.offsetWidth,screen.offsetHeight],island:[island.offsetLeft,island.offsetTop,island.offsetWidth,island.offsetHeight],preserve:getComputedStyle(p.rig).transformStyle}];}));
   return{results,models};
  });
  if(selection.results['2.8'].highlightY!==0||selection.results['2.8'].fieldOpacity!==1||selection.results['2.8'].checkY>=0)preservationErrors.push('initial selection');
  if(selection.results['3.16'].fieldOpacity!==0||selection.results['3.16'].checkY!==0||selection.results['3.16'].checkOpacity!==1||selection.results['3.6'].dockFieldOpacity!==0)preservationErrors.push('final selection');
  for(const t of [1.6,2.2,2.8,3.04,3.15,3.56,4.35,6.4,8.675,9.6,12.4,14.5,16,18.49]){
   await page.evaluate(t=>{window.__timelines.main.totalTime(t,false);for(const el of document.querySelectorAll('[data-start][data-duration]'))el.style.visibility=t>=Number(el.dataset.start)&&t<Number(el.dataset.start)+Number(el.dataset.duration)?'visible':'hidden';},t);
   await page.screenshot({path:out+'/frame-'+String(t).replace('.','_')+'.png'});
   if([2.8,3.04,3.15].includes(t))await (await page.$('#floating-mesocycle-menu')).screenshot({path:out+'/selector-'+String(t).replace('.','_')+'.png'});
  }
  const menuPanels=await Promise.all([2.8,3.04,3.15].map(t=>sharp(out+'/selector-'+String(t).replace('.','_')+'.png').resize(460,360,{fit:'contain',background:'#061a2c'}).png().toBuffer()));
  await sharp({create:{width:1380,height:360,channels:3,background:'#061a2c'}}).composite(menuPanels.map((input,i)=>({input,left:i*460,top:0}))).png().toFile(out+'/selector-comparison.png');
  const report={runtimeErrors:errors,preservationErrors,reverseErrors:after.reverseErrors,originalHashesVerified:Object.keys(originals).length,duration:after.duration,selection};fs.writeFileSync(out+'/verification.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify({runtimeErrors:errors,preservationErrors,reverseErrors:after.reverseErrors,duration:after.duration,originalHashesVerified:Object.keys(originals).length}));if(errors.length||preservationErrors.length||after.reverseErrors.length)process.exitCode=1;
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
