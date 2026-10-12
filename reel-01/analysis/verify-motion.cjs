const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/package.json');
(async()=>{
const master=fs.readFileSync('index.html','utf8');
const proofPath=fs.existsSync('motion-proof/entry.html')?'motion-proof/entry.html':'motion-proof/entry.html.txt';
const normalized=master.replaceAll('assets/','../assets/').replaceAll('data-duration="10"','data-duration="2"').replaceAll('data-duration="5.5"','data-duration="2"').replace('data-start="5.25" data-duration="4.75"','data-start="2" data-duration="0"');
if(normalized!==fs.readFileSync(proofPath,'utf8'))throw Error('Approved entry code differs from the master');
const root=process.cwd(),server=http.createServer((request,response)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(request.url.split('?')[0]));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){response.writeHead(404).end();return;}
 const type={'.html':'text/html; charset=utf-8','.js':'text/javascript','.woff2':'font/woff2','.png':'image/png'}[path.extname(file)]||'application/octet-stream';
 response.writeHead(200,{'Content-Type':type});fs.createReadStream(file).pipe(response);
});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await req('puppeteer-core').launch({executablePath:'C:/Users/aweis/.cache/puppeteer/chrome-headless-shell/win64-152.0.7977.75/chrome-headless-shell-win64/chrome-headless-shell.exe',headless:true});
try{const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width:1080,height:1920});await page.evaluateOnNewDocument('window.__timelines={};');await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');await page.waitForFunction('Boolean(window.__timelines?.main)',{timeout:10000}).catch(async e=>{throw Error(JSON.stringify(await page.evaluate('({url:location.href,ready:document.readyState,gsap:typeof gsap,registry:window.__timelines,fonts:document.fonts.status})'))+' '+errors.join('\n')+' '+e.message)});
const results=await page.evaluate(()=>{const tl=window.__timelines.main;const initialScreens=[...document.querySelectorAll('.screen-plane')].map(e=>e.style.transform);let last=Infinity,reversals=0,screenChanges=0;for(let n=1;n<=120;n++){tl.seek(n/60);const y=+gsap.getProperty('#phone-client-object','y');if(y>last+0.001)reversals++;last=y;if([...document.querySelectorAll('.screen-plane')].some((e,i)=>e.style.transform!==initialScreens[i]))screenChanges++;}
const poses={};for(const t of [3,7,9.999]){tl.seek(t);poses[t]=Object.fromEntries(['#phone-coach-object','#phone-client-object','#logo-art','#closing-title','#closing-subtitle'].map(s=>[s,Object.fromEntries(['x','y','rotation','rotationX','rotationY','scale','opacity'].map(p=>[p,gsap.getProperty(s,p)]))]));}return {reversals,screenChanges,poses};});
const hashes=JSON.parse(fs.readFileSync('analysis/approved-integrity.json'));results.modifiedAssetsOrProofs=Object.keys(hashes).filter(p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')!==hashes[p]);
results.approvedEntryCodeMatch=true;
if(results.reversals||results.screenChanges||results.modifiedAssetsOrProofs.length)throw Error('Motion or asset integrity verification failed: '+JSON.stringify(results));
const at3=results.poses[3];for(const id of ['#phone-coach-object','#phone-client-object'])for(const prop of ['x','y','rotation','rotationX','rotationY'])if(Math.abs(Number(at3[id][prop]))>0.001)throw Error('Approved t=3 phone pose changed');
if(JSON.stringify(results.poses[7])!==JSON.stringify(results.poses[9.999]))throw Error('Closing is not static');
fs.writeFileSync('motion-proof/verification.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1});
