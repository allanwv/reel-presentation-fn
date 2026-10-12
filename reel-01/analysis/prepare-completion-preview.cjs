// Generated review range of the sole authored composition in index.html.
const fs=require('fs'),start=10,end=15.1,duration=end-start;
let html=fs.readFileSync('index.html','utf8').replaceAll('assets/','../assets/');
html=html.replace(/<div\b[^>]*\bdata-start="([^"]+)"[^>]*>/g,(tag,s)=>{
 const d=tag.match(/data-duration="([^"]+)"/);if(!d)return tag;
 const a=Number(s),b=a+Number(d[1]);
 if(a>=end||b<=start)return tag.replace(/data-start="[^"]+"/,'data-start="0"').replace(/data-duration="[^"]+"/,'data-duration="'+duration+'"').replace(/>$/,' data-hidden="true">');
 return tag.replace(/data-start="[^"]+"/,'data-start="'+Math.max(0,a-start)+'"').replace(/data-duration="[^"]+"/,'data-duration="'+(Math.min(b,end)-Math.max(a,start))+'"');
});
html=html.replace("window.__timelines['main']=tl;",`
const reviewClock={absolute:${start}},reviewTimeline=gsap.timeline({paused:true});
reviewTimeline.fromTo(reviewClock,{absolute:${start}},{absolute:${end},duration:${duration},ease:'none',onUpdate:()=>tl.totalTime(reviewClock.absolute,false)},0);
tl.totalTime(${start},false);
window.__timelines['main']=reviewTimeline;`);
fs.mkdirSync('completion-proof',{recursive:true});fs.writeFileSync('completion-proof/entry.html',html);
fs.writeFileSync('completion-proof/segment.json',JSON.stringify({source:'index.html',start,end,duration,width:1080,height:1920,fps:30,frames:153},null,2));
console.log('Generated '+duration+' second preview; source '+start+' to '+end+'.');
