const fs=require('fs'),cp=require('child_process');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/110f701c48e68d66/node_modules/hyperframes/package.json'),sharp=req('sharp');
const bin='C:/Users/aweis/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/',out='analysis/beta-closing',final=process.argv.includes('--final');
const file=final?'output/FITNODE_REEL_BETA_FINAL.mp4':'output/FITNODE_CIERRE_BETA_PREVIEW.mp4';
(async()=>{
 const probe=JSON.parse(cp.execFileSync(bin+'ffprobe.exe',['-v','error','-show_format','-show_streams','-of','json',file],{encoding:'utf8',windowsHide:true}));
 const video=probe.streams.find(s=>s.codec_type==='video'),width=final?1080:540,height=final?1920:960,duration=final?21:4.35;
 if(video.width!==width||video.height!==height||video.avg_frame_rate!=='30/1'||Math.abs(Number(probe.format.duration)-duration)>.034||probe.streams.some(s=>s.codec_type==='audio'))throw Error('Unexpected video metadata '+file);
 cp.execFileSync(bin+'ffmpeg.exe',['-v','error','-i',file,'-f','null','-'],{windowsHide:true});
 const times=final?[3.2,8.7,12.4,15.6,17.2,17.9,18.15,18.55,20.85]:[.55,1.25,1.5,1.9,4.2],panels=[];
 for(const[i,t]of times.entries()){
  const png=out+'/encoded-'+(final?'final':'preview')+'-'+i+'.png';
  cp.execFileSync(bin+'ffmpeg.exe',['-v','error','-ss',String(t),'-i',file,'-frames:v','1','-y',png],{windowsHide:true});
  panels.push({input:await sharp(png).resize(270,480).png().toBuffer(),left:i*270,top:0});
 }
 await sharp({create:{width:panels.length*270,height:480,channels:3,background:'#061a2c'}}).composite(panels).png().toFile(out+'/encoded-'+(final?'final':'preview')+'-contact.png');
 let preservation=null;
 if(final){
  const result=cp.spawnSync(bin+'ffmpeg.exe',['-v','info','-i','output/FITNODE_REEL_PULIDO_FINAL.mp4','-i',file,'-filter_complex','[0:v]trim=end=17.3,setpts=PTS-STARTPTS[old];[1:v]trim=end=17.3,setpts=PTS-STARTPTS[new];[old][new]ssim','-an','-f','null','-'],{encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024});
  fs.writeFileSync(out+'/prior-scenes-ssim.log',result.stderr);if(result.status!==0)throw Error('Prior scene comparison failed');
  const match=result.stderr.match(/All:([\d.]+)/);preservation={through:17.3,ssim:Number(match?.[1])};if(!match||preservation.ssim<.995)throw Error('Unexpected prior scene differences '+JSON.stringify(preservation));
 }
 const report={file,width,height,fps:video.avg_frame_rate,frames:Number(video.nb_frames),duration:Number(probe.format.duration),audio:false,fullDecode:true,preservation,reviewSourceTimes:times.map(t=>t+(final?0:16.65))};
 fs.writeFileSync(out+'/'+(final?'final':'preview')+'-media.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
