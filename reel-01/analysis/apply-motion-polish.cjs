const fs=require('fs');
let html=fs.readFileSync('index.html','utf8');
function replace(from,to){if(!html.includes(from))throw Error('Missing edit anchor: '+from.slice(0,90));html=html.replace(from,to);}
replace('.focus-rig { position:absolute; inset:0; width:720px; height:1280px; }',`.focus-rig,.depth-rig,.float-rig { position:absolute; inset:0; width:720px; height:1280px; }
#coach-depth,#coach-label-depth { transform-origin:200px 812px; }
#client-depth,#client-label-depth { transform-origin:525px 815px; }`);
for(const role of ['coach','client']){
  const anchor='<div id="'+role+'-focus" class="focus-rig">';
  const start=html.indexOf(anchor),end=html.indexOf('\n<div id="'+(role==='coach'?'phone-client':'phone-labels')+'"',start);
  if(start<0||end<0)throw Error('Missing phone rig');
  let section=html.slice(start,end);
  section=section.replace(anchor,anchor+'\n<div id="'+role+'-depth" class="depth-rig"><div id="'+role+'-float" class="float-rig">');
  html=html.slice(0,start)+section+'\n</div></div>'+html.slice(end);
  const label='<div id="'+role+'-label-focus" class="focus-rig">';
  const labelStart=html.indexOf(label),labelEnd=html.indexOf('</svg></div>',labelStart);
  if(labelEnd<0)throw Error('Missing label rig');
  html=html.slice(0,labelStart)+html.slice(labelStart,labelEnd).replace(label,label+'<div id="'+role+'-label-depth" class="depth-rig"><div id="'+role+'-label-float" class="float-rig">')+'</svg></div></div></div>'+html.slice(labelEnd+'</svg></div>'.length);
}
replace('<div id="ui-overlay-focus"><div id="ui-overlay-phone"><div id="ui-overlay-plane"></div></div></div>', '<div id="ui-overlay-focus"><div id="ui-overlay-depth"><div id="ui-overlay-float"><div id="ui-overlay-phone"><div id="ui-overlay-plane"></div></div></div></div></div>');
for(const name of ['series','reps','rir','rest']){
  const re=new RegExp('(<div id="field-'+name+'"[^>]*>)[\\s\\S]*?(</div>)');
  if(!re.test(html))throw Error('Missing field '+name);
  html=html.replace(re,(_,open,close)=>open.replace(/ data-missing-state="[^"]*"/,'')+
    '<img class="ui-field-empty" src="assets/ui/exercise-entry/field-'+name+'-empty.png" alt="Campo vacío '+name+'">'+
    '<img class="ui-field-value" src="assets/ui/exercise-entry/field-'+name+'-value.png" alt="Valor '+({series:'4',reps:'12',rir:'2',rest:'2'}[name])+'">'+
    '<img class="ui-field-initial" src="assets/ui/floating/field-'+name+'-original.png" alt="Estado original anterior a configurar">'+close);
}
replace("tl.to('#coach-focus,#coach-label-focus',{x:100,scale:1.30,duration:0.8,ease:'sine.inOut'},1.6);",`// Independent depth and ambient rigs: no tween competes with the rigid entrance.
tl.to('#coach-focus,#coach-label-focus',{x:100,y:28,scale:1.20,duration:.50,ease:'power2.inOut'},1.6);
tl.fromTo('#coach-depth,#coach-label-depth',{z:0,rotation:0,rotationY:0,transformPerspective:1800,force3D:false},{z:140,rotation:-2.5,rotationY:-2.5,duration:.50,ease:'power2.inOut'},1.6);
// Pure time functions: finite, sinusoidal and identical under forward/reverse seeks.
for(const [role,amplitude,period,phase] of [['coach',2.4,4.2,0],['client',2.6,4.0,1.35]]){
  tl.fromTo('#'+role+'-float,#'+role+'-label-float',{y:-amplitude,force3D:false},{y:amplitude,duration:12.8,ease:p=>.5+.5*Math.sin(2*Math.PI*p*12.8/period+phase)},0);
}`);
replace("tl.to('#client-focus,#client-label-focus',{x:50,y:30,scale:0.88,duration:0.8,ease:'sine.inOut'},1.6);",`tl.to('#client-focus,#client-label-focus',{x:50,y:30,scale:.95,duration:.50,ease:'power2.inOut'},1.6);
tl.fromTo('#client-depth,#client-label-depth',{z:0,transformPerspective:1800,force3D:false},{z:-140,duration:.50,ease:'power2.inOut'},1.6);`);
replace("focus:document.querySelector('#coach-focus'),phone:document.querySelector('#phone-coach-object'),overlayFocus:document.querySelector('#ui-overlay-focus'),overlayPhone:document.querySelector('#ui-overlay-phone')", "focus:document.querySelector('#coach-focus'),depth:document.querySelector('#coach-depth'),float:document.querySelector('#coach-float'),phone:document.querySelector('#phone-coach-object'),overlayFocus:document.querySelector('#ui-overlay-focus'),overlayDepth:document.querySelector('#ui-overlay-depth'),overlayFloat:document.querySelector('#ui-overlay-float'),overlayPhone:document.querySelector('#ui-overlay-phone')");
replace("// Series/Reps keep original static states; authentic focused states are still required.\n[['series',5.46],['reps',5.94],['rir',6.42],['rest',6.9]].forEach(([name,at])=>cards.parameter(exercise,name,at));",`// Empty field pixels are fixed; only the isolated authentic number layers fade in.
cards.inputSequence(exercise,[['series',5.62],['reps',5.98],['rir',6.34],['rest',6.70]]);`);
replace("tl.to('#coach-focus,#coach-label-focus,#client-focus,#client-label-focus',{x:0,y:0,scale:1,duration:1.2,ease:'sine.inOut'},7.6);",`tl.to('#coach-focus,#coach-label-focus,#client-focus,#client-label-focus',{x:0,y:0,scale:1,duration:1.2,ease:'power2.inOut'},7.6);
tl.to('#coach-depth,#coach-label-depth,#client-depth,#client-label-depth',{z:0,rotation:0,rotationY:0,duration:1.2,ease:'power2.inOut'},7.6);`);
fs.writeFileSync('index.html',html);
console.log('Polished existing rigs, synchronized overlay, and localized exercise layers.');
