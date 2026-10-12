const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/package.json');
const sharp=req('sharp');
(async()=>{
 const original=await sharp('../source/screenshots/SCREEN_01_COACH_ROUTINE.png').ensureAlpha().raw().toBuffer();
 const reassembled=await sharp('assets/ui/mesocycle/screen-with-card-aperture.png').composite([{input:'assets/ui/mesocycle/card-closed.png',left:0,top:334}]).raw().toBuffer();
 if(!original.equals(reassembled))throw Error('Raster split does not reproduce the original screenshot');
 const root=process.cwd(),server=http.createServer((request,response)=>{
  const before=request.url==='/__before.html';
  const file=before?path.join(root,'mesocycle-proof/before-mesocycle.html.txt'):path.resolve(root,'.'+decodeURIComponent(request.url.split('?')[0]));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){response.writeHead(404).end();return;}
  response.writeHead(200,{'Content-Type':before||file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript':file.endsWith('.woff2')?'font/woff2':'image/png'});fs.createReadStream(file).pipe(response);
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await req('puppeteer-core').launch({executablePath:'C:/Users/aweis/.cache/puppeteer/chrome-headless-shell/win64-152.0.7977.75/chrome-headless-shell-win64/chrome-headless-shell.exe',headless:true});
 try{
  const page=await browser.newPage();await page.setViewport({width:1080,height:1920});await page.evaluateOnNewDocument('window.__timelines={};');
  const enter=async file=>{await page.goto('http://127.0.0.1:'+server.address().port+'/'+file);await page.waitForFunction('Boolean(window.__timelines?.main)');};
  const entry=()=>{const states=[];for(const t of [.01,.17,.32,.5,1,1.5,1.599]){window.__timelines.main.totalTime(t,false);states.push(['#phone-coach-object','#phone-client-object','#logo-art','#hero-line-1','#hero-line-2','#hero-subtitle'].map(id=>['x','y','scale','rotation','rotationX','rotationY','opacity'].map(p=>gsap.getProperty(id,p))));}return states;};
  await enter('__before.html');const before=await page.evaluate('('+entry.toString()+')()');
  await enter('index.html');const current=await page.evaluate('('+entry.toString()+')()');
  if(JSON.stringify(before)!==JSON.stringify(current))throw Error('Approved entrance changed before 1.6 s');
  const state=await page.evaluate(`(()=>{const tl=window.__timelines.main,plane=document.querySelector('#screen-coach'),matrix=plane.style.transform;for(let n=1;n<=216;n++){tl.totalTime(n/60,false);if(plane.style.transform!==matrix)throw Error('Screen perspective changed');}const states={};for(const t of [1.6,2.4,2.8,3.1,3.56]){tl.totalTime(t,false);states[t]={coachScale:gsap.getProperty('#coach-focus','scale'),cardScale:gsap.getProperty('#mesocycle-card','scale'),open:gsap.getProperty('#mesocycle-menu','opacity'),pressed:gsap.getProperty('#mesocycle-menu-pressed','opacity')};}return {states,rootDuration:document.querySelector('#root').dataset.duration,screenPerspectiveUnchanged:true};})()`);
  if(state.states['2.8'].open!==1||state.states['3.1'].pressed!==1||state.states['3.56'].cardScale!==1||state.states['3.56'].open!==0)throw Error('Mesocycle phases incomplete');
  const provenance=JSON.parse(fs.readFileSync('assets/ui/mesocycle/provenance.json','utf8'));
  for(const [file,hash]of Object.entries(provenance.originalHashes))if(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==hash)throw Error('Original media changed');
  const result={approvedEntranceUnchanged:true,reassembledScreenshotPixelExact:true,originalMediaUnchanged:true,...state,render:{start:1.6,end:3.6,duration:2,width:1080,height:1920,fps:30,audio:false}};
  fs.writeFileSync('mesocycle-proof/verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
