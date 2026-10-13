const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/110f701c48e68d66/node_modules/hyperframes/package.json');
const sharp=req('sharp'),root=process.cwd(),out='analysis/beta-closing';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const originalHashes=JSON.parse(fs.readFileSync('iphone-refinement-proof/original-hashes.json','utf8'));
const badgePaths=['../assets/download-on-the-app-store-flat-badge-seeklogo.png','../assets/get-it-on-google-play-badge-seeklogo.png'];
const badgeHashes=Object.fromEntries(badgePaths.map(p=>[p,sha(p)]));
const times=[.01,.17,.32,.5,.8,1.6,1.85,1.9,2.1,2.2,2.4,2.66,2.8,3.08,3.20,3.326,3.586,3.6,3.96,4.28,4.6,5.2,5.5,5.79,6.15,6.51,6.87,7.6,7.8,7.92,7.95,8.055,8.35,8.61,8.675,9,9.6,10.55,10.85,11.22,11.65,12.4,13.15,13.32,13.97,14.2,14.5,15.6,15.8625,16.28,16.6,16.83,17.2,17.3133333333,17.3483333333,17.5,17.95,18.08,18.20,18.49];
function captureProtected(){
 const tl=window.__timelines.main;
 const nodes=[document.querySelector('#root'),...[...document.querySelector('#reference-space').querySelectorAll('*')].filter(n=>!n.closest('#closing-copy'))];
 const key=(n,i)=>n.id||n.tagName+'.'+n.className+':'+i;
 const dom=nodes.map((n,i)=>({key:key(n,i),tag:n.tagName,src:n.getAttribute('src'),text:n.children.length?null:n.textContent,attributes:[...n.attributes].filter(a=>!['style','data-duration'].includes(a.name)).map(a=>[a.name,a.value])}));
 const state=()=>({nodes:nodes.map((n,i)=>({key:key(n,i),style:n.style.cssText,hiddenAtlas:n.matches('.captured-atlas')&&Number(getComputedStyle(n).opacity)===0})),phones:Object.fromEntries(['coach','client'].map(role=>{const p=window.__fitnodePhoneYaw[role];return[role,{angle:p.pose.angle,transform:p.rig.style.transform,overlay:p.overlay.style.transform,quad:p.projectedQuad()}];}))});
 // Atlas cache transforms are allowed to persist only while the atlas is fully
 // transparent. Preserve the raw state for exact baseline comparison, and omit
 // just this invisible transform for the inverse-seek visual-state comparison.
 const visual=s=>({...s,nodes:s.nodes.map(n=>{if(!n.hiddenAtlas)return n;const d=document.createElement('div');d.style.cssText=n.style;d.style.removeProperty('transform');return{...n,style:d.style.cssText};})});
 const vars=v=>Object.fromEntries(Object.entries(v).filter(([k])=>!['onUpdate','onStart','onComplete','callbackScope','parent','targets'].includes(k)).map(([k,x])=>[k,typeof x==='function'?String(x):typeof x==='object'&&x!==null?String(x):x]));
 const tweens=tl.getChildren(true,true,false).map(t=>({start:t.startTime(),duration:t.duration(),targets:t.targets().map(n=>n.nodeType?nodes.includes(n)?key(n,nodes.indexOf(n)):null:Object.entries(window.__fitnodePhoneYaw).find(([,p])=>p.pose===n)?.[0]+':pose'||'object:'+Object.keys(n).filter(k=>k!=='_gsap').sort().join(',')),vars:vars(t.vars)})).filter(t=>t.targets.some(Boolean));
 tl.totalTime(Number(document.querySelector('#root').dataset.duration)-.001,false);
 const samples={};for(const t of window.__qaTimes){tl.totalTime(t,false);samples[t]=state();}
 const reverseErrors=[],rawHiddenAtlasDifferences=[];for(const t of [...window.__qaTimes].reverse()){tl.totalTime(t,false);const now=state();if(JSON.stringify(visual(now))!==JSON.stringify(visual(samples[t])))reverseErrors.push(t);if(JSON.stringify(now)!==JSON.stringify(samples[t]))rawHiddenAtlasDifferences.push({time:t,nodes:now.nodes.filter((n,i)=>JSON.stringify(n)!==JSON.stringify(samples[t].nodes[i])).map(n=>({now:n,before:samples[t].nodes.find(p=>p.key===n.key)})),phoneChanges:JSON.stringify(now.phones)!==JSON.stringify(samples[t].phones)});}
 return{dom,tweens,samples,reverseErrors,rawHiddenAtlasDifferences};
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/badge-hashes.json',JSON.stringify(badgeHashes,null,2));
 const server=http.createServer((q,r)=>{
  const url=decodeURIComponent(q.url.split('?')[0]),f=url==='/before.html'?path.join(root,out,'index-before.html.txt'):path.resolve(root,'.'+url);
  if(!f.startsWith(root+path.sep)||!fs.existsSync(f)){r.writeHead(404).end();return;}
  const ext=url==='/before.html'?'.html':path.extname(f);r.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'})[ext]||'application/octet-stream'});fs.createReadStream(f).pipe(r);
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await req('puppeteer-core').launch({executablePath:'C:/Users/aweis/.cache/puppeteer/chrome-headless-shell/win64-152.0.7977.75/chrome-headless-shell-win64/chrome-headless-shell.exe',headless:true});
  const page=await browser.newPage(),runtimeErrors=[];page.on('pageerror',e=>runtimeErrors.push(e.message));await page.setViewport({width:1080,height:1920});await page.evaluateOnNewDocument('window.__timelines={};');
  async function enter(before){await page.goto('http://127.0.0.1:'+server.address().port+(before?'/before.html':'/index.html'));await page.waitForFunction('Boolean(window.__timelines?.main)');await page.evaluate(t=>window.__qaTimes=t,times);const broken=await page.evaluate(async()=>{await document.fonts.ready;await Promise.allSettled([...document.images].map(n=>n.decode()));return [...document.images].filter(n=>!n.naturalWidth).map(n=>n.getAttribute('src'));});if(broken.length)throw Error('Broken images:'+broken.join(','));}
  await enter(true);const before=await page.evaluate(captureProtected);await enter(false);const after=await page.evaluate(captureProtected),preservationErrors=[];
  if(JSON.stringify(before.dom)!==JSON.stringify(after.dom))preservationErrors.push('Protected DOM content/attributes changed');
  if(JSON.stringify(before.tweens)!==JSON.stringify(after.tweens))preservationErrors.push('Protected GSAP tween definitions changed');
  for(const t of times)if(JSON.stringify(before.samples[t])!==JSON.stringify(after.samples[t])){
   const a=before.samples[t],b=after.samples[t];preservationErrors.push({time:t,nodes:a.nodes.filter((n,i)=>JSON.stringify(n)!==JSON.stringify(b.nodes[i])).map(n=>n.key),phonePosesChanged:JSON.stringify(a.phones)!==JSON.stringify(b.phones)});
  }
  async function screenshotAt(t,file){await page.evaluate(t=>{window.__timelines.main.totalTime(t,false);for(const el of document.querySelectorAll('[data-start][data-duration]'))el.style.visibility=t>=Number(el.dataset.start)&&t<Number(el.dataset.start)+Number(el.dataset.duration)?'visible':'hidden';},t);await page.screenshot({path:out+'/'+file});}
  await screenshotAt(14.5,'inverse-seek-14_5-forward.png');await page.evaluate(()=>window.__timelines.main.totalTime(20.999,false));await screenshotAt(14.5,'inverse-seek-14_5-reverse.png');
  const inversePixelEqual=(await sharp(out+'/inverse-seek-14_5-forward.png').raw().toBuffer()).equals(await sharp(out+'/inverse-seek-14_5-reverse.png').raw().toBuffer());
  if(!inversePixelEqual)preservationErrors.push('Visible inverse-seek pixels differ at14.5');
  const originalFailures=Object.entries(originalHashes).filter(([p,h])=>sha(p)!==h).map(([p])=>p),badgeFailures=Object.entries(badgeHashes).filter(([p,h])=>sha(p)!==h).map(([p])=>p);
  const closing=await page.evaluate(()=>{
   const tl=window.__timelines.main,meta=window.__fitnodeBetaClosing,ids=['beta-invitation','beta-offer','beta-conditions'],expected=['Regístrate en la beta','y obtén 3 meses gratis*','*Aplica para planes Lite y Plus. No requiere registro de tarjeta.'],starts=[17.95,18.08,18.20],failures=[];
   const snap=()=>ids.map(id=>{const n=document.getElementById(id),s=getComputedStyle(n),b=n.getBoundingClientRect();return{id,text:n.textContent,style:n.style.cssText,opacity:Number(s.opacity),transform:s.transform,font:s.fontFamily,size:s.fontSize,lineHeight:s.lineHeight,color:s.color,bounds:{x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom},scrollWidth:n.scrollWidth,clientWidth:n.clientWidth};});
   for(let i=0;i<ids.length;i++)if(document.getElementById(ids[i]).textContent!==expected[i])failures.push('Exact text:'+ids[i]);
   const entrySamples=[];for(const t of [0,.01,16.83,17.5,17.949,17.95,18.079,18.08,18.199,18.20,18.40,18.53,18.55,19,20.999]){tl.totalTime(t,false);const values=snap();for(let i=0;i<ids.length;i++)if(t<=starts[i]&&values[i].opacity!==0)failures.push('Early opacity:'+ids[i]+':'+t);entrySamples.push({t,values});}
   if(Number(document.querySelector('#root').dataset.duration)!==21)failures.push('Duration not21');
   if(meta.settledAt!==18.55||Math.abs(meta.staticHold-2.45)>1e-8)failures.push('Final hold timing');
   tl.totalTime(18.55,false);const settled=snap(),logo=document.querySelector('#logo-art').style.cssText;
   for(const t of [18.6,19,20,20.999]){tl.totalTime(t,false);if(JSON.stringify(snap())!==JSON.stringify(settled)||document.querySelector('#logo-art').style.cssText!==logo)failures.push('Closing not static:'+t);}
   for(const n of settled){if(n.opacity!==1||n.bounds.x<100||n.bounds.right>980||n.bounds.bottom>1500||n.scrollWidth>n.clientWidth+1)failures.push('Legibility/safe margins:'+n.id);}
   if(settled[2].size!=='24px'||settled[2].bounds.height>94)failures.push('Conditions size/line count');
   const fullTimes=[17.95,18.08,18.20,18.55,19,20.999],forward={};for(const t of fullTimes){tl.totalTime(t,false);forward[t]=JSON.stringify(snap());}const reverseErrors=[];for(const t of [...fullTimes].reverse()){tl.totalTime(t,false);if(JSON.stringify(snap())!==forward[t])reverseErrors.push(t);}
   return{meta,failures,entrySamples,settled,reverseErrors,oldClosingTextStillPresent:!!document.querySelector('#closing-title,#closing-subtitle'),conditionsLines:document.querySelectorAll('#beta-conditions span').length};
  });
  await page.evaluate(()=>{const t=19;window.__timelines.main.totalTime(t,false);for(const el of document.querySelectorAll('[data-start][data-duration]'))el.style.visibility=t>=Number(el.dataset.start)&&t<Number(el.dataset.start)+Number(el.dataset.duration)?'visible':'hidden';});
  await page.screenshot({path:out+'/closing-19s-1080.png'});await sharp(out+'/closing-19s-1080.png').resize(360,640).png().toFile(out+'/closing-19s-mobile-360.png');
  const raw=await sharp('assets/background-clean.png').resize(1080,1920).removeAlpha().raw().toBuffer(),luminance=rgb=>rgb.map(c=>{const v=c/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0),contrast=[];
  for(const n of closing.settled){const fg=n.color.match(/\d+/g).slice(0,3).map(Number),fl=luminance(fg),b=n.bounds;let min=Infinity;for(let y=Math.floor(b.y);y<Math.ceil(b.bottom);y++)for(let x=Math.floor(b.x);x<Math.ceil(b.right);x++){const p=(y*1080+x)*3,bl=luminance([...raw.subarray(p,p+3)]),c=(Math.max(fl,bl)+.05)/(Math.min(fl,bl)+.05);min=Math.min(min,c);}contrast.push({id:n.id,minContrastAgainstUnderlyingArtwork:min,displayFontAt360px:parseFloat(n.size)/2});if(min<4.5)closing.failures.push('Low contrast:'+n.id);}
  const report={runtimeErrors,preservationErrors,protectedSampleTimes:times,protectedNodes:after.dom.length,protectedTweens:after.tweens.length,protectedDomEqual:JSON.stringify(before.dom)===JSON.stringify(after.dom),protectedTweenDefinitionsEqual:JSON.stringify(before.tweens)===JSON.stringify(after.tweens),reverseErrors:after.reverseErrors,rawHiddenAtlasDifferences:after.rawHiddenAtlasDifferences,baselineHiddenAtlasDifferences:before.rawHiddenAtlasDifferences,hiddenAtlasCacheBehaviorUnchanged:JSON.stringify(before.rawHiddenAtlasDifferences)===JSON.stringify(after.rawHiddenAtlasDifferences),inversePixelEqualAt14_5:inversePixelEqual,baselineReverseErrors:before.reverseErrors,originalHashesVerified:Object.keys(originalHashes).length,originalFailures,badgeHashes,badgeFailures,closing,contrast,screenshots:['closing-19s-1080.png','closing-19s-mobile-360.png','inverse-seek-14_5-forward.png','inverse-seek-14_5-reverse.png']};
  fs.writeFileSync(out+'/verification.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify({runtimeErrors,preservationErrors,reverseErrors:after.reverseErrors,originalHashesVerified:Object.keys(originalHashes).length,originalFailures,badgeFailures,closingFailures:closing.failures,closingReverseErrors:closing.reverseErrors,contrast,meta:closing.meta}));
  if(runtimeErrors.length||preservationErrors.length||after.reverseErrors.length||originalFailures.length||badgeFailures.length||closing.failures.length||closing.reverseErrors.length)process.exitCode=1;
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
