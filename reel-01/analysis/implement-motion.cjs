const fs=require('fs'),crypto=require('crypto'),path=require('path');
const root=path.resolve(__dirname,'..');
const files=[];for(const dir of ['assets','proofs']){function walk(p){for(const e of fs.readdirSync(p,{withFileTypes:true})){const q=path.join(p,e.name);if(e.isDirectory())walk(q);else files.push(q)}}walk(path.join(root,dir))}
fs.writeFileSync(path.join(__dirname,'approved-integrity.json'),JSON.stringify(Object.fromEntries(files.map(f=>[path.relative(root,f),crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')])),null,2));
const a=JSON.parse(fs.readFileSync(path.join(__dirname,'motion-analysis.json'),'utf8'));
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace('Fitnode — pruebas de fidelidad 3 s y 7 s','Fitnode — Reel final').replace('// Review stage: two measured static poses only. Full choreography awaits approval.','// Approved layout preserved. Motion fitted to measured reference curves.').replace('id="closing-copy" class="clip" data-start="5.5" data-duration="4.5"','id="closing-copy" class="clip" data-start="5.25" data-duration="4.75"');
const motion=`
const measured=${JSON.stringify(a.curves)};
// Evaluate the measured cubic Bezier paths directly as seek-safe GSAP eases.
function measuredEase(path){
 const n=path.match(/-?\\d*\\.?\\d+/g).map(Number), segments=[];let x=0,y=0;
 for(let i=2;i<n.length;i+=6){segments.push([x,y,...n.slice(i,i+6)]);x=n[i+4];y=n[i+5];}
 const cubic=(a,b,c,d,t)=>{const u=1-t;return u*u*u*a+3*u*u*t*b+3*u*t*t*c+t*t*t*d;};
 return p=>{if(p<=0)return 0;if(p>=1)return 1;const s=segments.find(s=>p<=s[6])||segments.at(-1);let lo=0,hi=1;for(let i=0;i<24;i++){let t=(lo+hi)/2;if(cubic(s[0],s[2],s[4],s[6],t)<p)lo=t;else hi=t;}return cubic(s[1],s[3],s[5],s[7],(lo+hi)/2);};
}
const tl=gsap.timeline({paused:true});
tl.set('#logo-art',{x:0,y:0,scale:1,transformOrigin:'0 0'},0);
for(const role of ['coach','client']){
 const c=measured[role],phone='#phone-'+role+'-object',label=role==='coach'?'#coach-label':'#client-label';
 const shift=role==='client'?0.0666666667:0;
 const base=c.phoneFloat.find(s=>s.t===3).value, labelBase=c.labelFloat.find(s=>s.t===3).value;
 const e=c.phoneEntranceVisible,le=c.labelEntrance,ee=measuredEase(le.gsapCustomEasePath);
 const start=le.start+shift, join=e.start+shift, end=e.end+shift, fraction=(e.start-le.start)/(le.end-le.start);
 tl.set(phone,{y:800,opacity:1},0);
 tl.to(phone,{y:e.from-base,duration:join-start,ease:p=>ee(p*fraction)/ee(fraction)},start);
 tl.to(phone,{y:e.to-base,duration:end-join,ease:measuredEase(e.gsapCustomEasePath)},join);
 tl.set(label,{y:le.from-labelBase,opacity:1},0);
 tl.to(label,{y:le.to-labelBase,duration:le.end-le.start,ease:ee},start);
 // A gentle upward arc, anchored exactly to the approved pose at t=3.
 for(const [selector,samples,b] of [[phone,c.phoneFloat,base],[label,c.labelFloat,labelBase]]){
   const knots=[{t:end,value:samples[0].value},...samples.filter(s=>s.t>=2 && (Math.abs(s.t*2-Math.round(s.t*2))<1e-8))];
   for(let i=1;i<knots.length;i++)tl.to(selector,{y:knots[i].value-b,duration:knots[i].t-knots[i-1].t,ease:'sine.inOut'},knots[i-1].t);
 }
 for(const [selector,curve,b] of [[phone,c.phoneExit,base],[label,c.labelExit,labelBase]]){
   tl.to(selector,{y:curve.from-b,duration:curve.start-4,ease:'sine.inOut'},4);
   tl.to(selector,{y:curve.to-b,duration:curve.end-curve.start,ease:measuredEase(curve.gsapCustomEasePath)},curve.start);
   tl.to(selector,{opacity:0,duration:0.55,ease:'power1.in'},curve.end-0.55);
 }
}
tl.fromTo('#phone-shadow-track img',{opacity:0},{opacity:1,duration:0.8,ease:'sine.out'},0.7);
tl.to('#phone-shadow-track img',{opacity:0,duration:0.8,ease:'sine.inOut'},4.15);
tl.fromTo('#hero-subtitle',{y:39,opacity:0},{y:0,opacity:1,duration:0.5,ease:'power2.out'},0);
tl.to('#coming-soon',{opacity:1,duration:0.2},0.1);
tl.to('#coming-soon',{opacity:0,duration:0.25},1);
tl.to('#coming-soon',{opacity:1,duration:0.15},4.4);
tl.to('#coming-soon',{opacity:0,duration:0.3},5.05);
tl.to('#hero-line-1,#hero-line-2,#hero-subtitle',{opacity:0,duration:0.4,ease:'sine.inOut'},4.95);
const logoKnots=[[4.958333,0],[5,15],[5.125,61],[5.25,147],[5.375,207],[5.5,237],[5.625,250],[5.75,255]];
// Smooth monotone interpolation through measured logo positions.
function smoothSamples(knots){const d=knots.slice(1).map((k,i)=>(k[1]-knots[i][1])/(k[0]-knots[i][0]));const m=knots.map((k,i)=>i===0?0:i===knots.length-1?0:d[i-1]*d[i]<=0?0:2*d[i-1]*d[i]/(d[i-1]+d[i]));return p=>{const t=knots[0][0]+p*(knots.at(-1)[0]-knots[0][0]);let i=0;while(i<knots.length-2&&t>knots[i+1][0])i++;const h=knots[i+1][0]-knots[i][0],u=(t-knots[i][0])/h;return ((2*u**3-3*u*u+1)*knots[i][1]+(u**3-2*u*u+u)*h*m[i]+(-2*u**3+3*u*u)*knots[i+1][1]+(u**3-u*u)*h*m[i+1])/255;};}
tl.to('#logo-art',{...PROOF_POSES.closing.logo,duration:5.75-4.958333,ease:smoothSamples(logoKnots)},4.958333);
tl.fromTo('#closing-title,#closing-subtitle',{y:155,opacity:0},{y:0,opacity:1,duration:0.833333,ease:'power3.out',immediateRender:false},5.25);
window.__timelines['main']=tl;`;
html=html.replace(/const tl=gsap.timeline\(\{paused:true\}\);[\s\S]*?window\.__timelines\['main'\]=tl;/,motion);
fs.writeFileSync(path.join(root,'index.html'),html);
