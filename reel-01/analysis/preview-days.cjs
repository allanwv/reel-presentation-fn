const fs=require('fs');
const start=2.85,duration=2.4;
let html=fs.readFileSync('index.html','utf8')
  .replaceAll('assets/','../assets/')
  .replaceAll('data-duration="12.8"','data-duration="'+duration+'"')
  .replaceAll('data-duration="11.82"','data-duration="'+duration+'"')
  .replace('data-start="11.5666666667" data-duration="1.2333333333"','data-start="'+duration+'" data-duration="0"')
  .replace('width=1080, height=1920','width=540, height=960')
  .replace('data-width="1080" data-height="1920"','data-width="540" data-height="960"')
  .replace('transform:scale(1.5)','transform:scale(0.75)')
  .replace("window.__timelines['main']=tl;",`const previewTimeline=gsap.timeline({paused:true,onUpdate:()=>{tl.totalTime(${start}+previewTimeline.time(),false);cards.sync();}});
previewTimeline.to({clock:0},{clock:${duration},duration:${duration},ease:'none'},0);
tl.totalTime(${start},false);cards.sync();
window.__timelines['main']=previewTimeline;`);
fs.writeFileSync('days-proof/entry.html',html);
console.log('Preview window: '+start+'–'+(start+duration)+' s, 540×960.');
