// Independent main-vs-segment visual QA; authored composition remains untouched.
const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/package.json'),sharp=req('sharp');
(async()=>{
 const root=process.cwd(),out='analysis/notification-audit/validation';
 const server=http.createServer((q,r)=>{const url=decodeURIComponent(q.url.split('?')[0]),f=path.resolve(root,'.'+url);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)){r.writeHead(404).end();return;}r.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'})[path.extname(f)]||'text/plain'});fs.createReadStream(f).pipe(r);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await req('puppeteer-core').launch({executablePath:'C:/Users/aweis/.cache/puppeteer/chrome-headless-shell/win64-152.0.7977.75/chrome-headless-shell-win64/chrome-headless-shell.exe',headless:true});
  const page=await browser.newPage();await page.setViewport({width:1080,height:1920});await page.evaluateOnNewDocument('window.__timelines={};');
  const samples={};
  for(const [name,url,time]of [['main','index.html',9.2],['preview','notification-proof/entry.html',7.7]]){
   await page.goto('http://127.0.0.1:'+server.address().port+'/'+url);await page.waitForFunction('Boolean(window.__timelines?.main)');await page.evaluate('Promise.all([...document.images].map(n=>n.decode()))');
   await page.evaluate(`(()=>{window.__timelines.main.totalTime(${time},false);for(const n of document.querySelectorAll('.clip')){const s=Number(n.dataset.start),d=Number(n.dataset.duration);n.style.visibility=n.dataset.hidden!=='true'&&${time}>=s&&${time}<s+d?'visible':'hidden';}})()`);
   await page.screenshot();const png=Buffer.from(await page.screenshot({path:out+'/'+name+'-notification-9.2.png'}));
   const state=await page.evaluate(`(()=>{const ids=['phone-coach-object','phone-client-object','coach-float','client-float','coach-focus','client-focus','coach-depth','client-depth','fitnode-notification','screen-client','client-series-card','floating-client-series-card'];return{nodes:Object.fromEntries(ids.map(id=>{const n=document.getElementById(id),b=n.getBoundingClientRect();return[id,{transform:n.style.transform,opacity:getComputedStyle(n).opacity,bounds:[b.x,b.y,b.width,b.height]}]})),yaw:Object.fromEntries(Object.entries(window.__fitnodePhoneYaw).map(([role,y])=>[role,{angle:y.pose.angle,transform:y.rig.style.transform,overlay:y.overlay.style.transform}])),blur:getComputedStyle(document.getElementById('fitnode-notification')).backdropFilter,allStyles:[...document.querySelectorAll('[id]')].map(n=>[n.id,n.style.cssText])};})()`);
   samples[name]={png,state};
  }
  const a=await sharp(samples.main.png).ensureAlpha().raw().toBuffer(),b=await sharp(samples.preview.png).ensureAlpha().raw().toBuffer();let changed=0,sum=0,max=0;
  for(let p=0;p<a.length;p+=4){let pixel=false;for(let c=0;c<3;c++){let d=Math.abs(a[p+c]-b[p+c]);pixel||=d>0;sum+=d;max=Math.max(max,d);}if(pixel)changed++;}
  const result={sourceTime:9.2,previewTime:7.7,sourceOffset:1.5,geometryAndStylesEqual:JSON.stringify(samples.main.state)===JSON.stringify(samples.preview.state),pixelsChanged:changed,MAE:sum/(1080*1920*3),maxDelta:max,blur:samples.main.state.blur,styleDifferences:samples.main.state.allStyles.filter(([id,style],i)=>JSON.stringify([id,style])!==JSON.stringify(samples.preview.state.allStyles[i])),state:samples.main.state,backgroundSourceSha256:crypto.createHash('sha256').update(fs.readFileSync('assets/background-clean.png')).digest('hex')};
  fs.writeFileSync(out+'/preview-cross-comparison.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(!result.geometryAndStylesEqual||changed/(1080*1920)>.001||result.MAE>.004||max>128)process.exitCode=1;
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
