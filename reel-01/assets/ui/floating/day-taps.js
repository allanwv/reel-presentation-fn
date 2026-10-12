// Native Fitnode pixels; every tween belongs to the existing root timeline.
window.FitnodeDayTaps=function({timeline,card}){
  for(const root of [card.dock,card.floating]){
    // Keep the approved, byte-identical surface until lift-out. The background
    // below stays opaque for every tap; this initial still is never crossfaded.
    const initial=root.querySelector('.ui-days-initial');
    timeline.set(initial,{opacity:1},0);
    timeline.set(initial,{opacity:0},3.6);
    for(const day of root.querySelectorAll('.ui-day')){
      const selected=day.querySelector('.ui-day-selected');
      timeline.set(day,{scale:1,y:0,force3D:false},0);
      if(selected){
        timeline.set(selected,{opacity:day.dataset.initialSelected==='true'?1:0,clipPath:'circle(72% at 50% 50%)'},0);
        if(day.dataset.initialSelected==='true')timeline.to(selected,{opacity:0,duration:.12,ease:'sine.inOut'},3.6);
      }
    }
    for(const [name,at]of [['l',3.96],['x',4.28],['v',4.60]]){
      const day=root.querySelector('[data-day="'+name+'"]'),selected=day.querySelector('.ui-day-selected');
      timeline.to(day,{scale:.90,y:.6,duration:.075,ease:'power2.inOut'},at);
      timeline.set(selected,{opacity:1,clipPath:'circle(0% at 50% 50%)'},at+.065);
      timeline.to(selected,{clipPath:'circle(72% at 50% 50%)',duration:.15,ease:'power3.out'},at+.065);
      timeline.to(day,{scale:1,y:0,duration:.20,ease:'power3.out'},at+.075);
    }
  }
};
