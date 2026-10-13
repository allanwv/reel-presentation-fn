// Disposable local preview windows of index.html, never a second authored reel.
const fs=require('fs'),out='final-polish-proof';fs.mkdirSync(out,{recursive:true});
const segments=[{id:'mesociclo',start:2.35,end:3.65},{id:'asesorado',start:7.7,end:16.3},{id:'cierre',start:16.65,end:18.5}];
for(const segment of segments){
 const {id,start,end}=segment,duration=end-start;let html=fs.readFileSync('index.html','utf8').replaceAll('assets/','../assets/');
 html=html.replace(/data-width="1080" data-height="1920"/,'data-width="540" data-height="960"').replace('transform:scale(1.5); transform-origin:0 0;','transform:scale(.75); transform-origin:0 0;');
 html=html.replace(/<div\b[^>]*\bdata-start="([^"]+)"[^>]*>/g,(tag,s)=>{const d=tag.match(/data-duration="([^"]+)"/);if(!d)return tag;const a=Number(s),b=a+Number(d[1]);if(a>=end||b<=start)return tag.replace(/data-start="[^"]+"/,'data-start="0"').replace(/data-duration="[^"]+"/,'data-duration="'+duration+'"').replace(/>$/,' data-hidden="true">');return tag.replace(/data-start="[^"]+"/,'data-start="'+Math.max(0,a-start)+'"').replace(/data-duration="[^"]+"/,'data-duration="'+(Math.min(b,end)-Math.max(a,start))+'"');});
 html=html.replace("window.__timelines['main']=tl;",`const reviewClock={absolute:${start}},reviewTimeline=gsap.timeline({paused:true});reviewTimeline.fromTo(reviewClock,{absolute:${start}},{absolute:${end},duration:${duration},ease:'none',onUpdate:()=>tl.totalTime(reviewClock.absolute,false)},0);tl.totalTime(${start},false);window.__timelines['main']=reviewTimeline;`);
 fs.writeFileSync(out+'/'+id+'.html',html);
}
fs.writeFileSync(out+'/segments.json',JSON.stringify(segments,null,2));console.log(JSON.stringify(segments));
