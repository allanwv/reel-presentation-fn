const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/package.json'),sharp=req('sharp');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const normalize=s=>s.replace(/^<script src="assets\/ui\/floating\/day-taps.js"><\/script>\r?\n/m,'').replace(/<div id="days-card"[\s\S]*?(?=<div id="exercise-card")/,'DAYS_CONTENT\n').replace(/const days=cards.add[\s\S]*?(?=const exercise=cards.add)/,'DAYS_MOTION\n');
 if(normalize(fs.readFileSync('tap-proof/before-taps.html.txt','utf8'))!==normalize(fs.readFileSync('index.html','utf8')))throw Error('Composition outside days changed');
 if(!fs.readFileSync('assets/ui/floating/floating-cards.js').equals(fs.readFileSync('tap-proof/floating-cards.before.js.txt')))throw Error('Approved floating-card engine changed');
 for(const [file,expected]of Object.entries(JSON.parse(fs.readFileSync('analysis/approved-integrity.json','utf8'))))if(hash(fs.readFileSync(file))!==expected)throw Error('Approved asset changed: '+file);
 const dir='assets/ui/floating/day-taps',p=JSON.parse(fs.readFileSync(dir+'/provenance.json','utf8'));
 for(const [file,expected]of Object.entries(p.sourceHashes))if(hash(fs.readFileSync(file))!==expected)throw Error('Original circle media changed');
 const initial=await sharp({create:{width:1440,height:340,channels:4,background:'#fff'}}).composite([{input:dir+'/background.png'},...p.positions.map(pos=>({input:dir+'/'+pos.name+'-'+(pos.initial?'selected':'empty')+'.png',left:Math.round(pos.left*6),top:Math.round(pos.top*6)})),{input:'assets/ui/floating/days-original.png'}]).removeAlpha().raw().toBuffer();
 const original=await sharp('assets/ui/floating/days-original.png').removeAlpha().raw().toBuffer();
 if(!initial.equals(original))throw Error('Initial day surface no longer matches original screenshot');
 const root=process.cwd(),server=http.createServer((request,response)=>{
   const file=path.resolve(root,'.'+decodeURIComponent(request.url.split('?')[0]));
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){response.writeHead(404).end();return;}
   response.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'text/plain'});fs.createReadStream(file).pipe(response);
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await req('puppeteer-core').launch({executablePath:'C:/Users/aweis/.cache/puppeteer/chrome-headless-shell/win64-152.0.7977.75/chrome-headless-shell-win64/chrome-headless-shell.exe',headless:true});
 try{
   const page=await browser.newPage();await page.setViewport({width:1080,height:1920});await page.evaluateOnNewDocument('window.__timelines={};');
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction('Boolean(window.__timelines?.main)');
   await page.evaluate('Promise.all([...document.images].map(img=>img.decode()))');
   let first;const sheets=[];
   const times=[3.88,3.96,4,4.035,4.10,4.20,4.28,4.355,4.42,4.60,4.675,4.80,4.91];
   for(const t of times){
     await page.evaluate(`(()=>{window.__timelines.main.totalTime(${t},false);document.getElementById('day-qc')?.remove();const c=document.getElementById('floating-days-card').cloneNode(true);c.id='day-qc';for(const n of c.querySelectorAll('[id]'))n.removeAttribute('id');Object.assign(c.style,{position:'absolute',left:'0',top:'0',width:'240px',height:'56.6666666667px',transform:'scale(3)',transformOrigin:'0 0',opacity:'1',zIndex:'9999'});document.body.appendChild(c);})()`);
     const png=Buffer.from(await page.screenshot({clip:{x:0,y:0,width:720,height:170}})),raw=await sharp(png).ensureAlpha().raw().toBuffer();
     if(!first)first=raw;
     for(let y=0;y<170;y++)for(let x=0;x<720;x++){
       // Exclude the seven circle tiles, where change is intentional.
       if(p.positions.some(pos=>x>=Math.floor(pos.left*3)-2&&x<=Math.ceil(pos.left*3+78)+2&&y>=Math.floor(pos.top*3)-2&&y<=Math.ceil(pos.top*3+78)+2))continue;
       const i=(y*720+x)*4;
       if(!first.subarray(i,i+4).equals(raw.subarray(i,i+4)))throw Error('Background pixel flickered at '+t+' s');
     }
     if([3.88,4.035,4.20,4.355,4.42,4.675,4.80].includes(t))sheets.push(png);
   }
   const final=await page.evaluate(`(()=>{const tl=window.__timelines.main;document.getElementById('day-qc')?.remove();for(let n=1;n<=768;n++){tl.totalTime(n/60,false);const d=document.getElementById('days-card'),f=document.getElementById('floating-days-card');if(Number(d.style.opacity)+Number(f.style.opacity)!==1)throw Error('Duplicate day surface');}tl.totalTime(5.2,false);const values=[...document.querySelectorAll('#days-card .ui-day-selected')].filter(n=>Number(getComputedStyle(n).opacity)===1).map(n=>n.parentElement.dataset.day);if(values.join(',')!=='l,x,v')throw Error('Wrong final day selection');for(const day of document.querySelectorAll('#days-card .ui-day'))if(Number(gsap.getProperty(day,'scale'))!==1||Number(gsap.getProperty(day,'y'))!==0)throw Error('Tap did not settle');return values;})()`);
   await sharp({create:{width:720,height:sheets.length*170,channels:4,background:'#fff'}}).composite(sheets.map((input,i)=>({input,left:0,top:i*170}))).png().toFile('tap-proof/taps-contact-sheet.png');
   const result={approvedCompositionUnchanged:true,initialDayPixelsExact:true,backgroundPixelIdenticalAcrossSamples:times,finalSelected:final,singleVisibleDaySurface:true,duration:12.8};
   fs.writeFileSync('tap-proof/verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(error=>{console.error(error);process.exitCode=1;});
