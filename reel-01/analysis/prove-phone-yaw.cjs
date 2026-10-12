const fs=require('fs'),path=require('path'),http=require('http'),cp=require('child_process');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/package.json'),sharp=req('sharp');
const out='yaw-proof',root=process.cwd(),ff='C:/Users/aweis/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/ffmpeg.exe';
const server=http.createServer((r,s)=>{const file=path.resolve(root,'.'+decodeURIComponent(r.url.split('?')[0]));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){s.writeHead(404).end();return;}s.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'text/plain');fs.createReadStream(file).pipe(s);});
const label=(text,w=360)=>Buffer.from(`<svg width="${w}" height="42"><rect width="100%" height="100%" fill="#061a2c"/><text x="14" y="28" fill="white" font-family="Arial" font-size="20">${text}</text></svg>`);
(async()=>{
 fs.mkdirSync(out,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await req('puppeteer-core').launch({executablePath:'C:/Users/aweis/.cache/puppeteer/chrome-headless-shell/win64-152.0.7977.75/chrome-headless-shell-win64/chrome-headless-shell.exe',headless:true});
  const p=await browser.newPage();await p.setViewport({width:1080,height:1920});await p.evaluateOnNewDocument('window.__timelines={};');
  await p.goto('http://127.0.0.1:'+server.address().port+'/index.html');await p.waitForFunction('!!window.__timelines.main');
  const seek=t=>p.evaluate(t=>{window.__timelines.main.totalTime(t,false);for(const n of document.querySelectorAll('.clip[data-start]')){const a=Number(n.dataset.start),b=a+Number(n.dataset.duration);n.style.visibility=t>=a&&t<b?'visible':'hidden';}},t);
  const tiles=[],metadata=[];
  for(const[role,times]of [['coach',[1.55,1.90,2.22]],['client',[7.95,8.325,9.02]]]){
   for(let i=0;i<times.length;i++){
    const t=times[i];await seek(t);const file=out+'/'+role+'-'+['antes','durante','final'][i]+'.png';
    const b=Buffer.from(await p.screenshot({path:file}));
    const tile=await sharp({create:{width:360,height:682,channels:4,background:'#061a2c'}}).composite([{input:await sharp(b).resize(360,640).toBuffer(),left:0,top:42},{input:label((role==='coach'?'Coach':'Asesorado')+' '+['antes','durante','final'][i]+' / '+t+' s'),left:0,top:0}]).png().toBuffer();tiles.push(tile);
    metadata.push(await p.evaluate(role=>({role,angle:window.__fitnodePhoneYaw[role].pose.angle,quad:window.__fitnodePhoneYaw[role].projectedQuad(window.__fitnodePhoneYaw[role].pose.angle)}),role));
   }
  }
  await sharp({create:{width:1080,height:1364,channels:4,background:'#061a2c'}}).composite(tiles.map((input,i)=>({input,left:i%3*360,top:Math.floor(i/3)*682}))).png().toFile(out+'/GIROS_ANTES_DURANTE_DESPUES.png');
  // Fixed position, approach scale and float phase: these images isolate orientation alone.
  const isolated=[];
  for(const role of ['coach','client']){
   await seek(role==='coach'?2.22:9.02);
   await p.evaluate(role=>{for(const n of document.querySelectorAll('#reference-space > .clip'))n.style.opacity=n.id==='phone-'+role?'1':'0';},role);
   for(const[stage,angle]of [['Antes',0],['Durante',4.75],['Final',9.5]]){
    await p.evaluate(({role,angle})=>{const y=window.__fitnodePhoneYaw[role];y.pose.angle=(role==='coach'?-1:1)*angle;y.sync();},{role,angle});
    const file=out+'/'+role+'-orientacion-'+angle+'.png';const png=Buffer.from(await p.screenshot({path:file}));
    // Same crop for all three poses of a device; no rescaling to conceal geometry changes.
    const crop=role==='coach'?{left:96,top:760,width:680,height:1160}:{left:342,top:760,width:680,height:1160};
    isolated.push(await sharp({create:{width:408,height:738,channels:4,background:'#061a2c'}}).composite([{input:await sharp(png).extract(crop).resize(408,696).toBuffer(),left:0,top:42},{input:label((role==='coach'?'Coach':'Asesorado')+' '+stage+' / '+angle+' grados',408),left:0,top:0}]).png().toBuffer());
   }
   await p.evaluate(()=>{for(const n of document.querySelectorAll('#reference-space > .clip'))n.style.removeProperty('opacity');});
  }
  await sharp({create:{width:1224,height:1476,channels:4,background:'#061a2c'}}).composite(isolated.map((input,i)=>({input,left:i%3*408,top:Math.floor(i/3)*738}))).png().toFile(out+'/GIROS_ORIENTACION_AISLADA.png');
  // Fresh page restores the actual sequence before recording the two short motion proofs.
  await p.reload();await p.waitForFunction('!!window.__timelines.main');
  for(const[name,start,end]of [['COACH',1.5,2.5],['ASESORADO',7.9,9.3]]){
   const folder=out+'/'+name.toLowerCase()+'-frames';fs.mkdirSync(folder,{recursive:true});const count=Math.round((end-start)*30);
   for(let i=0;i<count;i++){await seek(start+i/30);await sharp(Buffer.from(await p.screenshot())).resize(540,960).png().toFile(folder+'/'+String(i).padStart(3,'0')+'.png');}
   cp.execFileSync(ff,['-y','-v','error','-framerate','30','-i',folder+'/%03d.png','-an','-c:v','libx264','-crf','16','-pix_fmt','yuv420p','-movflags','+faststart',out+'/FITNODE_GIRO_'+name+'.mp4']);
  }
  fs.writeFileSync(out+'/visual-poses.json',JSON.stringify(metadata,null,2));console.log(JSON.stringify({ok:true,poses:metadata,comparison:out+'/GIROS_ANTES_DURANTE_DESPUES.png',orientation:out+'/GIROS_ORIENTACION_AISLADA.png'}));
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
