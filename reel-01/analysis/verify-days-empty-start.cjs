const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/110f701c48e68d66/node_modules/hyperframes/package.json'),sharp=req('sharp');
const root=path.resolve(__dirname,'..'),proof=path.join(root,'days-empty-start-proof'),provenance=JSON.parse(fs.readFileSync(path.join(root,'assets/ui/floating/day-taps/provenance.json'),'utf8'));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async()=>{
 fs.mkdirSync(proof,{recursive:true});
 for(const[file,h]of Object.entries(provenance.sourceHashes))if(hash(path.join(root,file))!==h)throw Error('Original day source changed: '+file);
 const server=http.createServer((request,response)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(request.url.split('?')[0]));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){response.writeHead(404).end();return;}
  response.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(response);
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await req('puppeteer-core').launch({executablePath:'C:/Users/aweis/.cache/puppeteer/chrome-headless-shell/win64-152.0.7977.75/chrome-headless-shell-win64/chrome-headless-shell.exe',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage();await page.setViewport({width:1080,height:1920});await page.evaluateOnNewDocument('window.__timelines={};');
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction('Boolean(window.__timelines?.main)');await page.evaluate('Promise.all([...document.images].map(img=>img.decode()))');
  const times=[0,.5,1,1.6,2.8,3.59,3.6,3.9,3.96,4.0,4.025,4.10,4.28,4.345,4.45,4.60,4.665,4.9,5.2,7.8];
  const samples=await page.evaluate(times=>{
   const tl=window.__timelines.main,states=[];
   for(const t of times){tl.totalTime(t,false);const surfaces=['days-card','floating-days-card'].map(id=>{const c=document.getElementById(id);return{id,originalStill:c.querySelectorAll('.ui-days-initial').length,legacyFlags:c.querySelectorAll('[data-initial-selected="true"]').length,opacity:Number(getComputedStyle(c).opacity),selected:[...c.querySelectorAll('.ui-day-selected')].map(n=>({day:n.parentElement.dataset.day,opacity:Number(getComputedStyle(n).opacity),reveal:parseFloat(getComputedStyle(n).clipPath.match(/circle\(([-.\d]+)/)?.[1]||'0')}))};});states.push({t,surfaces});}
   // Forward and reverse seeks must always derive from the same initial state.
   for(const t of [...times].reverse()){tl.totalTime(t,false);for(const id of ['days-card','floating-days-card']){const c=document.getElementById(id);for(const n of c.querySelectorAll('.ui-day-selected')){const tap={l:3.96,x:4.28,v:4.60}[n.parentElement.dataset.day];if((tap===undefined||t<tap+.065-1e-7)&&Number(getComputedStyle(n).opacity)!==0)throw Error('Preselected day after reverse seek at '+t);}}}
   for(let i=0;i<=312;i++){const t=i/60;tl.totalTime(t,false);const d=document.getElementById('days-card'),f=document.getElementById('floating-days-card');if(Number(getComputedStyle(d).opacity)+Number(getComputedStyle(f).opacity)!==1)throw Error('Duplicated or missing card surface '+t);for(const c of[d,f])for(const n of c.querySelectorAll('.ui-day-selected')){const tap={l:3.96,x:4.28,v:4.60}[n.parentElement.dataset.day];if((tap===undefined||t<tap+.065-1e-7)&&Number(getComputedStyle(n).opacity)!==0)throw Error('Day became selected early '+t);}}
   tl.totalTime(5.2,false);for(const id of ['days-card','floating-days-card']){const c=document.getElementById(id),selected=[...c.querySelectorAll('.ui-day-selected')].filter(n=>Number(getComputedStyle(n).opacity)===1).map(n=>n.parentElement.dataset.day);if(selected.join(',')!=='l,x,v')throw Error('Final selection incorrect');for(const day of c.querySelectorAll('.ui-day'))if(gsap.getProperty(day,'scale')!==1||gsap.getProperty(day,'y')!==0)throw Error('Tap did not settle');}
   return states;
  },times);
  for(const sample of samples)for(const c of sample.surfaces){if(c.originalStill||c.legacyFlags)throw Error('Legacy preselection still exists');}
  const snapshots=[],bgTimes=[3.88,3.96,4.035,4.1,4.20,4.28,4.355,4.42,4.60,4.675,4.80,4.91];let background;
  for(const t of [1.6,...bgTimes,5.2]){
   await page.evaluate(t=>{window.__timelines.main.totalTime(t,false);document.getElementById('days-empty-qc')?.remove();const c=document.getElementById(t<3.6||t>=5.2?'days-card':'floating-days-card').cloneNode(true);c.id='days-empty-qc';for(const n of c.querySelectorAll('[id]'))n.removeAttribute('id');Object.assign(c.style,{position:'absolute',left:'0',top:'0',width:'240px',height:'56.6666666667px',transform:'scale(3)',transformOrigin:'0 0',opacity:'1',zIndex:'99999',boxShadow:'none',borderRadius:'0'});const face=c.querySelector('.floating-face');if(face)face.style.borderRadius='0';document.body.appendChild(c);},t);
   const png=Buffer.from(await page.screenshot({clip:{x:0,y:0,width:720,height:170}})),raw=await sharp(png).ensureAlpha().raw().toBuffer();
   if(bgTimes.includes(t)){
    if(!background)background=raw;
    for(let y=0;y<170;y++)for(let x=0;x<720;x++){
     if(provenance.positions.some(p=>x>=Math.floor(p.left*3)-3&&x<=Math.ceil(p.left*3+78)+3&&y>=Math.floor(p.top*3)-3&&y<=Math.ceil(p.top*3+78)+3))continue;
     const p=(y*720+x)*4;if(!background.subarray(p,p+4).equals(raw.subarray(p,p+4)))throw Error('Background flicker '+t);
    }
   }
   if([1.6,3.88,4.20,4.42,4.80,5.2].includes(t)){const file=path.join(proof,'days-'+String(t).replace('.','_')+'.png');fs.writeFileSync(file,png);snapshots.push({input:png,left:0,top:(snapshots.length)*170});}
  }
  await sharp({create:{width:720,height:snapshots.length*170,channels:4,background:'#fff'}}).composite(snapshots).png().toFile(path.join(proof,'contact-sheet.png'));
  const result={samples,emptyFromFirstFrame:true,legacyBakedSurfaceRemoved:true,legacySelectionFlagsRemoved:true,forwardReverseSeeksStable:true,singleVisibleSurfaceEveryFrame:true,finalSelected:['l','x','v'],tapTimes:[3.96,4.28,4.60],tapMotionPreserved:true,backgroundPixelsIdenticalAt:bgTimes,sourceHashesUnchanged:provenance.sourceHashes};
  fs.writeFileSync(path.join(proof,'verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({...result,samples:undefined},null,2));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
