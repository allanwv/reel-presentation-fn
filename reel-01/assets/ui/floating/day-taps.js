// Native Fitnode pixels; every tween belongs to the existing root timeline.
window.FitnodeDayTaps=function({timeline,card}){
  for(const root of [card.dock,card.floating]){
    // The screenshot's preselected M/J/S still must never cover this component.
    // Both dock and overlay start from the same authentic empty circle crops.
    root.querySelector('.ui-days-initial')?.remove();
    for(const day of root.querySelectorAll('.ui-day')){
      const selected=day.querySelector('.ui-day-selected');
      day.dataset.initialSelected='false';
      timeline.set(day,{scale:1,y:0,force3D:false},0);
      if(selected){
        selected.style.opacity='0';
        timeline.set(selected,{opacity:0,clipPath:'circle(72% at 50% 50%)'},0);
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
