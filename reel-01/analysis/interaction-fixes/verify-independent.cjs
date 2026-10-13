// Independent read-only audit. Only this folder receives QA artifacts.
const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/110f701c48e68d66/node_modules/hyperframes/package.json');
const sharp=req('sharp'),root=process.cwd(),out='analysis/interaction-fixes';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const times=[.001,.17,.32,.5,.8,1.2,1.6,1.85,2.1,2.2,2.4,2.66,2.8,3,3.08,3.16,3.205,3.206,3.3,3.405,3.406,3.45,3.526,3.546,3.6,3.65,3.75,3.786,3.95,3.96,4.025,4.175,4.28,4.345,4.495,4.60,4.665,4.815,5.2,5.3,5.5,5.62,5.68,5.78,5.98,6.04,6.08,6.16,6.22,6.34,6.44,6.70,6.80,6.95,7.6,7.8,7.875,7.919,7.92,7.95,8.055,8.35,8.61,8.675,9,9.6,10.25,10.53,10.55,10.85,11.22,11.65,12.4,13.15,13.17,13.32,13.97,14.2,14.5,15.6,15.8625,16.28,16.6,16.83,17.2,17.3133333333,17.3483333333,17.95,18.20,18.55,19,20.999];
const allowed='#closing-copy,#mesocycle-card,#floating-mesocycle-card,#days-card,#floating-days-card,#exercise-card,#floating-exercise-card';
function captureProtected(){
 const tl=window.__timelines.main,scope=document.querySelector('#reference-space');
 const all=[document.querySelector('#root'),...scope.querySelectorAll('*')];
 const nodes=all.filter(n=>!n.closest(window.__qaAllowed));
 const key=n=>{if(n.id)return '#'+n.id;if(n.dataset.day)return key(n.closest('.ui-card,.floating-card'))+'[data-day='+n.dataset.day+']';const p=n.parentElement;return(p?key(p):'')+'/'+n.tagName.toLowerCase()+':'+(p?[...p.children].indexOf(n):0);};
 const dom=nodes.map(n=>({key:key(n),tag:n.tagName,src:n.getAttribute('src'),text:n.children.length?null:n.textContent,attributes:[...n.attributes].filter(a=>a.name!=='style').map(a=>[a.name,a.value])}));
 const normalize=(n,style)=>{if(!n.matches('.captured-atlas')||Number(getComputedStyle(n).opacity)!==0)return style;const d=document.createElement('div');d.style.cssText=style;d.style.removeProperty('transform');return d.style.cssText;};
 const preservedCardNodes=[...document.querySelectorAll('#days-card,#floating-days-card,#exercise-card,#floating-exercise-card,#floating-days-card > .floating-face,#floating-exercise-card > .floating-face,#days-card .ui-days-background,#floating-days-card .ui-days-background,#days-card .ui-day,#floating-days-card .ui-day')];
 const editedNodes=[...document.querySelectorAll(window.__qaAllowed)].flatMap(n=>[n,...n.querySelectorAll('*')]);
 const state=()=>({nodes:nodes.map(n=>({key:key(n),style:normalize(n,n.style.cssText)})),cardMotion:preservedCardNodes.map(n=>({key:key(n),style:n.style.cssText})),phones:Object.fromEntries(['coach','client'].map(role=>{const p=window.__fitnodePhoneYaw[role];return[role,{angle:p.pose.angle,transform:p.rig.style.transform,overlay:p.overlay.style.transform,quad:p.projectedQuad()}];}))});
 const visualEdited=()=>editedNodes.map(n=>({key:key(n),style:normalize(n,n.style.cssText),opacity:getComputedStyle(n).opacity}));
 const vars=v=>Object.fromEntries(Object.entries(v).filter(([k])=>!['onUpdate','onStart','onComplete','callbackScope','parent','targets'].includes(k)).map(([k,x])=>[k,typeof x==='function'?String(x):typeof x==='object'&&x!==null?String(x):x]));
 const tweens=tl.getChildren(true,true,false).map(t=>({start:t.startTime(),duration:t.duration(),targets:t.targets().map(n=>n.nodeType?nodes.includes(n)?key(n):null:Object.entries(window.__fitnodePhoneYaw).find(([,p])=>p.pose===n)?.[0]+':pose'||'object:'+Object.keys(n).filter(k=>k!=='_gsap').sort().join(',')),vars:vars(t.vars)})).filter(t=>t.targets.some(Boolean));
 tl.totalTime(Number(document.querySelector('#root').dataset.duration)-.001,false);
 const samples={},edited={};for(const t of window.__qaTimes){tl.totalTime(t,false);samples[t]=state();edited[t]=visualEdited();}
 const reverseErrors=[],editedReverseErrors=[];for(const t of [...window.__qaTimes].reverse()){tl.totalTime(t,false);if(JSON.stringify(state())!==JSON.stringify(samples[t]))reverseErrors.push(t);if(JSON.stringify(visualEdited())!==JSON.stringify(edited[t]))editedReverseErrors.push(t);}
 return{duration:Number(document.querySelector('#root').dataset.duration),dom,tweens,samples,reverseErrors,editedReverseErrors};
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const baselineFiles={'/before.html':'index-before.html.txt','/assets/ui/floating/floating-cards.js':'floating-cards-before.js.txt','/assets/ui/floating/day-taps.js':'day-taps-before.js.txt'};
 const server=http.createServer((q,r)=>{
  const url=decodeURIComponent(q.url.split('?')[0]);let f=url==='/before.html'?path.join(root,out,baselineFiles[url]):path.resolve(root,'.'+url);
  if(q.headers['x-baseline']==='1'&&baselineFiles[url])f=path.join(root,out,baselineFiles[url]);
  if(!f.startsWith(root+path.sep)||!fs.existsSync(f)){r.writeHead(404).end();return;}
  const ext=url==='/before.html'?'.html':path.extname(url);
  r.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'})[ext]||'application/octet-stream'});fs.createReadStream(f).pipe(r);
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await req('puppeteer-core').launch({executablePath:'C:/Users/aweis/.cache/puppeteer/chrome-headless-shell/win64-152.0.7977.75/chrome-headless-shell-win64/chrome-headless-shell.exe',headless:true});
  const page=await browser.newPage(),runtimeErrors=[];page.on('pageerror',e=>runtimeErrors.push(e.message));await page.setViewport({width:1080,height:1920});await page.evaluateOnNewDocument('window.__timelines={};');
  async function enter(before){await page.setExtraHTTPHeaders({'x-baseline':before?'1':'0'});await page.goto('http://127.0.0.1:'+server.address().port+(before?'/before.html':'/index.html'));await page.waitForFunction('Boolean(window.__timelines?.main)',{timeout:30000});await page.evaluate((t,a)=>{window.__qaTimes=t;window.__qaAllowed=a;},times,allowed);const broken=await page.evaluate(async()=>{await document.fonts.ready;await Promise.allSettled([...document.images].map(n=>n.decode()));return [...document.images].filter(n=>!n.naturalWidth).map(n=>n.getAttribute('src'));});if(broken.length)throw Error('Broken images:'+broken.join(','));}
  await enter(true);const before=await page.evaluate(captureProtected);await enter(false);const after=await page.evaluate(captureProtected),preservationErrors=[];
  if(before.duration!==after.duration)preservationErrors.push('Total duration changed');
  if(JSON.stringify(before.dom)!==JSON.stringify(after.dom))preservationErrors.push('Protected DOM content/attributes changed');
  if(JSON.stringify(before.tweens)!==JSON.stringify(after.tweens))preservationErrors.push('Protected GSAP definitions changed');
  for(const t of times){const a=before.samples[t],b=after.samples[t];if(JSON.stringify(a.nodes)!==JSON.stringify(b.nodes))preservationErrors.push({time:t,type:'Protected styles',nodes:a.nodes.filter((n,i)=>JSON.stringify(n)!==JSON.stringify(b.nodes[i])).map(n=>n.key)});if(JSON.stringify(a.phones)!==JSON.stringify(b.phones))preservationErrors.push({time:t,type:'Physical phone pose'});if(JSON.stringify(a.cardMotion)!==JSON.stringify(b.cardMotion))preservationErrors.push({time:t,type:'Days/exercise motion, shadows or tap transforms',nodes:a.cardMotion.filter((n,i)=>JSON.stringify(n)!==JSON.stringify(b.cardMotion[i])).map(n=>n.key)});}
  const originalHashes=JSON.parse(fs.readFileSync('iphone-refinement-proof/original-hashes.json','utf8'));
  const originalFailures=Object.entries(originalHashes).filter(([p,h])=>sha(p)!==h).map(([p])=>p);
  const protected3D=JSON.parse(fs.readFileSync(out+'/protected-3d-before.json','utf8'));
  const modelFailures=protected3D.filter(n=>sha(n.Path).toUpperCase()!==n.Hash).map(n=>n.Path);
  const badgeHashes=JSON.parse(fs.readFileSync('analysis/beta-closing/badge-hashes.json','utf8'));
  const badgeFailures=Object.entries(badgeHashes).filter(([p,h])=>sha(p)!==h).map(([p])=>p);
  const corrections=await page.evaluate(()=>{
   const tl=window.__timelines.main,failures=[],op=n=>Number(getComputedStyle(typeof n==='string'?document.querySelector(n):n).opacity),seek=t=>{tl.totalTime(t,false);};
   const menu=document.querySelector('#floating-mesocycle-menu'),mesoCard=document.querySelector('#floating-mesocycle-card');
   const mesocycle=[];for(const t of [2.659,2.66,2.8,3,3.08,3.16,3.205,3.206,3.3,3.405999,3.406,3.466,3.526,3.546,3.6,3.786]){seek(t);const state={t,menu:op(menu),check:op(menu.querySelector('.mesocycle-selection-check')),initial:op(mesoCard.querySelector('.mesocycle-initial-value')),highlight:getComputedStyle(menu.querySelector('.mesocycle-highlight')).backgroundColor,scale:Number(gsap.getProperty(mesoCard,'scaleX')),floating:op(mesoCard),dock:op('#mesocycle-card')};mesocycle.push(state);if(t>=3.206&&t<=3.406&&(state.menu!==1||state.check!==1||state.initial!==0))failures.push('Selected mesocycle not continuously held:'+t);}
   const meta=window.__fitnodePolishTiming?.mesocycle;
   if(!meta||Math.abs(meta.closeAt-3.406)>1e-8||Math.abs(meta.selectedAt-3.08)>1e-8||Math.abs(meta.end-3.786)>1e-8)failures.push('Exact +.200 mesocycle hold/opening/tap timing');
   const daySamples=[];for(const t of [0,.001,.17,.5,1.6,2.1,3.3,3.599,3.6,3.95,3.96,4.024,4.026,4.176,4.279,4.28,4.344,4.346,4.496,4.599,4.6,4.664,4.666,4.816,5.2,7.6,8.35,10]){seek(t);for(const id of ['days-card','floating-days-card']){const card=document.getElementById(id);const selected=Object.fromEntries([...card.querySelectorAll('.ui-day-selected')].map(n=>[n.parentElement.dataset.day,{opacity:op(n),clip:getComputedStyle(n).clipPath}]));daySamples.push({t,id,selected,background:op(card.querySelector('.ui-days-background')),initialExists:!!card.querySelector('.ui-days-initial')});for(const[name,v]of Object.entries(selected)){const tap={l:3.96,x:4.28,v:4.60}[name];if((tap===undefined||t<tap)&&v.opacity!==0)failures.push('Day selected before its tap:'+id+':'+name+':'+t);if(t>=4.816&&['l','x','v'].includes(name)&&v.opacity!==1)failures.push('Final day state missing:'+id+':'+name+':'+t);}if(op(card.querySelector('.ui-days-background'))!==1)failures.push('Day background flicker:'+id+':'+t);}}
   const fieldSamples=[];for(const t of [5.2,5.3,5.5,5.619,5.62,5.67,5.72,5.78,5.979,5.98,6.02,6.04,6.08,6.12,6.16,6.22,6.339,6.34,6.39,6.44,6.699,6.70,6.75,6.80,6.95,7.6,9]){seek(t);for(const id of ['exercise-card','floating-exercise-card']){const card=document.getElementById(id);fieldSamples.push({t,id,fields:[...card.querySelectorAll('.ui-field')].map(n=>({name:n.dataset.field,scale:Number(gsap.getProperty(n,'scaleX')),y:Number(gsap.getProperty(n,'y')),layers:[...n.children].map(c=>({tag:c.tagName,id:c.id,classes:c.className,src:c.getAttribute('src'),text:c.textContent,opacity:op(c),clip:getComputedStyle(c).clipPath,mask:getComputedStyle(c).maskImage,transform:getComputedStyle(c).transform,visibleValue:c.dataset.value||c.dataset.glyph||null}))}))});}}
   const fieldOpacityTweens=tl.getChildren(true,true,false).filter(t=>t.duration()>0&&'opacity'in t.vars&&t.targets().some(n=>n.nodeType&&n.closest?.('.ui-field')&&n.classList?.contains('ui-field-value'))).map(t=>({start:t.startTime(),duration:t.duration(),opacity:t.vars.opacity,targets:t.targets().map(n=>n.id||n.className)}));
   if(fieldOpacityTweens.length)failures.push('Input glyphs still use a fade instead of discrete typing');
   const typingChecks=[];
   for(const id of ['exercise-card','floating-exercise-card'])for(const[name,at,typedAt]of [['series',5.62,5.73],['reps',5.98,6.22],['rir',6.34,6.45],['rest',6.70,6.81]]){
    const field=document.querySelector('#'+id+' [data-field="'+name+'"]'),value=field.querySelector('.ui-field-value'),initial=field.querySelector('.ui-field-initial'),prefix=field.querySelector('.ui-field-typed-prefix');
    const sample=t=>{seek(t);return{t,value:op(value),initial:op(initial),prefix:prefix?op(prefix):null,scale:Number(gsap.getProperty(field,'scaleX'))};};
    const empty=sample(5.5),focused=sample(at+.06),beforeType=sample(typedAt-.001),typed=sample(typedAt+.001),settled=sample(7.6);
    if(empty.value!==0||empty.initial!==0||empty.prefix!==null&&empty.prefix!==0)failures.push('Input is not empty before typing:'+id+':'+name);
    if(focused.scale<=1||focused.value!==0)failures.push('Missing brief focus before typing:'+id+':'+name);
    if(beforeType.value!==0||typed.value!==1||settled.value!==1||settled.initial!==0)failures.push('Input keystroke is not discrete/persistent:'+id+':'+name);
    let one=null;if(name==='reps'){one=sample(6.14);if(!prefix||one.prefix!==1||one.value!==0||typed.prefix!==0)failures.push('Reps does not visibly type1 then12:'+id);}
    typingChecks.push({id,name,at,typedAt,empty,focused,beforeType,typed,settled,one});
   }
   const rootDuration=Number(document.querySelector('#root').dataset.duration);seek(19);const closing=document.querySelector('#closing-copy'),badges=[...closing.querySelectorAll('img')].filter(n=>/app.store|google.play|badge/i.test(n.getAttribute('src')||''));const closingState={text:closing.textContent.replace(/\s+/g,' ').trim(),badges:badges.map(n=>{const b=n.getBoundingClientRect(),s=getComputedStyle(n);return{src:n.getAttribute('src'),opacity:op(n),display:s.display,visibility:s.visibility,natural:[n.naturalWidth,n.naturalHeight],box:[b.x,b.y,b.width,b.height],objectFit:s.objectFit};}),meta:window.__fitnodeBetaClosing,duration:rootDuration};
   if(badges.length!==2||closingState.badges.some(b=>b.opacity!==1||b.display==='none'||b.box[2]===0||b.box[3]===0))failures.push('Two official badge assets are not visibly present in closing');
   for(const expected of ['Reg\u00edstrate en la beta','y obt\u00e9n 3 meses gratis*','*Aplica para planes Lite y Plus. No requiere registro de tarjeta.'])if(!closingState.text.includes(expected))failures.push('Exact beta text missing:'+expected);
   return{failures,mesocycleMeta:meta,mesocycle,daySamples,fieldSamples,fieldOpacityTweens,typingChecks,closing:closingState};
  });
  const copiedBadgeHashes=corrections.closing.badges.map(b=>({src:b.src,hash:sha(b.src)}));
  const expectedBadgeHashes=Object.values(badgeHashes).sort();
  if(JSON.stringify(copiedBadgeHashes.map(b=>b.hash).sort())!==JSON.stringify(expectedBadgeHashes))corrections.failures.push('Closing badge copies are not byte-identical to both originals');
  const screenTimes=[1.2,3.3,3.5,3.65,3.95,4.2,4.5,4.9,5.5,5.75,6.07,6.22,6.5,6.88,7.6,19];
  for(const t of screenTimes){await page.evaluate(t=>{window.__timelines.main.totalTime(t,false);for(const el of document.querySelectorAll('[data-start][data-duration]'))el.style.visibility=el.dataset.hidden!=='true'&&t>=Number(el.dataset.start)&&t<Number(el.dataset.start)+Number(el.dataset.duration)?'visible':'hidden';},t);await page.screenshot({path:out+'/independent-'+String(t).replace('.','_')+'.png'});}
  const panels=await Promise.all(screenTimes.map(t=>sharp(out+'/independent-'+String(t).replace('.','_')+'.png').resize(270,480).png().toBuffer()));
  await sharp({create:{width:2160,height:960,channels:3,background:'#061a2c'}}).composite(panels.map((input,i)=>({input,left:(i%8)*270,top:Math.floor(i/8)*480}))).png().toFile(out+'/independent-contact-sheet.png');
  const report={runtimeErrors,preservationErrors,protectedDomEqual:JSON.stringify(before.dom)===JSON.stringify(after.dom),protectedTweenDefinitionsEqual:JSON.stringify(before.tweens)===JSON.stringify(after.tweens),protectedNodes:after.dom.length,protectedTweens:after.tweens.length,protectedSampleTimes:times,duration:after.duration,reverseErrors:after.reverseErrors,editedReverseErrors:after.editedReverseErrors,baselineReverseErrors:before.reverseErrors,originalHashesVerified:Object.keys(originalHashes).length,originalFailures,modelFailures,badgeFailures,copiedBadgeHashes,corrections,screenshots:screenTimes.map(t=>'independent-'+String(t).replace('.','_')+'.png')};
  fs.writeFileSync(out+'/independent-verification.json',JSON.stringify(report,null,2));fs.writeFileSync(out+'/independent-protected-tweens.json',JSON.stringify({before:before.tweens,after:after.tweens},null,2));
  console.log(JSON.stringify({runtimeErrors,preservationErrors,reverseErrors:after.reverseErrors,editedReverseErrors:after.editedReverseErrors,originalFailures,modelFailures,badgeFailures,correctionFailures:corrections.failures,mesocycle:corrections.mesocycleMeta,duration:after.duration}));
  if(runtimeErrors.length||preservationErrors.length||after.reverseErrors.length||after.editedReverseErrors.length||originalFailures.length||modelFailures.length||badgeFailures.length||corrections.failures.length)process.exitCode=1;
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
