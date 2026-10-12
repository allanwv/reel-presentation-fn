const fs=require('fs');
let h=fs.readFileSync('index.html','utf8');
fs.writeFileSync('overlay-proof/before-floating.html.txt',h);
h=h.replace('<script src="assets/vendor/gsap.min.js"></script>','<script src="assets/vendor/gsap.min.js"></script>\n<script src="assets/ui/floating/floating-cards.js"></script>\n<link rel="stylesheet" href="assets/ui/floating/floating-cards.css">');
h=h.replace('assets/ui/mesocycle/screen-with-card-aperture.png','assets/ui/floating/screen-apertures.png');
h=h.replace('id="mesocycle-card" data-label','id="mesocycle-card" class="ui-card" data-label').replace('id="mesocycle-card-surface"','id="mesocycle-card-surface" class="ui-card-surface"').replace('id="mesocycle-menu" data-label','id="mesocycle-menu" class="ui-menu" data-label').replace('id="mesocycle-menu-pressed"','id="mesocycle-menu-pressed" class="ui-state-pressed"');
const dayStates=['original','none','l','lx','lxv'].map(name=>'<img id="days-state-'+name+'" class="ui-state" data-state="'+name+'" src="assets/ui/floating/days-'+name+'.png" alt="Estado auténtico de días: '+name+'">').join('\n');
const fieldLeft={series:20,reps:428/6,rir:736/6,rest:174};
const fields=Object.entries(fieldLeft).map(([name,left])=>'<div id="field-'+name+'" class="ui-field" data-field="'+name+'"'+(['series','reps'].includes(name)?' data-missing-state="authentic-focused"':'')+' style="left:'+left+'px"><img src="assets/ui/floating/field-'+name+'-original.png" alt="Parámetro original '+name+'">'+(['rir','rest'].includes(name)?'<img class="ui-field-focused" src="assets/ui/floating/field-'+name+'-focused.png" alt="Foco auténtico '+name+'">':'')+'</div>').join('\n');
const cards='<div id="days-card" class="ui-card" data-label="Días originales · selección L X V">'+dayStates+'</div>\n<div id="exercise-card" class="ui-card" data-label="Ejercicio original · parámetros"><img class="ui-card-surface" src="assets/ui/floating/exercise-field-apertures.png" alt="Componente original del ejercicio">'+fields+'</div>';
h=h.replace('</div>\n</div>\n</div>\n<img class="phone-shell" src="assets/phone-coach-reference.png"','</div>\n</div>\n'+cards+'\n</div>\n<img class="phone-shell" src="assets/phone-coach-reference.png"');
h=h.replace('<div id="closing-copy"',`<div id="ui-overlay" class="clip" data-start="0" data-duration="11.82" data-track-index="8" data-label="Cards originales · overlay frontal">
<div id="ui-overlay-focus"><div id="ui-overlay-phone"><div id="ui-overlay-plane"></div></div></div>
</div>
<div id="closing-copy"`);
const start=h.indexOf("tl.to('#mesocycle-card',{scale:1.12");
const end=h.indexOf("tl.to('#coach-focus,#coach-label-focus,#client-focus",start);
if(start<0||end<0||!h.includes('id="days-card"'))throw Error('Existing component anchors not found');
h=h.slice(0,start)+`// Reusable, unclipped foreground cards. Original phone animation is untouched.
document.querySelector('#ui-overlay-plane').style.transform=projectiveMatrix(PHONE_QUADS.coach);
const cards=FitnodeFloatingCards({timeline:tl,plane:document.querySelector('#ui-overlay-plane'),focus:document.querySelector('#coach-focus'),phone:document.querySelector('#phone-coach-object'),overlayFocus:document.querySelector('#ui-overlay-focus'),overlayPhone:document.querySelector('#ui-overlay-phone')});
const mesocycle=cards.add({id:'mesocycle-card',box:{left:0,top:334/6,width:240,height:210/6},start:2.4,end:3.55,scale:1.4,y:-10});
tl.fromTo('#floating-mesocycle-menu',{opacity:0,y:-2},{opacity:1,y:0,duration:.14,ease:'power2.out',immediateRender:false},2.66);
tl.to('#floating-mesocycle-menu-pressed',{opacity:1,duration:.08,ease:'none'},3.0);
tl.to('#floating-mesocycle-menu',{opacity:0,y:-1,duration:.12,ease:'sine.inOut'},3.17);
const days=cards.add({id:'days-card',box:{left:0,top:930/6,width:240,height:340/6},start:3.6,end:5.2,scale:1.4,y:-8});
cards.state(days,'none',3.87);
cards.state(days,'l',4.12);
cards.state(days,'lx',4.38);
cards.state(days,'lxv',4.64);
const exercise=cards.add({id:'exercise-card',box:{left:0,top:1640/6,width:240,height:925/6},start:5.2,end:7.6,scale:1.15,y:-32,travel:.28});
// Series/Reps keep original static states; authentic focused states are still required.
[['series',5.46],['reps',5.94],['rir',6.42],['rest',6.9]].forEach(([name,at])=>cards.parameter(exercise,name,at));
`+h.slice(end);
fs.writeFileSync('index.html',h);
let proof=h.replaceAll('assets/','../assets/').replaceAll('data-duration="12.8"','data-duration="2"').replaceAll('data-duration="11.82"','data-duration="2"').replace('data-start="11.5666666667" data-duration="1.2333333333"','data-start="2" data-duration="0"');
proof=proof.replace('width=1080, height=1920','width=540, height=960').replace('data-width="1080" data-height="1920"','data-width="540" data-height="960"').replace('transform:scale(1.5)','transform:scale(0.75)');
proof=proof.replace("window.__timelines['main']=tl;",`const windowTimeline=gsap.timeline({paused:true,onUpdate:()=>{tl.totalTime(1.6+windowTimeline.time(),false);cards.sync();}});
windowTimeline.to({clock:0},{clock:2,duration:2,ease:'none'},0);
tl.totalTime(1.6,false);cards.sync();
window.__timelines['main']=windowTimeline;`);
fs.writeFileSync('overlay-proof/entry.html',proof);
console.log('Floating overlays installed; phone, entry, logo and closing tweens preserved.');
