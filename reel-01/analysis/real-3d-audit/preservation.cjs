// Read-only preservation capture. Production HTML, helpers and media are never modified.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),http=require('http');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/package.json');
const phase=process.argv[2]||'before',out='analysis/real-3d-audit';
if(!['before','after'].includes(phase))throw Error('Use before or after');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const baseline=fs.readFileSync('real-3d-proof/before-migration.html.txt','utf8');
 const html=phase==='before'?baseline:fs.readFileSync('index.html','utf8');
 const duration=Number(html.match(/id="root"[^>]*data-duration="([\d.]+)"/)?.[1]);
 if(!Number.isFinite(duration))throw Error('Root duration not found');
 const mediaHashes=Object.fromEntries(walk('assets').filter(f=>/\.(png|jpg|jpeg|webp|svg|mp4|woff2)$/i.test(f)).map(f=>[f.replaceAll('\\','/'),sha(fs.readFileSync(f))]));
 const root=process.cwd(),server=http.createServer((q,r)=>{const url=decodeURIComponent(q.url.split('?')[0]);if(url==='/audit.html'){r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end(html);return;}const f=path.resolve(root,'.'+url);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)){r.writeHead(404).end();return;}r.writeHead(200,{'Content-Type':({'.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'})[path.extname(f)]||'text/plain'});fs.createReadStream(f).pipe(r);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await req('puppeteer-core').launch({executablePath:'C:/Users/aweis/.cache/puppeteer/chrome-headless-shell/win64-152.0.7977.75/chrome-headless-shell-win64/chrome-headless-shell.exe',headless:true});
  const page=await browser.newPage();await page.setViewport({width:1080,height:1920});await page.evaluateOnNewDocument('window.__timelines={};');const runtimeErrors=[];page.on('pageerror',e=>runtimeErrors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/audit.html');await page.waitForFunction('Boolean(window.__timelines?.main)');await page.evaluate('Promise.all([...document.images].map(n=>n.decode()))');
  const result=await page.evaluate(`(()=>{
   const tl=window.__timelines.main,duration=${duration},times=[.01,.32,.8,1.5,1.6,2.1,2.2,2.8,3.55,4.8,5.2,5.62,5.98,6.34,6.7,7.8,7.92,8.35,8.61,9,9.2,9.5,10.25,10.53,10.55,11.65,13.15,13.17,13.32,13.97,14.2,15.53,16.28,16.83,17.5,duration-.01].filter(t=>t>=0&&t<duration),snapshots={};
   const ids=['logo-art','hero-line-1','hero-line-2','hero-subtitle','coming-soon','closing-title','closing-subtitle','coach-update-button','coach-update-button-disabled','coach-snackbar','fitnode-notification','client-finish-button','client-workout-loading-overlay','client-completion','client-celebration'];
   const protectedNodes=()=>[...ids.map(id=>document.getElementById(id)).filter(Boolean),document.querySelector('#phone-shadow-track img'),...document.querySelectorAll('.ui-card,.ui-card *, .floating-card,.floating-card *')].filter(Boolean);
   const snap=()=>protectedNodes().map((n,i)=>({key:n.id||n.getAttribute('src')||n.tagName+':'+i,style:n.style.cssText,opacity:getComputedStyle(n).opacity}));
   tl.totalTime(duration-.001,false);for(const t of times){tl.totalTime(t,false);snapshots[t]=snap();}
   const reverseErrors=[];for(const t of [...times].reverse()){tl.totalTime(t,false);if(JSON.stringify(snap())!==JSON.stringify(snapshots[t]))reverseErrors.push(t);}
   const clips=[...document.querySelectorAll('.clip')].map(n=>({id:n.id,start:n.dataset.start,duration:n.dataset.duration,track:n.dataset.trackIndex}));
   const protectedTweens=tl.getChildren(false,true,false).map(t=>({targets:t.targets().map(n=>n.id).filter(Boolean),start:t.startTime(),duration:t.duration(),ease:typeof t.vars.ease==='string'?t.vars.ease:null})).filter(t=>t.targets.some(id=>ids.includes(id)||id.includes('floating-')||id.includes('card')));
   return{duration,times,snapshots,reverseErrors,clips,protectedTweens};
  })()`);
  const verification={phase,baselineSha256:sha(Buffer.from(baseline)),htmlSha256:sha(Buffer.from(html)),mediaHashes,runtimeErrors,...result};
  if(phase==='after'){
   const before=JSON.parse(fs.readFileSync(out+'/before.json','utf8')),changes=[];
   for(const[f,h]of Object.entries(before.mediaHashes))if(mediaHashes[f]!==h)changes.push('Original media changed:'+f);
   if(before.duration!==result.duration)changes.push('Duration changed');
   for(const t of before.times)if(JSON.stringify(before.snapshots[t])!==JSON.stringify(result.snapshots[t]))changes.push('Protected styles/states differ at:'+t);
   if(JSON.stringify(before.clips)!==JSON.stringify(result.clips))changes.push('Clip timings changed');
   if(JSON.stringify(before.protectedTweens)!==JSON.stringify(result.protectedTweens))changes.push('Protected tween timings/eases changed');
   verification.preservationErrors=changes;
  }
  fs.writeFileSync(out+'/'+phase+'.json',JSON.stringify(verification,null,2));console.log(JSON.stringify({phase,duration,mediaCount:Object.keys(mediaHashes).length,runtimeErrors,reverseErrors:result.reverseErrors,preservationErrors:verification.preservationErrors}));
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
