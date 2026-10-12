const fs=require('fs'),path=require('path'),cp=require('child_process');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/package.json'),sharp=req('sharp');
const bin='C:/Users/aweis/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/';
const file='output/FITNODE_REEL_MOTION_REFINADO_12.8s.mp4',out='output/refined-review';
function run(exe,args){const r=cp.spawnSync(bin+exe,args,{encoding:'utf8',maxBuffer:32*1024*1024,windowsHide:true});if(r.status!==0)throw Error(r.stderr);return r.stdout;}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const probe=JSON.parse(run('ffprobe.exe',['-v','error','-show_streams','-show_format','-of','json',file])),video=probe.streams.find(s=>s.codec_type==='video');
 if(video.width!==1080||video.height!==1920||video.avg_frame_rate!=='30/1'||Number(video.nb_frames)!==384||Math.abs(Number(probe.format.duration)-12.8)>.001||probe.streams.some(s=>s.codec_type==='audio'))throw Error('Delivery format mismatch');
 const times=[.6,1.5,1.85,2.1,2.8,4.35,5.5,5.85,6.2,6.55,6.95,7.65,9.6,10.9,11.8,12.5],tiles=[];
 for(const [i,t] of times.entries()){
  const frame=path.join(out,'frame-'+String(i).padStart(2,'0')+'-'+t+'s.png');
  run('ffmpeg.exe',['-y','-v','error','-ss',String(t),'-i',file,'-frames:v','1',frame]);
  const label=Buffer.from('<svg width="270" height="28"><rect width="270" height="28" fill="#071b2d"/><text x="8" y="19" font-size="16" fill="white">'+t.toFixed(2)+' s</text></svg>');
  tiles.push({input:await sharp(frame).resize(270,480).extend({top:28,bottom:0,left:0,right:0,background:'#071b2d'}).composite([{input:label,top:0,left:0}]).png().toBuffer(),left:(i%4)*270,top:Math.floor(i/4)*508});
 }
 await sharp({create:{width:1080,height:2032,channels:4,background:'#071b2d'}}).composite(tiles).png().toFile(out+'/sequence-contact-sheet.png');
 await sharp(out+'/frame-06-5.5s.png').extract({left:120,top:1160,width:620,height:300}).png().toFile(out+'/inputs-empty-detail.png');
 await sharp(out+'/frame-10-6.95s.png').extract({left:120,top:1160,width:620,height:300}).png().toFile(out+'/inputs-final-detail.png');
 run('ffmpeg.exe',['-y','-v','error','-ss','12.4','-i',file,'-t','0.4','-vf','scale=540:960,format=gray','-f','rawvideo',out+'/closing.gray']);
 const raw=fs.readFileSync(out+'/closing.gray'),frameBytes=540*960;let sum=0,max=0,frames=0;
 for(let start=frameBytes;start+frameBytes<=raw.length;start+=frameBytes){for(let p=0;p<frameBytes;p++){const diff=Math.abs(raw[start+p]-raw[p]);sum+=diff;max=Math.max(max,diff);}frames++;}
 const result={file,width:video.width,height:video.height,fps:video.avg_frame_rate,frames:Number(video.nb_frames),duration:Number(probe.format.duration),codec:video.codec_name,pixelFormat:video.pix_fmt,audioStreams:0,bytes:fs.statSync(file).size,closingMeanPixelDelta:sum/(frames*frameBytes),closingMaxPixelDelta:max,reviewTimes:times};
 if(result.closingMeanPixelDelta>.05)throw Error('Closing unexpectedly moves');
 fs.writeFileSync(out+'/verification.json',JSON.stringify(result,null,2));fs.unlinkSync(out+'/closing.gray');console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
