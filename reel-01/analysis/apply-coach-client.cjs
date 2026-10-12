const fs=require('fs');
let html=fs.readFileSync('index.html','utf8');
function replace(from,to){if(!html.includes(from))throw Error('Missing edit anchor: '+from.slice(0,100));html=html.replace(from,to);}
html=html.replaceAll('data-duration="12.8"','data-duration="18"').replaceAll('data-duration="11.82"','data-duration="16.2"');
replace('data-start="11.5666666667" data-duration="1.2333333333"','data-start="15.4916666667" data-duration="2.5083333333"');
replace('src="assets/ui/floating/screen-apertures.png"','src="assets/ui/coach-update/screen-apertures-with-update-hole.png"');
replace('<div id="mesocycle-card" class="ui-card"','<img id="coach-update-button" class="screen-button" src="assets/ui/coach-update/update-enabled.png" alt="Actualizar">\n<div id="mesocycle-card" class="ui-card"');
replace('<div id="screen-client" class="screen-plane"><img class="authentic-screen" src="assets/SCREEN_04_PR_REAL.png" alt="Captura original Asesorado: Piernas Meso oct"></div>',`<div id="screen-client" class="screen-plane">
<img class="authentic-screen" src="assets/ui/client-workout/screen-apertures.png" alt="Captura original Asesorado con aperturas localizadas">
<div id="client-series-card" class="ui-card" data-label="Registro auténtico de series y récord">
<img class="ui-card-surface" src="assets/ui/client-workout/series-card-apertures.png" alt="Series originales">
<div class="client-record-row">
<img class="client-row-pending" src="assets/ui/client-workout/series-row-pending.png" alt="75 kg por 10 repeticiones, pendiente de completar">
<img class="client-row-completed" src="assets/ui/client-workout/series-row-completed.png" alt="Serie completada y récord personal auténtico">
</div>
</div>
<img id="client-finish-button" class="screen-button" src="assets/ui/client-workout/finish-button.png" alt="Terminar Rutina">
</div>`);
replace('<div id="closing-copy" class="clip"',`<div id="client-ui-overlay" class="clip" data-start="0" data-duration="16.2" data-track-index="9" data-label="Series reales Asesorado · overlay frontal">
<div id="client-ui-overlay-focus"><div id="client-ui-overlay-depth"><div id="client-ui-overlay-float"><div id="client-ui-overlay-phone"><div id="client-ui-overlay-plane"></div></div></div></div></div>
</div>
<div id="closing-copy" class="clip"`);
replace('const tl=gsap.timeline({paused:true});',`const tl=gsap.timeline({paused:true});
// Existing closing choreography, compressed only enough for the 1.8-second hold.
const closingTime=t=>14.5+(t-10.4)*.85;`);
replace('const curve={...sourceCurve,start:sourceCurve.start+6.3166666667,end:sourceCurve.end+6.3166666667};',`const oldStart=sourceCurve.start+6.3166666667;
   const curve={...sourceCurve,start:closingTime(oldStart),end:closingTime(sourceCurve.end+6.3166666667)};`);
