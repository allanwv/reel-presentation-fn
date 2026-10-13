const fs=require('fs'),cp=require('child_process');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/110f701c48e68d66/node_modules/hyperframes/package.json'),sharp=req('sharp');
const bin='C:/Users/aweis/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/',out='analysis/final-reel-polish',final=process.argv.includes('--final');
const jobs=final?[{id:'final',file:'output/FITNODE_REEL_FINAL_22S.mp4',width:1080,height:1920,duration:22,start:0,times:[.8,1.9,2.2,5.5,5.67,5.8,6.1,6.3,6.9,8.68,9,13.23,13.3,13.5,15.6,21.5]}]:[
 {id:'coach',file:'output/FITNODE_PULIDO_FINAL_COACH_PREVIEW.mp4',width:540,height:960,duration:7.65,start:0,times:[.8,1.6,1.9,2.2,5.5,5.67,5.8,6.1,6.3,6.5,6.9,7.2]},
 {id:'client',file:'output/FITNODE_PULIDO_FINAL_CLIENT_PREVIEW.mp4',width:540,height:960,duration:6.1,start:8.15,times:[.15,.53,.85,4.98,5.08,5.15,5.2,5.4,5.9]},
 {id:'closing',file:'output/FITNODE_PULIDO_FINAL_CIERRE_PREVIEW.mp4',width:540,height:960,duration:5.35,start:16.65,times:[.55,1.3,1.6,2.3,2.7,4.8]}
];
(async()=>{
 const reports=[];
 for(const j of jobs){
  const probe=JSON.parse(cp.execFileSync(bin+'ffprobe.exe',['-v','error','-show_format','-show_streams','-of','json',j.file],{encoding:'utf8',windowsHide:true})),video=probe.streams.find(s=>s.codec_type==='video');
  if(video.width!==j.width||video.height!==j.height||video.avg_frame_rate!=='30/1'||Math.abs(Number(probe.format.duration)-j.duration)>.034||probe.streams.some(s=>s.codec_type==='audio'))throw Error('Unexpected metadata '+j.file);
  cp.execFileSync(bin+'ffmpeg.exe',['-v','error','-i',j.file,'-f','null','-'],{windowsHide:true});
  const panels=[];
  for(const[i,t]of j.times.entries()){
   const png=out+'/encoded-'+j.id+'-'+i+'.png';cp.execFileSync(bin+'ffmpeg.exe',['-v','error','-ss',String(t),'-i',j.file,'-frames:v','1','-y',png],{windowsHide:true});
   panels.push({input:await sharp(png).resize(216,384).png().toBuffer(),left:(i%8)*216,top:Math.floor(i/8)*384});
  }
  await sharp({create:{width:Math.min(8,panels.length)*216,height:Math.ceil(panels.length/8)*384,channels:3,background:'#061a2c'}}).composite(panels).png().toFile(out+'/encoded-'+j.id+'-contact.png');
  reports.push({file:j.file,width:j.width,height:j.height,fps:video.avg_frame_rate,frames:Number(video.nb_frames),duration:Number(probe.format.duration),audio:false,fullDecode:true,reviewSourceTimes:j.times.map(t=>t+j.start)});
 }
 fs.writeFileSync(out+'/'+(final?'final':'previews')+'-media.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));
})().catch(e=>{console.error(e);process.exitCode=1;});
