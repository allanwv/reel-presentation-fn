/* Native glyph masks and one moving highlight/check; the existing floating
   card and open/close choreography keep their original transform owners. */
window.FitnodeMesocycleSelection=function({timeline,card}){
 for(const root of [card.dock,card.floating]){
  const menu=root.querySelector('.mesocycle-selector'),highlight=menu.querySelector('.mesocycle-highlight'),check=menu.querySelector('.mesocycle-selection-check');
  const independent=menu.querySelector('.mesocycle-option-independent'),meso=menu.querySelector('.mesocycle-option-meso'),field=root.querySelector('.mesocycle-initial-value');
  timeline.set(highlight,{y:0,force3D:false},0);
  timeline.set(check,{y:-151/4.5,opacity:1,force3D:false},0);
  timeline.set(independent,{backgroundColor:'#3180ed'},0);
  timeline.set(meso,{backgroundColor:'#313131'},0);
  timeline.set(field,{opacity:1},0);
  timeline.to(highlight,{y:(182-24)/4.5,duration:.16,ease:'sine.inOut'},3.0);
  timeline.to(independent,{backgroundColor:'#313131',duration:.16,ease:'sine.inOut'},3.0);
  timeline.to(meso,{backgroundColor:'#3180ed',duration:.16,ease:'sine.inOut'},3.0);
  timeline.to(check,{opacity:0,duration:.05,ease:'power1.in'},3.0);
  timeline.set(check,{y:0},3.055);
  timeline.to(check,{opacity:1,duration:.07,ease:'power1.out'},3.08);
  // Commit the value atomically: both native card surfaces have identical
  // backgrounds, so only the text changes, without two labels ghosting.
  timeline.set(field,{opacity:0},3.08);
 }
};
