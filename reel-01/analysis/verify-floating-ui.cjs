const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/package.json');
const sharp=req('sharp');
const digest=data=>crypto.createHash('sha256').update(data).digest('hex');
(async()=>{
  const provenance=JSON.parse(fs.readFileSync('assets/ui/floating/provenance.json','utf8'));
  for(const [file,hash] of Object.entries(provenance.sourceHashes))if(digest(fs.readFileSync(file))!==hash)throw Error('Original media changed: '+file);
  const original=await sharp('../source/screenshots/SCREEN_01_COACH_ROUTINE.png').ensureAlpha().raw().toBuffer();
  const rebuilt=await sharp('assets/ui/floating/screen-apertures.png').composite(Object.entries(provenance.bands).map(([name,box])=>({input:'assets/ui/floating/'+name+'-original.png',left:box.left,top:box.top}))).raw().toBuffer();
  if(!original.equals(rebuilt))throw Error('Card split changed original pixels');
  const exercise=await sharp('assets/ui/floating/exercise-original.png').ensureAlpha().raw().toBuffer();
  const rebuiltExercise=await sharp('assets/ui/floating/exercise-field-apertures.png').composite(Object.entries(provenance.cells).map(([name,box])=>({input:'assets/ui/floating/field-'+name+'-original.png',left:box.left,top:box.top-provenance.bands.exercise.top}))).raw().toBuffer();
  if(!exercise.equals(rebuiltExercise))throw Error('Field split changed original pixels');
  const root=process.cwd(),server=http.createServer((request,response)=>{
    const before=request.url==='/__before.html';
    const file=before?path.join(root,'overlay-proof/before-floating.html.txt'):path.resolve(root,'.'+decodeURIComponent(request.url.split('?')[0]));
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){response.writeHead(404).end();return;}
    const type=before||file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.woff2')?'font/woff2':'image/png';
    response.writeHead(200,{'Content-Type':type});fs.createReadStream(file).pipe(response);
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await req('puppeteer-core').launch({executablePath:'C:/Users/aweis/.cache/puppeteer/chrome-headless-shell/win64-152.0.7977.75/chrome-headless-shell-win64/chrome-headless-shell.exe',headless:true});
  try{
    const page=await browser.newPage();await page.setViewport({width:1080,height:1920});
    await page.evaluateOnNewDocument('window.__timelines={};');
    const enter=async file=>{await page.goto('http://127.0.0.1:'+server.address().port+'/'+file);await page.waitForFunction('Boolean(window.__timelines?.main)');};
    const preserved=()=>{
      const rows=[];
      for(const t of [.01,.17,.32,.5,1,1.5,1.599,2.4,4,7.6,8.8,10.4,11.4,11.9,12.799]){
        window.__timelines.main.totalTime(t,false);
        rows.push(['#phone-coach-object','#phone-client-object','#coach-focus','#client-focus','#coach-label-focus','#client-label-focus','#logo-art','#hero-line-1','#hero-line-2','#hero-subtitle','#closing-title','#closing-subtitle'].map(id=>['x','y','scale','rotation','rotationX','rotationY','opacity'].map(p=>gsap.getProperty(id,p))));
      }
      return rows;
    };
    await enter('__before.html');const before=await page.evaluate('('+preserved.toString()+')()');
    await enter('index.html');const current=await page.evaluate('('+preserved.toString()+')()');
    if(JSON.stringify(before)!==JSON.stringify(current))throw Error('Approved phone, focus, copy, logo or closing animation changed');
    const result=await page.evaluate(`(()=>{
      const tl=window.__timelines.main,byId=id=>document.getElementById(id),opacity=id=>Number(getComputedStyle(byId(id)).opacity);
      const plane=byId('screen-coach'),homography=plane.style.transform;
      const pairs=['mesocycle-card','days-card','exercise-card'];
      for(let frame=1;frame<=768;frame++){
        tl.totalTime(frame/60,false);
        if(plane.style.transform!==homography||byId('ui-overlay-plane').style.transform!==homography)throw Error('Perspective changed');
        if(byId('ui-overlay-focus').style.transform!==byId('coach-focus').style.transform||byId('ui-overlay-phone').style.transform!==byId('phone-coach-object').style.transform)throw Error('Overlay lost phone alignment');
        for(const id of pairs)if(Math.abs(opacity(id)+opacity('floating-'+id)-1)>1e-6)throw Error('Duplicate or missing card surface: '+id);
      }
      for(const id of pairs){
        let p=byId('floating-'+id).parentElement;
        while(p&&p.id!=='root'){
          if(['hidden','clip','scroll'].includes(getComputedStyle(p).overflow)||getComputedStyle(p).clipPath!=='none')throw Error('Overlay still clipped by '+p.id);
          p=p.parentElement;
        }
      }
      const states={};
      for(const t of [2.39,2.9,3.1,3.55,4.24,4.5,4.8,5.2,6.62,7.1,7.6]){
        tl.totalTime(t,false);
        const active=pairs.find(id=>opacity('floating-'+id)===1);
        states[t]={active:active||null,menu:opacity('floating-mesocycle-menu'),pressed:opacity('floating-mesocycle-menu-pressed'),days:[...byId('floating-days-card').querySelectorAll('.ui-state')].filter(n=>Number(getComputedStyle(n).opacity)===1).map(n=>n.dataset.state),rir:byId('floating-field-rir').querySelector('.ui-field-focused').style.opacity,rest:byId('floating-field-rest').querySelector('.ui-field-focused').style.opacity};
      }
      if(states['2.9'].menu!==1||states['3.1'].pressed!==1||states['3.55'].active!==null)throw Error('Mesocycle handoff incomplete');
      if(states['4.24'].days[0]!=='l'||states['4.5'].days[0]!=='lx'||states['4.8'].days[0]!=='lxv')throw Error('Authentic day sequence incomplete');
      if(states['6.62'].rir!=='1'||states['7.1'].rest!=='1'||states['7.6'].active!==null)throw Error('Authentic parameter phases incomplete');
      return {masterDuration:Number(byId('root').dataset.duration),sampledFrames:768,alignedOverlay:true,unclippedOverlay:true,singleVisibleCard:true,states};
    })()`);
    // Visual QC only; no full-sequence movie is rendered.
    for(const [name,t] of [['mesocycle',2.9],['days',4.5],['exercise',6.62]]){
      await page.evaluate(`window.__timelines.main.totalTime(${t},false);document.getElementById('closing-copy').style.visibility='hidden';`);
      await page.screenshot({path:'overlay-proof/qc-'+name+'.png'});
    }
    const verification={approvedAnimationUnchanged:true,originalMediaUnchanged:true,cardRasterPixelExact:true,fieldRasterPixelExact:true,...result,missingAuthenticStates:provenance.missing};
    fs.writeFileSync('overlay-proof/verification.json',JSON.stringify(verification,null,2));
    console.log(JSON.stringify(verification));
  }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1;});
