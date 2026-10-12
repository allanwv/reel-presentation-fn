const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/package.json');
const sharp=req('sharp'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const normalize=html=>html.replace(/^#phone-coach-object > \.coach-screen-backing[^\n]*\n/m,'').replace(/^<img class="coach-screen-backing"[^\n]*\n/m,'').replace(/<img class="phone-shell" src="assets\/(?:phone-coach-reference\.png|ui\/floating\/phone-coach-clean\.png)"[^>]*>/g,'COACH_SHELL').replace(/const days=cards\.add[\s\S]*?(?=const exercise=cards\.add)/,'DAYS_SEGMENT\n');
 if(normalize(fs.readFileSync('days-proof/before-days.html.txt','utf8'))!==normalize(fs.readFileSync('index.html','utf8')))throw Error('An approved component outside Coach shell and days changed');
 for(const [file,expected] of Object.entries(JSON.parse(fs.readFileSync('analysis/approved-integrity.json','utf8'))))if(hash(fs.readFileSync(file))!==expected)throw Error('Approved original changed: '+file);
 for(const [file,expected] of Object.entries(JSON.parse(fs.readFileSync('assets/ui/floating/provenance.json','utf8')).sourceHashes))if(hash(fs.readFileSync(file))!==expected)throw Error('Source changed: '+file);
 const [old,clean,mask]=await Promise.all(['assets/phone-coach-reference.png','assets/ui/floating/phone-coach-clean.png','days-proof/ui-residual-mask.png'].map(file=>sharp(file).ensureAlpha().raw().toBuffer()));
 for(let i=0;i<old.length;i+=4){
   if(old[i+3]!==clean[i+3])throw Error('Physical phone alpha changed');
   if(mask[i+3]===0&&!old.subarray(i,i+4).equals(clean.subarray(i,i+4)))throw Error('Pixel outside interior cleanup changed');
   if(mask[i+3]!==0&&(clean[i]!==255||clean[i+1]!==255||clean[i+2]!==255))throw Error('Old UI residue still visible');
 }
 const root=process.cwd(),server=http.createServer((request,response)=>{
   const file=path.resolve(root,'.'+decodeURIComponent(request.url.split('?')[0]));
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){response.writeHead(404).end();return;}
   const ext=path.extname(file),types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.png':'image/png','.svg':'image/svg+xml'};
   response.writeHead(200,{'Content-Type':types[ext]||'text/plain'});fs.createReadStream(file).pipe(response);
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await req('puppeteer-core').launch({executablePath:'C:/Users/aweis/.cache/puppeteer/chrome-headless-shell/win64-152.0.7977.75/chrome-headless-shell-win64/chrome-headless-shell.exe',headless:true});
 try{
   const page=await browser.newPage();await page.setViewport({width:1080,height:1920});await page.evaluateOnNewDocument('window.__timelines={};');
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction('Boolean(window.__timelines?.main)');
   const result=await page.evaluate(`(()=>{
     const tl=window.__timelines.main,byId=id=>document.getElementById(id),op=id=>Number(getComputedStyle(byId(id)).opacity),plane=byId('screen-coach'),matrix=plane.style.transform;
     for(let frame=1;frame<=768;frame++){
       tl.totalTime(frame/60,false);
       if(plane.style.transform!==matrix||byId('ui-overlay-plane').style.transform!==matrix)throw Error('Perspective changed');
       if(byId('ui-overlay-focus').style.transform!==byId('coach-focus').style.transform||byId('ui-overlay-phone').style.transform!==byId('phone-coach-object').style.transform)throw Error('Overlay alignment lost');
       if(op('days-card')+op('floating-days-card')!==1)throw Error('Days duplicated or missing');
     }
     const states={};
     for(const [t,expected]of [[3.7,'none'],[4.1,'l'],[4.4,'lx'],[4.7,'lxv'],[5.2,'lxv'],[8.8,'lxv'],[10.4,'lxv']]){
       tl.totalTime(t,false);
       for(const id of ['days-card','floating-days-card']){
         const visible=[...byId(id).querySelectorAll('.ui-state')].filter(n=>Number(getComputedStyle(n).opacity)>.999).map(n=>n.dataset.state);
         if(visible.length!==1||visible[0]!==expected)throw Error('Wrong authentic day state at '+t+': '+visible);
       }
       states[t]=expected;
     }
     tl.totalTime(4.7,false);
     const card=byId('floating-days-card'),bbox=card.getBoundingClientRect(),phone=byId('phone-coach-object').getBoundingClientRect();
     if(bbox.left>=phone.left)throw Error('Days do not extend beyond physical phone');
     for(let p=card.parentElement;p&&p.id!=='root';p=p.parentElement)if(['hidden','clip','scroll'].includes(getComputedStyle(p).overflow))throw Error('Clipped overlay');
     tl.totalTime(5.2,false);
     if(op('days-card')!==1||op('floating-days-card')!==0||Number(gsap.getProperty('#floating-days-card','scale'))!==1)throw Error('Return handoff incomplete');
     document.getElementById('closing-copy').style.visibility='hidden';
     return {duration:Number(byId('root').dataset.duration),sampledFrames:768,states,extendsOutsidePhone:true,duplicatedDays:false,perspectiveStable:true,overlayAligned:true,finalDocked:true};
   })()`);
   await page.screenshot({path:'days-proof/qc-final-docked.png'});
   fs.writeFileSync('days-proof/verification.json',JSON.stringify({approvedCompositionAndMesocycleUnchanged:true,originalAssetsUnchanged:true,physicalBezelAndAlphaUnchanged:true,oldUiSliverWhite:true,...result},null,2));
   console.log(JSON.stringify(result));
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
