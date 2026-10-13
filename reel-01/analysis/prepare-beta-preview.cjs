// A disposable review window of the sole authored reel, preserving absolute motion time.
const fs=require('fs'),out='beta-closing-proof',start=16.65,end=21,duration=end-start;
let html=fs.readFileSync('index.html','utf8').replaceAll('assets/','../assets/');
html=html.replace(/data-width="1080" data-height="1920"/,'data-width="540" data-height="960"').replace('transform:scale(1.5); transform-origin:0 0;','transform:scale(.75); transform-origin:0 0;');
html=html.replace(/<div\b[^>]*\bdata-start="([^"]+)"[^>]*>/g,(tag,s)=>{
 const d=tag.match(/data-duration="([^"]+)"/);if(!d)return tag;const a=Number(s),b=a+Number(d[1]);
 if(a>=end||b<=start)return tag.replace(/data-start="[^"]+"/,'data-start="0"').replace(/data-duration="[^"]+"/,'data-duration="'+duration+'"').replace(/>$/,' data-hidden="true">');
 return tag.replace(/data-start="[^"]+"/,'data-start="'+Math.max(0,a-start)+'"').replace(/data-duration="[^"]+"/,'data-duration="'+(Math.min(b,end)-Math.max(a,start))+'"');
});
html=html.replace("window.__timelines['main']=tl;",`const reviewClock={absolute:${start}},reviewTimeline=gsap.timeline({paused:true});reviewTimeline.fromTo(reviewClock,{absolute:${start}},{absolute:${end},duration:${duration},ease:'none',onUpdate:()=>tl.totalTime(reviewClock.absolute,false)},0);tl.totalTime(${start},false);window.__timelines['main']=reviewTimeline;`);
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/entry.html',html);
fs.writeFileSync(out+'/segment.json',JSON.stringify({source:'index.html',start,end,duration,width:540,height:960,fps:30},null,2));console.log(JSON.stringify({start,end,duration}));