replace("tl.to(selector,{y:curve.from-b,duration:curve.start-end,ease:floatEase(end,curve.start,3,floatFrom,curve.from-b)},end);", "tl.to(selector,{y:curve.from-b,duration:oldStart-end,ease:floatEase(end,oldStart,3,floatFrom,curve.from-b)},end);");
replace("tl.to(selector,{opacity:0,duration:0.55,ease:'power1.in'},curve.end-0.55);", "tl.to(selector,{opacity:0,duration:.55*.85,ease:'power1.in'},curve.end-.55*.85);");
replace("tl.to('#phone-shadow-track img',{opacity:0,duration:0.8,ease:'sine.inOut'},10.4666666667);", "tl.to('#phone-shadow-track img',{opacity:0,duration:.8*.85,ease:'sine.inOut'},closingTime(10.4666666667));");
replace("tl.to('#hero-line-1,#hero-line-2,#hero-subtitle',{opacity:0,duration:0.28,ease:'sine.inOut'},11.1166666667);", "tl.to('#hero-line-1,#hero-line-2,#hero-subtitle',{opacity:0,duration:.28*.85,ease:'sine.inOut'},closingTime(11.1166666667));");
replace("tl.to('#logo-art',{...PROOF_POSES.closing.logo,duration:5.75-4.958333,ease:smoothSamples(logoKnots)},11.275);", "tl.to('#logo-art',{...PROOF_POSES.closing.logo,duration:(5.75-4.958333)*.85,ease:smoothSamples(logoKnots)},closingTime(11.275));");
replace("tl.fromTo('#closing-title,#closing-subtitle',{y:155,opacity:0},{y:0,opacity:1,duration:0.833333,ease:'power3.out',immediateRender:false},11.5666666667);", "tl.fromTo('#closing-title,#closing-subtitle',{y:155,opacity:0},{y:0,opacity:1,duration:.833333*.85,ease:'power3.out',immediateRender:false},closingTime(11.5666666667));");
replace('z:140,rotation:-2.5,rotationY:-2.5,duration:.50','z:140,rotation:0,rotationY:-4,duration:.50');
replace('y:amplitude,duration:12.8,ease:p=>.5+.5*Math.sin(2*Math.PI*p*12.8/period+phase)', 'y:amplitude,duration:18,ease:p=>.5+.5*Math.sin(2*Math.PI*p*18/period+phase)');
replace("tl.to('#coach-focus,#coach-label-focus,#client-focus,#client-label-focus',{x:0,y:0,scale:1,duration:1.2,ease:'power2.inOut'},7.6);\ntl.to('#coach-depth,#coach-label-depth,#client-depth,#client-label-depth',{z:0,rotation:0,rotationY:0,duration:1.2,ease:'power2.inOut'},7.6);",`// A button stays on the projective screen and compresses as a single rigid object.
function buttonTap(selector,at){
 tl.set(selector,{scale:1,y:0,transformOrigin:'50% 50%',force3D:false},0);
 tl.to(selector,{scale:.985,y:.35,duration:.075,ease:'power2.inOut'},at);
 tl.to(selector,{scale:1,y:0,duration:.18,ease:'power2.out'},at+.075);
}
buttonTap('#coach-update-button',7.8);
// Continuous hand-off: the faster Coach retreat opens a gap before layer order changes.
tl.to('#coach-focus,#coach-label-focus',{x:0,y:0,scale:1,duration:1,ease:'power3.out'},8);
tl.to('#coach-depth,#coach-label-depth',{z:0,rotation:0,rotationY:0,duration:1,ease:'power3.out'},8);
tl.to('#client-focus,#client-label-focus',{x:-95,y:28,scale:1.20,duration:1,ease:'power2.inOut'},8);
tl.to('#client-depth,#client-label-depth',{z:140,rotation:0,rotationY:4,duration:1,ease:'power2.inOut'},8);
tl.set('#phone-client',{zIndex:6},8.26);
// The identical floating-card engine now also follows the right phone's four rigs.
document.querySelector('#client-ui-overlay-plane').style.transform=projectiveMatrix(PHONE_QUADS.client);
const clientCards=FitnodeFloatingCards({timeline:tl,plane:document.querySelector('#client-ui-overlay-plane'),focus:document.querySelector('#client-focus'),depth:document.querySelector('#client-depth'),float:document.querySelector('#client-float'),phone:document.querySelector('#phone-client-object'),overlayFocus:document.querySelector('#client-ui-overlay-focus'),overlayDepth:document.querySelector('#client-ui-overlay-depth'),overlayFloat:document.querySelector('#client-ui-overlay-float'),overlayPhone:document.querySelector('#client-ui-overlay-phone')});
const clientSeries=clientCards.add({id:'client-series-card',box:{left:0,top:250,width:240,height:140},start:9.2,end:12.65,scale:1.35,x:-6,y:-20,travel:.28});
for(const root of [clientSeries.dock,clientSeries.floating]){
 const row=root.querySelector('.client-record-row'),complete=root.querySelector('.client-row-completed');
 tl.set(complete,{opacity:0},0);
 tl.set(row,{scale:1,y:0,transformOrigin:'50% 50%',force3D:false},0);
 tl.to(row,{scale:.985,y:.3,duration:.075,ease:'power2.inOut'},9.85);
 tl.to(complete,{opacity:1,duration:.18,ease:'power1.out'},9.91);
 tl.to(row,{scale:1,y:0,duration:.18,ease:'power2.out'},9.925);
 // The actual 75/10 record receives emphasis; no extra message or metric is drawn.
 tl.to(row,{scale:1.045,y:-.5,duration:.18,ease:'power2.out'},10.65);
 tl.to(row,{scale:1,y:0,duration:.24,ease:'sine.inOut'},11.45);
}
buttonTap('#client-finish-button',12.88);
tl.to('#client-focus,#client-label-focus',{x:0,y:0,scale:1,duration:1.15,ease:'power2.inOut'},13.3);
tl.to('#client-depth,#client-label-depth',{z:0,rotation:0,rotationY:0,duration:1.15,ease:'power2.inOut'},13.3);
tl.set('#phone-client',{zIndex:4},14.5);`);
fs.writeFileSync('index.html',html);
console.log('Extended existing composition to 18s with Coach to Asesorado choreography.');
