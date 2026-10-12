// Generated review window. index.html remains the sole authored composition.
const fs=require('fs');
const start=1.5,end=14.5,duration=end-start;
let html=fs.readFileSync('index.html','utf8').replaceAll('assets/','../assets/');
html=html.replace(/<div\b[^>]*\bdata-start="([^"]+)"[^>]*>/g,(tag,s)=>{
 const d=tag.match(/data-duration="([^"]+)"/);if(!d)return tag;
 const a=Number(s),b=a+Number(d[1]);
 if(a>=end||b<=start)return tag.replace(/data-start="[^"]+"/,'data-start="0"').replace(/data-duration="[^"]+"/,'data-duration="'+duration+'"').replace(/>$/,' data-hidden="true">');
 return tag.replace(/data-start="[^"]+"/,'data-start="'+Math.max(0,a-start)+'"').replace(/data-duration="[^"]+"/,'data-duration="'+(Math.min(b,end)-Math.max(a,start))+'"');
});
html=html.replace("window.__timelines['main']=tl;",`
const reviewClock={absolute:${start}};
const reviewTimeline=gsap.timeline({paused:true});
reviewTimeline.fromTo(reviewClock,{absolute:${start}},{absolute:${end},duration:${duration},ease:'none',onUpdate:()=>{tl.totalTime(reviewClock.absolute,false);}},0);
tl.totalTime(${start},false);
window.__timelines['main']=reviewTimeline;`);
fs.mkdirSync('notification-proof',{recursive:true});fs.writeFileSync('notification-proof/entry.html',html);
fs.writeFileSync('notification-proof/segment.json',JSON.stringify({source:'index.html',start,end,duration,width:1080,height:1920,fps:30},null,2));
console.log('Review window '+start+'–'+end+' s; '+duration+' seconds, 1080x1920.');
