const fs=require('fs');
const p='index.html';let h=fs.readFileSync(p,'utf8');
fs.writeFileSync('analysis/before-motion-refinement.html',h);
const begin=h.indexOf("for(const role of ['coach','client']){",h.indexOf('const tl=gsap.timeline'));
const end=h.indexOf("tl.fromTo('#phone-shadow-track",begin);
h=h.slice(0,begin)+`// One transform owner per rigid phone. Screen homographies are never animated.
// Replace the noisy tracked entrance and its velocity discontinuity with one curve.
function floatEase(startTime,endTime,midTime,from,to){
 const mid=(midTime-startTime)/(endTime-startTime),v=from/(from-to);
 // Monotone Hermite arc: zero endpoint velocity, continuous velocity through t=3.
 const slope=Math.min(v/mid,(1-v)/(1-mid));
 return p=>{const first=p<=mid,u=first?p/mid:(p-mid)/(1-mid),a=first?0:v,b=first?v:1,span=first?mid:1-mid,ma=first?0:slope,mb=first?slope:0;return (2*u*u*u-3*u*u+1)*a+(u*u*u-2*u*u+u)*span*ma+(-2*u*u*u+3*u*u)*b+(u*u*u-u*u)*span*mb;};
}
for(const role of ['coach','client']){
 const c=measured[role],right=role==='client',phone='#phone-'+role+'-object',label=right?'#client-label':'#coach-label';
 const start=right?0.32:0.17,end=right?1.87:1.72;
 const base=c.phoneFloat.find(s=>s.t===3).value,labelBase=c.labelFloat.find(s=>s.t===3).value;
 const floatFrom=right?5:6;
 tl.set(phone,{y:805,x:right?18:-18,rotationX:9,rotationY:right?-13:15,rotation:right?3:-3,transformPerspective:1800,force3D:false,opacity:1},0);
 tl.to(phone,{y:floatFrom,x:0,rotationX:0,rotationY:0,rotation:0,duration:end-start,ease:'power3.out'},start);
 tl.set(label,{y:805,opacity:0},0);
 tl.to(label,{y:floatFrom,opacity:1,duration:end-start,ease:'power3.out'},start);
 for(const [selector,curve,b] of [[phone,c.phoneExit,base],[label,c.labelExit,labelBase]]){
   tl.to(selector,{y:curve.from-b,duration:curve.start-end,ease:floatEase(end,curve.start,3,floatFrom,curve.from-b)},end);
   tl.to(selector,{y:curve.to-b,duration:curve.end-curve.start,ease:measuredEase(curve.gsapCustomEasePath)},curve.start);
   tl.to(selector,{opacity:0,duration:0.55,ease:'power1.in'},curve.end-0.55);
 }
}
`+h.slice(end);
h=h.replace(/tl\.fromTo\('#hero-subtitle'[\s\S]*?(?=tl\.to\('#hero-line-1,#hero-line-2,#hero-subtitle')/,`tl.fromTo('#logo-art',{opacity:0,y:12},{opacity:1,y:0,duration:0.42,ease:'power2.out'},0);
tl.fromTo('#hero-line-1,#hero-line-2',{opacity:0,y:16},{opacity:1,y:0,duration:0.6,ease:'power2.out'},0.24);
tl.fromTo('#hero-subtitle',{opacity:0,y:12},{opacity:1,y:0,duration:0.55,ease:'power2.out'},0.42);
tl.set('#coming-soon',{opacity:0},0);
`);
fs.writeFileSync(p,h);
// Two-second render entry only; the editable master remains ten seconds.
fs.mkdirSync('motion-proof',{recursive:true});
fs.writeFileSync('motion-proof/entry.html',h.replaceAll('assets/','../assets/').replaceAll('data-duration="10"','data-duration="2"').replaceAll('data-duration="5.5"','data-duration="2"').replace('data-start="5.25" data-duration="4.75"','data-start="2" data-duration="0"'));
