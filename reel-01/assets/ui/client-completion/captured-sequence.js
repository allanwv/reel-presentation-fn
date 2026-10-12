/* Original-media sprite playback is a pure function of the one GSAP timeline. */
window.FitnodeCapturedSequence=function({timeline,element,start,end,frames,columns=5,pageFrames=20}){
 const images=[...element.querySelectorAll('.captured-atlas')],clock={frame:0};
 let previous=-1;
 const sync=()=>{
  const frame=Math.max(0,Math.min(frames-1,Math.floor(clock.frame+.00001)));
  if(frame===previous)return;
  const page=Math.floor(frame/pageFrames),local=frame%pageFrames;
  images.forEach((image,i)=>{image.style.opacity=i===page?'1':'0';});
  images[page].style.transform='translate('+(-(local%columns)*240)+'px,'+(-Math.floor(local/columns)*520)+'px)';
  element.dataset.sourceFrame=String(frame);previous=frame;
 };
 timeline.fromTo(clock,{frame:0},{frame:frames-.0001,duration:end-start,ease:'none',onUpdate:sync},start);
 sync();
 return {clock,sync,start,end,frames};
};
