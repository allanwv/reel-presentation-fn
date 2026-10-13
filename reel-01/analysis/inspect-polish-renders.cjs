const fs=require('fs'),cp=require('child_process');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/110f701c48e68d66/node_modules/hyperframes/package.json'),sharp=req('sharp');
const bin='C:/Users/aweis/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/',out='analysis/final-polish';
const final=process.argv.includes('--final');
const jobs=final?[{id:'FINAL',file:'output/FITNODE_REEL_PULIDO_FINAL.mp4',start:0,duration:18.5,width:1080,height:1920,times:[.7,3.20,7.95,8.70,10.9,12.4,14.5,15.75,17.2,17.5,18.3]}]:[
 {id:'MESOCICLO',start:2.35,duration:1.3,width:540,height:960,times:[.35,.65,.85,1.0,1.2]},
 {id:'ASESORADO',start:7.7,duration:8.6,width:540,height:960,times:[.25,.98,1.15,3.2,3.6,4.7,5.5,6.8,7.8,8.15]},
 {id:'CIERRE',start:16.65,duration:1.85,width:540,height:960,times:[.4,.65,.85,1.1,1.6]}
];
(async()=>{
 const reports=[];
 for(const j of jobs){
  const file=j.file||'output/FITNODE_PULIDO_'+j.id+'.mp4';
  const probe=JSON.parse(cp.execFileSync(bin+'ffprobe.exe',['-v','error','-show_format','-show_streams','-of','json',file],{encoding:'utf8',windowsHide:true}));
  const video=probe.streams.find(s=>s.codec_type==='video');
  if(video.width!==j.width||video.height!==j.height||video.avg_frame_rate!=='30/1'||Math.abs(Number(probe.format.duration)-j.duration)>.034||probe.streams.some(s=>s.codec_type==='audio'))throw Error('Unexpected video metadata '+file);
  cp.execFileSync(bin+'ffmpeg.exe',['-v','error','-i',file,'-f','null','-'],{windowsHide:true});
  const panels=[];
  for(const [i,t]of j.times.entries()){
   const png=out+'/encoded-'+j.id.toLowerCase()+'-'+i+'.png';
   cp.execFileSync(bin+'ffmpeg.exe',['-v','error','-ss',String(t),'-i',file,'-frames:v','1','-y',png],{windowsHide:true});
   panels.push({input:await sharp(png).resize(270,480).png().toBuffer(),left:i*270,top:0});
  }
  await sharp({create:{width:270*panels.length,height:480,channels:3,background:'#061a2c'}}).composite(panels).png().toFile(out+'/encoded-'+j.id.toLowerCase()+'-contact.png');
  reports.push({file,width:video.width,height:video.height,fps:video.avg_frame_rate,frames:video.nb_frames,duration:probe.format.duration,audio:false,fullDecode:true,sourceTimes:j.times.map(t=>t+j.start)});
 }
 fs.writeFileSync(out+(final?'/final-media.json':'/previews-media.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));
})().catch(e=>{console.error(e);process.exitCode=1;});
