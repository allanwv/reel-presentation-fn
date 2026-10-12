const fs=require('fs'),path=require('path'),http=require('http');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/110f701c48e68d66/node_modules/hyperframes/package.json');
const out='real-3d-proof',mode=process.argv[2]||'coach',root=process.cwd();
(async()=>{
 const server=http.createServer((q,r)=>{const f=path.resolve(root,'.'+decodeURIComponent(q.url.split('?')[0]));if(!f.startsWith(root+path.sep)||!fs.existsSync(f)){r.writeHead(404).end();return;}r.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'})[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await req('puppeteer-core').launch({executablePath:'C:/Users/aweis/.cache/puppeteer/chrome-headless-shell/win64-152.0.7977.75/chrome-headless-shell-win64/chrome-headless-shell.exe',headless:true});
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width:1080,height:1920});await page.evaluateOnNewDocument('window.__timelines={};');
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction('Boolean(window.__timelines?.main)',{timeout:15000}).catch(async e=>{throw Error(e.message+'; page errors: '+JSON.stringify(errors)+'; state: '+JSON.stringify(await page.evaluate(()=>({url:location.href,title:document.title,type:document.contentType,gsap:typeof gsap,rig:typeof FitnodePhone3D,fonts:document.fonts.status,text:document.body.innerText.slice(0,150),html:document.documentElement.outerHTML.slice(0,150)}))));});await page.evaluate('Promise.all([...document.images].map(n=>n.decode()))');
  fs.mkdirSync(out,{recursive:true});
  const times=mode==='coach'?[1.6,1.9,2.2,2.6,3.0,3.55,4.35,6.4,8.35,8.675,9.0]:[8.35,8.675,9,9.6,11.1,12.4,13.4,14.5,16.28,16.83,18.4];
  const captures=[];
  for(const t of times){
   await page.evaluate(t=>{window.__timelines.main.totalTime(t,false);for(const el of document.querySelectorAll('[data-start][data-duration]')){const start=Number(el.dataset.start),end=start+Number(el.dataset.duration);el.style.visibility=t>=start&&t<end?'visible':'hidden';}},t);
   const geometry=await page.evaluate(role=>{const p=window.__fitnodePhoneYaw[role],screen=document.querySelector('#screen-'+role),overlay=document.querySelector(role==='coach'?'#ui-overlay-plane':'#client-ui-overlay-plane');return{angle:p.pose.angle,quad:p.projectedQuad(),calibration:p.calibration,rigTransform:p.rig.style.transform,overlayTransform:p.overlay.style.transform,screenTransform:screen.style.transform,planeTransform:overlay.style.transform,edges:p.rig.querySelectorAll('.real-phone-edge').length,screenBounds:JSON.parse(JSON.stringify(screen.getBoundingClientRect())),perspective:getComputedStyle(p.camera||p.rig).perspective,preserve:getComputedStyle(p.rig).transformStyle};},mode==='coach'?'coach':'client');
   const name=mode+'-'+String(t).replace('.','_')+'.png';await page.screenshot({path:out+'/'+name});captures.push({t,file:name,...geometry});
  }
  // Normalized turn proof: remove only the outer cinematic approach in this
  // disposable browser, so a scale/translation cannot masquerade as yaw.
  const role=mode==='coach'?'coach':'client',delta=role==='coach'?-9:9;
  await page.evaluate(role=>{const t=role==='coach'?2.2:9;window.__timelines.main.totalTime(t,false);for(const el of document.querySelectorAll('[data-start][data-duration]'))el.style.visibility=t>=Number(el.dataset.start)&&t<Number(el.dataset.start)+Number(el.dataset.duration)?'visible':'hidden';for(const id of [role+'-focus',role+'-depth',role+'-float','phone-'+role+'-object'])document.getElementById(id).style.transform='none';},role);
  const normalized=[];
  for(const [index,angle]of[0,delta/2,delta].entries()){
   await page.evaluate(({role,angle})=>{const p=window.__fitnodePhoneYaw[role];p.pose.angle=angle;p.sync();},{role,angle});
   const box=role==='coach'?{x:35,y:740,width:600,height:1030}:{x:520,y:740,width:560,height:1030};
   const file=out+'/'+mode+'-normalized-'+index+'.png';await page.screenshot({path:file,clip:box});normalized.push(file);
  }
  const sharp=req('sharp');const panels=await Promise.all(normalized.map(f=>sharp(f).resize(420,773,{fit:'contain',background:'#061a2c'}).toBuffer()));
  await sharp({create:{width:1260,height:825,channels:3,background:'#061a2c'}}).composite([...panels.map((input,i)=>({input,left:i*420,top:52})),{input:Buffer.from('<svg width="1260" height="52"><style>text{font:20px sans-serif;fill:white}</style><text x="15" y="34">'+mode+' · antes (0°)</text><text x="435" y="34">durante ('+(delta/2)+'°)</text><text x="855" y="34">protagonismo ('+delta+'°)</text></svg>'),left:0,top:0}]).png().toFile(out+'/'+mode+'-turn-comparison.png');
  fs.writeFileSync(out+'/'+mode+'-geometry.json',JSON.stringify({errors,captures},null,2));console.log(JSON.stringify({mode,errors,frames:captures.length,comparison:out+'/'+mode+'-turn-comparison.png'}));
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
