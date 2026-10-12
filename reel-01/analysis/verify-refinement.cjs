const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/package.json');
const sharp=req('sharp'),out='refinement-proof',errors=[];
const check=(condition,message)=>{if(!condition)errors.push(message);};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const ep=JSON.parse(fs.readFileSync('assets/ui/exercise-entry/provenance.json','utf8'));
 for(const [file,expected] of Object.entries(ep.sourceHashes))check(hash(fs.readFileSync(file))===expected,'Original pixels changed: '+file);
 for(const [name,field] of Object.entries(ep.fields)){
  const original=await sharp(field.source).ensureAlpha().raw().toBuffer(),empty=await sharp(field.empty).ensureAlpha().raw().toBuffer();
  const filled=await sharp(field.empty).composite([{input:field.valueLayer}]).ensureAlpha().raw().toBuffer(),expected=await sharp(field.filled).ensureAlpha().raw().toBuffer();
  check(filled.equals(expected),'Input layer reconstruction differs: '+name);
  const m=field.mask;let outside=0,inside=0;
  for(let y=0;y<168;y++)for(let x=0;x<276;x++){
   const i=(y*276+x)*4,within=x>=m.left&&x<m.left+m.width&&y>=m.top&&y<m.top+m.height;
   if(!within&&!original.subarray(i,i+4).equals(empty.subarray(i,i+4)))outside++;
   if(within&&[empty[i],empty[i+1],empty[i+2],empty[i+3]].some(v=>v!==255))inside++;
  }
  check(outside===0&&inside===0,'Input mask affects borders or retains old content: '+name);
 }
 const root=process.cwd(),baseline=fs.readFileSync(out+'/before-refinement.html.txt','utf8').replace('assets/ui/floating/floating-cards.js','__before-cards.js').replace('assets/ui/floating/floating-cards.css','__before-cards.css');
 const server=http.createServer((request,response)=>{
  const url=decodeURIComponent(request.url.split('?')[0]);
  if(url==='/__before.html'){response.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end(baseline);return;}
  const special={'/__before-cards.js':out+'/floating-cards.before.js.txt','/__before-cards.css':out+'/floating-cards.before.css.txt'},file=path.resolve(root,special[url]||'.'+url);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){response.writeHead(404).end();return;}
  const type=url.endsWith('.js')?'text/javascript':url.endsWith('.css')?'text/css':({'.html':'text/html; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'text/plain';
  response.writeHead(200,{'Content-Type':type});fs.createReadStream(file).pipe(response);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
  browser=await req('puppeteer-core').launch({executablePath:'C:/Users/aweis/.cache/puppeteer/chrome-headless-shell/win64-152.0.7977.75/chrome-headless-shell-win64/chrome-headless-shell.exe',headless:true});
  const page=await browser.newPage();await page.setViewport({width:1080,height:1920});await page.evaluateOnNewDocument('window.__timelines={};');
  page.on('pageerror',e=>errors.push('Runtime: '+e.message));
  const enter=async file=>{await page.goto('http://127.0.0.1:'+server.address().port+'/'+file);await page.waitForFunction('Boolean(window.__timelines?.main)');await page.evaluate('Promise.all([...document.images].map(img=>img.decode()))');};
  const seek=async t=>page.evaluate(`(()=>{window.__timelines.main.totalTime(${t},false);for(const el of document.querySelectorAll('.clip')){const s=Number(el.dataset.start),d=Number(el.dataset.duration);el.style.visibility=(${t}>=s&&${t}<s+d)?'visible':'hidden';}})()`);
  await enter('__before.html');await seek(12.5);const beforeClose=Buffer.from(await page.screenshot());
  await enter('index.html');
  const result=await page.evaluate(`(()=>{
   const errors=[],ok=(c,m)=>{if(!c)errors.push(m)},tl=window.__timelines.main,el=id=>document.getElementById(id),num=(id,p)=>Number(gsap.getProperty(el(id),p)),alpha=node=>Number(getComputedStyle(node).opacity);
   ok(el('root').dataset.duration==='12.8'&&el('root').dataset.width==='1080'&&el('root').dataset.height==='1920','Root contract changed');
   const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);ok(ids.length===new Set(ids).size,'Duplicate DOM ids');
   const ancestry=(child,parent)=>ok(el(child).parentElement===el(parent),'Wrong wrapper ancestry: '+child+' / '+parent);
   for(const role of ['coach','client']){ancestry('phone-'+role+'-object',role+'-float');ancestry(role+'-float',role+'-depth');ancestry(role+'-depth',role+'-focus');}
   ancestry('ui-overlay-phone','ui-overlay-float');ancestry('ui-overlay-float','ui-overlay-depth');ancestry('ui-overlay-depth','ui-overlay-focus');
   const matrices=['screen-coach','screen-client','ui-overlay-plane'].map(id=>el(id).style.transform);
   const pairs=['mesocycle-card','days-card','exercise-card'];const ranges={coach:[Infinity,-Infinity],client:[Infinity,-Infinity]};let prior={},maxStep=0;
   for(let frame=1;frame<3072;frame++){
    const t=frame/240;tl.totalTime(t,false);
    for(const [a,b]of [['coach-focus','ui-overlay-focus'],['coach-depth','ui-overlay-depth'],['coach-float','ui-overlay-float'],['phone-coach-object','ui-overlay-phone']])ok(el(a).style.transform===el(b).style.transform&&el(a).style.transformOrigin===el(b).style.transformOrigin,'Overlay mismatch '+a+' at '+t);
    ['screen-coach','screen-client','ui-overlay-plane'].forEach((id,i)=>ok(el(id).style.transform===matrices[i],'Homography moved '+id));
    for(const id of pairs)ok(Math.abs(alpha(el(id))+alpha(el('floating-'+id))-1)<1e-6,'Duplicate/missing '+id+' at '+t);
    for(const [role,A,T,P]of [['coach',2.4,4.2,0],['client',2.6,4,1.35]]){
     const y=num(role+'-float','y'),expected=A*Math.sin(2*Math.PI*t/T+P);ok(Math.abs(y-expected)<.0003,'Sine mismatch '+role+' at '+t);
     ranges[role][0]=Math.min(ranges[role][0],y);ranges[role][1]=Math.max(ranges[role][1],y);
     if(prior[role]!==undefined)maxStep=Math.max(maxStep,Math.abs(y-prior[role]));prior[role]=y;
     ok(y===num(role+'-label-float','y'),'Label floating mismatch '+role);
    }
   }
   ok(maxStep<.025,'Ambient motion discontinuity '+maxStep);
   tl.totalTime(2.1,false);ok(num('coach-focus','x')===100&&num('coach-focus','scale')===1.2,'Focus endpoint');ok(num('coach-depth','z')===140&&num('coach-depth','rotation')===-2.5&&num('coach-depth','rotationY')===-2.5,'Depth endpoint');
   const phoneBounds={};for(const role of ['coach','client']){const node=el('phone-'+role+'-object'),b=node.getBoundingClientRect();phoneBounds[role]={x:b.x,y:b.y,width:b.width,height:b.height,opacity:alpha(node)};ok(b.width>100&&b.height>100&&b.x<1080&&b.x+b.width>0&&b.y<1920&&b.y+b.height>0&&alpha(node)===1,'Phone invisible/outside canvas '+role);}
   tl.totalTime(1.6,false);ok(num('coach-focus','x')===0&&num('coach-depth','z')===0,'Focus starts discontinuously');
   tl.totalTime(8.8,false);for(const role of ['coach','client'])for(const p of ['z','rotation','rotationY'])ok(num(role+'-depth',p)===0,'Depth return incomplete '+role+' '+p);
   for(const [id,start,end]of [['mesocycle-card',2.4,3.55],['days-card',3.6,5.2],['exercise-card',5.2,7.6]]){
    const f=el('floating-'+id),face=f.querySelector('.floating-face');ok(face&&getComputedStyle(face).overflow==='hidden','Missing face mask '+id);ok(getComputedStyle(f).overflow==='visible','Card clipped '+id);
    for(const t of [start,end]){tl.totalTime(t,false);ok(Math.abs(num('floating-'+id,'borderRadius'))<1e-6&&Number(getComputedStyle(face).borderTopLeftRadius.replace('px',''))===0,'Radius not neutral '+id+' at '+t);ok(getComputedStyle(f).boxShadow.includes('rgba(0, 12, 24, 0)'),'Shadow not neutral '+id+' at '+t);}
   }
   tl.totalTime(2.9,false);const menu=el('floating-mesocycle-menu');ok(menu.parentElement===el('floating-mesocycle-card')&&!menu.closest('.floating-face'),'Menu under face mask');let parent=menu.parentElement;while(parent&&parent.id!=='root'){ok(!['hidden','clip','scroll'].includes(getComputedStyle(parent).overflow),'Menu clipping ancestor '+parent.id);parent=parent.parentElement;}
   const values={};for(const t of [5.2,5.3,5.5,5.619,5.79,6.15,6.51,6.87,7.6,8.8,10.3]){
    tl.totalTime(t,false);values[t]=[...el('exercise-card').querySelectorAll('.ui-field-value')].map(n=>alpha(n));const floating=[...el('floating-exercise-card').querySelectorAll('.ui-field-value')].map(n=>alpha(n));ok(values[t].every((v,i)=>v===floating[i]),'Input dock mismatch '+t);
    ok([...el('exercise-card').querySelectorAll('.ui-field-initial')].every(n=>alpha(n)===0),'Old values remain '+t);
    const expected=t<5.62?[0,0,0,0]:t<5.98?[1,0,0,0]:t<6.34?[1,1,0,0]:t<6.70?[1,1,1,0]:[1,1,1,1];ok(values[t].every((v,i)=>v===expected[i]),'Input sequence wrong at '+t+' '+values[t]);
   }
   tl.totalTime(5.2,false);const selected=[...el('days-card').querySelectorAll('.ui-day-selected')].filter(n=>alpha(n)===1).map(n=>n.parentElement.dataset.day);ok(selected.join(',')==='l,x,v','Days final not L X V');
   const snapshot=()=>[...document.querySelectorAll('[id]')].map(n=>[n.id,n.style.cssText]);const seeks=[.01,1,1.6,1.85,2.1,2.8,3.6,4.2,5.2,5.5,5.85,6.55,7.6,8.8,10.6,11.8,12.5];const forward={};for(const t of seeks){tl.totalTime(t,false);forward[t]=JSON.stringify(snapshot());}for(const t of [...seeks].reverse()){tl.totalTime(t,false);ok(JSON.stringify(snapshot())===forward[t],'Reverse seek differs '+t);}
   return{errors:[...new Set(errors)].slice(0,100),sampledFrames:3071,floatRanges:ranges,maxFloatStepAt240fps:maxStep,values,selectedDays:selected,phoneBoundsAt2_1:phoneBounds};
  })()`);
  errors.push(...result.errors);delete result.errors;
  await seek(12.5);const afterClose=Buffer.from(await page.screenshot());check(beforeClose.equals(afterClose),'Closing pixel mismatch against baseline');
  const times=[1.0,1.6,1.85,2.1,2.8,4.2,5.5,5.85,6.2,6.55,6.95,7.6,8.8,10.6,11.8,12.5],tiles=[];
  for(let i=0;i<times.length;i++){
   const t=times[i];await seek(t);const filename=out+'/qc-'+String(i+1).padStart(2,'0')+'-'+t.toFixed(2)+'.png';const png=Buffer.from(await page.screenshot({path:filename}));tiles.push(await sharp(png).resize(270,480).toBuffer());
  }
  await sharp({create:{width:1080,height:1920,channels:4,background:'#061a2c'}}).composite(tiles.map((input,i)=>({input,left:(i%4)*270,top:Math.floor(i/4)*480}))).png().toFile(out+'/motion-contact-sheet.png');
  // Isolate a card at fixed geometry to exclude moving-camera pixels.
  const positions=JSON.parse(fs.readFileSync('assets/ui/floating/day-taps/provenance.json','utf8')).positions;let first,changes=0;
  for(const t of [3.88,3.96,4.035,4.2,4.28,4.355,4.42,4.60,4.675,4.80,4.91]){
   await seek(t);await page.evaluate(`(()=>{document.getElementById('day-qc')?.remove();const c=document.getElementById('floating-days-card').cloneNode(true);c.id='day-qc';for(const n of c.querySelectorAll('[id]'))n.removeAttribute('id');Object.assign(c.style,{position:'absolute',left:'0',top:'0',width:'240px',height:'56.6666666667px',transform:'scale(3)',transformOrigin:'0 0',opacity:'1',zIndex:'9999'});document.body.appendChild(c);})()`);
   const raw=await sharp(Buffer.from(await page.screenshot({clip:{x:0,y:0,width:720,height:170}}))).ensureAlpha().raw().toBuffer();if(!first)first=raw;
   for(let y=0;y<170;y++)for(let x=0;x<720;x++){if(positions.some(p=>x>=Math.floor(p.left*3)-2&&x<=Math.ceil(p.left*3+78)+2&&y>=Math.floor(p.top*3)-2&&y<=Math.ceil(p.top*3+78)+2))continue;const i=(y*720+x)*4;if(!first.subarray(i,i+4).equals(raw.subarray(i,i+4)))changes++;}
  }
  check(changes===0,'Days fixed background pixel changes: '+changes);
  const verification={...result,closingPixelIdentical:beforeClose.equals(afterClose),daysBackgroundPixelChanges:changes,contactSheetTimes:times,errors:[...new Set(errors)]};fs.writeFileSync(out+'/verification.json',JSON.stringify(verification,null,2));console.log(JSON.stringify(verification));if(errors.length)process.exitCode=1;
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1;});
