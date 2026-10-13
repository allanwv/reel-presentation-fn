/* One seekable GSAP timeline; overlay follows cached transforms, never layout measurements. */
window.FitnodeFloatingCards=function({timeline,plane,focus,depth,float,phone,overlayFocus,overlayDepth,overlayFloat,overlayPhone}){
  const sync=()=>{
    for(const [source,target] of [[focus,overlayFocus],[depth,overlayDepth],[float,overlayFloat],[phone,overlayPhone]]){
      target.style.transform=source.style.transform;
      target.style.transformOrigin=source.style.transformOrigin;
    }
  };
  // Both devices share this same frame callback and seekable timeline.
  if(!timeline.__fitnodeCardSyncers){
    timeline.__fitnodeCardSyncers=new Set();
    const previous=timeline.eventCallback('onUpdate');
    timeline.eventCallback('onUpdate',function(){
      if(previous)previous.call(this);
      for(const update of timeline.__fitnodeCardSyncers)update();
    });
  }
  timeline.__fitnodeCardSyncers.add(sync);
  const add=({id,box,start,end,scale=1.4,x=0,y=-10,travel=.24})=>{
    const dock=document.getElementById(id),floating=dock.cloneNode(true);
    for(const node of [floating,...floating.querySelectorAll('[id]')])if(node.id)node.id='floating-'+node.id;
    floating.classList.add('floating-card');
    Object.assign(floating.style,{left:box.left+'px',top:box.top+'px',width:box.width+'px',height:box.height+'px',transformOrigin:'50% 50%'});
    // Clip only the card face; the authentic dropdown remains outside the mask.
    const face=document.createElement('div');face.className='floating-face';
    for(const child of [...floating.children])if(!child.classList.contains('ui-menu'))face.appendChild(child);
    floating.prepend(face);
    const radius=11/(1.5*1.30*scale); // Approximately 11 delivery pixels at full elevation.
    plane.appendChild(floating);
    timeline.set(dock,{opacity:1},0);
    timeline.set(floating,{opacity:0,x:0,y:0,scale:1,force3D:false},0);
    timeline.set([floating,face],{borderRadius:0},0);
    timeline.set(floating,{boxShadow:'0px 0px 0px 0px rgba(0,12,24,0)'},0);
    // Identical geometry at both hand-offs. At most one card surface is visible.
    timeline.set(dock,{opacity:0},start);
    timeline.set(floating,{opacity:1},start);
    timeline.to(floating,{x,y,scale,duration:travel,ease:'sine.inOut'},start);
    timeline.to([floating,face],{borderRadius:radius,duration:travel,ease:'sine.inOut'},start);
    timeline.to(floating,{boxShadow:'0px 4px 10px 1px rgba(0,12,24,0.20)',duration:travel,ease:'sine.inOut'},start);
    timeline.to(floating,{x:0,y:0,scale:1,duration:travel,ease:'sine.inOut'},end-travel);
    timeline.to([floating,face],{borderRadius:0,duration:travel,ease:'sine.inOut'},end-travel);
    timeline.to(floating,{boxShadow:'0px 0px 0px 0px rgba(0,12,24,0)',duration:travel,ease:'sine.inOut'},end-travel);
    timeline.set(floating,{opacity:0},end);
    timeline.set(dock,{opacity:1},end);
    return {dock,floating,start,end};
  };
  const state=(card,name,at,duration=.06)=>{
    for(const root of [card.dock,card.floating]){
      const target=root.querySelector('[data-state="'+name+'"]');
      if(!target)throw Error('Missing authentic state: '+name);
      const others=[...root.querySelectorAll('.ui-state')].filter(node=>node!==target);
      timeline.to(others,{opacity:0,duration,ease:'none'},at);
      timeline.to(target,{opacity:1,duration,ease:'none'},at);
    }
  };
  const parameter=(card,name,at)=>{
    const field=card.floating.querySelector('[data-field="'+name+'"]');
    timeline.to(field,{y:-2,scale:1.12,duration:.12,ease:'sine.inOut'},at);
    const authentic=field.querySelector('.ui-field-focused');
    if(authentic){
      timeline.to(authentic,{opacity:1,duration:.08,ease:'none'},at+.08);
      timeline.to(authentic,{opacity:0,duration:.08,ease:'none'},at+.28);
    }
    timeline.to(field,{y:0,scale:1,duration:.12,ease:'sine.inOut'},at+.28);
  };
  const inputSequence=(card,entries)=>{
    for(const root of [card.dock,card.floating]){
      // The masked authentic input surfaces are empty from the first phone frame.
      timeline.set(root.querySelectorAll('.ui-field-initial'),{opacity:0},0);
      timeline.set(root.querySelectorAll('.ui-field-value'),{opacity:0},0);
      for(const [index,[name,at]] of entries.entries()){
        const field=root.querySelector('[data-field="'+name+'"]'),value=field.querySelector('.ui-field-value');
        // A raster prefix keeps Flutter's original glyphs and input surface.
        // It is created once while building the root timeline, never while seeking.
        let prefix=null;
        if(name==='reps'){
          prefix=value.cloneNode(false);
          prefix.removeAttribute('id');prefix.removeAttribute('data-hf-id');
          prefix.className='ui-field-typed-prefix';
          prefix.src='assets/ui/exercise-typing/field-reps-one-value.png';prefix.alt='Valor 1 durante el tipeo';
          prefix.style.opacity='0';field.insertBefore(prefix,value);
          timeline.set(prefix,{opacity:0},0);
        }
        // A narrow TextField caret, sized against the authentic 44 px raster
        // glyph height (the screen is authored at one sixth of source pixels).
        const caret=document.createElement('span');caret.className='ui-field-caret';caret.setAttribute('aria-hidden','true');
        Object.assign(caret.style,{position:'absolute',left:'0px',top:(56/6)+'px',width:'1px',height:(56/6)+'px',backgroundColor:'#2F80ED',opacity:'0',pointerEvents:'none',zIndex:'2'});
        field.appendChild(caret);
        const emptyX={series:134/6,reps:132/6,rir:132/6,rest:102/6}[name];
        const fullX={series:157/6,reps:166/6,rir:152/6,rest:122/6}[name];
        const blurAt=entries[index+1]?.[1]??Math.min(at+.36,card.end);
        timeline.set(caret,{opacity:0,x:emptyX,force3D:false},0);
        timeline.set(caret,{opacity:1},at);
        timeline.set(field,{y:0,scale:1,force3D:false},0);
        timeline.to(field,{y:-.4,scale:1.045,duration:.10,ease:'power2.out'},at);
        // Brief existing focus motion, then discrete keystrokes. Numbers never fade.
        if(prefix){
          timeline.set(prefix,{opacity:1},at+.11);
          timeline.set(caret,{x:148/6},at+.11);
          timeline.set(prefix,{opacity:0},at+.24);
          timeline.set(value,{opacity:1},at+.24);
          timeline.set(caret,{x:fullX},at+.24);
        }else{
          timeline.set(value,{opacity:1},at+.11);
          timeline.set(caret,{x:fullX},at+.11);
        }
        // One brief blink on the same GSAP clock, then clean focus hand-off.
        timeline.set(caret,{opacity:0},at+.16);
        timeline.set(caret,{opacity:1},at+.24);
        timeline.set(caret,{opacity:0},blurAt);
        timeline.to(field,{y:0,scale:1,duration:.18,ease:'power2.out'},at+.10);
      }
    }
  };
  sync();
  return {add,state,parameter,inputSequence,sync};
};
