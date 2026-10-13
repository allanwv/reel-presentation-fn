const fs=require('fs'),cp=require('child_process');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/110f701c48e68d66/node_modules/hyperframes/package.json'),sharp=req('sharp');
const bin='C:/Users/aweis/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/',out='analysis/interaction-fixes',final=process.argv.includes('--final');
const jobs=final?[{id:'final',file:'output/FITNODE_REEL_BETA_CORREGIDO.mp4',width:1080,height:1920,duration:21,start:0,times:[.8,3.3,3.55,3.7,3.9,4.1,4.5,4.9,5.5,5.8,6.1,6.3,6.9,12.4,15.6,19]}]:[
 {id:'coach',file:'output/FITNODE_CORRECCIONES_COACH_PREVIEW.mp4',width:540,height:960,duration:7.65,start:0,times:[.8,3.3,3.55,3.7,3.9,4.1,4.5,4.9,5.5,5.8,6.1,6.3,6.9]},
 {id:'closing',file:'output/FITNODE_CORRECCIONES_CLOSING_PREVIEW.mp4',width:540,height:960,duration:4.35,start:16.65,times:[.55,1.25,1.5,1.9,4.2]}
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
  let preservation=null;
  if(final){
   const result=cp.spawnSync(bin+'ffmpeg.exe',['-v','info','-i','output/FITNODE_REEL_BETA_FINAL.mp4','-i',j.file,'-filter_complex','[0:v]trim=start=7.7:end=17.3,setpts=PTS-STARTPTS[old];[1:v]trim=start=7.7:end=17.3,setpts=PTS-STARTPTS[new];[old][new]ssim','-an','-f','null','-'],{encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024});
   fs.writeFileSync(out+'/protected-scenes-ssim.log',result.stderr);const match=result.stderr.match(/All:([\d.]+)/);preservation={from:7.7,to:17.3,ssim:Number(match?.[1])};if(result.status!==0||!match||preservation.ssim<.995)throw Error('Unexpected protected scene differences '+JSON.stringify(preservation));
  }
  reports.push({file:j.file,width:j.width,height:j.height,fps:video.avg_frame_rate,frames:Number(video.nb_frames),duration:Number(probe.format.duration),audio:false,fullDecode:true,preservation,reviewSourceTimes:j.times.map(t=>t+j.start)});
 }
 fs.writeFileSync(out+'/'+(final?'final':'previews')+'-media.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));
})().catch(e=>{console.error(e);process.exitCode=1;});
