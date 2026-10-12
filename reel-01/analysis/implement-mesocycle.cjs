const fs=require('fs');
let h=fs.readFileSync('index.html','utf8');
fs.writeFileSync('mesocycle-proof/before-mesocycle.html.txt',h);
h=h.replace('</style>',`
/* Independent raster components, inside the unchanged projective screen plane. */
.focus-rig { position:absolute; inset:0; width:720px; height:1280px; }
#coach-focus,#coach-label-focus { transform-origin:200px 520px; }
#client-focus,#client-label-focus { transform-origin:525px 520px; }
#phone-coach { z-index:5; }
#phone-client { z-index:4; }
#phone-labels { z-index:6; }
#mesocycle-card { position:absolute; left:0; top:55.6666666667px; width:240px; height:35px; transform-origin:50% 50%; }
#mesocycle-card-surface { display:block; width:240px; height:35px; }
#mesocycle-menu { position:absolute; left:79.1111111111px; top:11.1111111111px; width:105.7777777778px; height:75.5555555556px; opacity:0; transform-origin:50% 0; }
#mesocycle-menu img { position:absolute; inset:0; width:100%; height:100%; }
#mesocycle-menu-pressed { opacity:0; }
</style>`);
for(const role of ['coach','client']){
 h=h.replace('<div id="phone-'+role+'-object" class="phone-object">','<div id="'+role+'-focus" class="focus-rig">\n<div id="phone-'+role+'-object" class="phone-object">');
 const shell=new RegExp('(<img class="phone-shell" src="assets/phone-'+role+'-reference.png"[^>]*>\\s*</div>\\s*</div>)');
 h=h.replace(shell,'$1\n</div>');
 const labelId=role==='coach'?'coach-label':'client-label';
 h=h.replace(new RegExp('(<svg id="'+labelId+'"[^>]*>[\\s\\S]*?</svg>)'),'<div id="'+role+'-label-focus" class="focus-rig">$1</div>');
}
h=h.replace(/<div id="screen-coach" class="screen-plane">[\s\S]*?<\/div>/,`<div id="screen-coach" class="screen-plane">
<img class="authentic-screen" src="assets/ui/mesocycle/screen-with-card-aperture.png" alt="Captura original con apertura transparente para su card independiente">
<div id="mesocycle-card" data-label="Card mesociclo · píxeles originales">
<img id="mesocycle-card-surface" src="assets/ui/mesocycle/card-closed.png" alt="Meso octubre · 4 sem">
<div id="mesocycle-menu" data-label="Selector auténtico · abierto y pulsado">
<img id="mesocycle-menu-open" src="assets/ui/mesocycle/menu-open.png" alt="Selector abierto original: Independiente, Meso octubre, 4 semanas">
<img id="mesocycle-menu-pressed" src="assets/ui/mesocycle/menu-pressed.png" alt="Pulsación original sobre Meso octubre">
</div>
</div>
</div>`);
// Extend the existing master; later interaction slots intentionally retain authentic static UI.
h=h.replaceAll('data-duration="10"','data-duration="12.8"').replaceAll('data-duration="5.5"','data-duration="11.82"').replace('data-start="5.25" data-duration="4.75"','data-start="11.5666666667" data-duration="1.2333333333"');
h=h.replace('for(const [selector,curve,b] of [[phone,c.phoneExit,base],[label,c.labelExit,labelBase]]){',`for(const [selector,sourceCurve,b] of [[phone,c.phoneExit,base],[label,c.labelExit,labelBase]]){
   const curve={...sourceCurve,start:sourceCurve.start+6.3166666667,end:sourceCurve.end+6.3166666667};`);
h=h.replace("ease:'sine.inOut'},4.15)","ease:'sine.inOut'},10.4666666667)");
h=h.replace("ease:'sine.inOut'},4.8)","ease:'sine.inOut'},11.1166666667)");
h=h.replace('},4.958333);','},11.275);');
h=h.replace('immediateRender:false},5.25);','immediateRender:false},11.5666666667);');
h=h.replace("window.__timelines['main']=tl;",`
// Focus has its own parent transform: approved entrance keeps its sole transform owner.
tl.to('#coach-focus,#coach-label-focus',{x:100,scale:1.30,duration:0.8,ease:'sine.inOut'},1.6);
tl.to('#client-focus,#client-label-focus',{x:50,y:30,scale:0.88,duration:0.8,ease:'sine.inOut'},1.6);
tl.to('#mesocycle-card',{scale:1.12,duration:0.22,ease:'sine.inOut'},2.4);
tl.fromTo('#mesocycle-menu',{opacity:0,y:-2},{opacity:1,y:0,duration:0.14,ease:'power2.out',immediateRender:false},2.66);
tl.to('#mesocycle-menu-pressed',{opacity:1,duration:0.08,ease:'sine.inOut'},3.0);
tl.to('#mesocycle-menu',{opacity:0,y:-1,duration:0.12,ease:'sine.inOut'},3.17);
tl.to('#mesocycle-card',{scale:1,duration:0.25,ease:'sine.inOut'},3.3);
tl.to('#coach-focus,#coach-label-focus,#client-focus,#client-label-focus',{x:0,y:0,scale:1,duration:1.2,ease:'sine.inOut'},7.6);
window.__timelines['main']=tl;`);
fs.writeFileSync('index.html',h);
// A temporary two-second seek window of the master, not a second authored scene.
let proof=h.replaceAll('assets/','../assets/').replaceAll('data-duration="12.8"','data-duration="2"').replaceAll('data-duration="11.82"','data-duration="2"').replace('data-start="11.5666666667" data-duration="1.2333333333"','data-start="2" data-duration="0"');
proof=proof.replace("window.__timelines['main']=tl;",`const windowTimeline=gsap.timeline({paused:true,onUpdate:()=>tl.totalTime(1.6+windowTimeline.time(),false)});
const windowClock={value:0};
windowTimeline.to(windowClock,{value:2,duration:2,ease:'none'},0);
tl.totalTime(1.6,false);
window.__timelines['main']=windowTimeline;`);
fs.writeFileSync('mesocycle-proof/entry.html',proof);
console.log('Master 12.8 s; authentic mesocycle layers integrated. Proof seeks only 1.6–3.6 s.');
