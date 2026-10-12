const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/110f701c48e68d66/node_modules/hyperframes/package.json'),sharp=req('sharp');
const bin='C:/Users/aweis/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/';
const file='output/FITNODE_COACH_ASESORADO_NOTIFICACION_PREVIEW.mp4',out='notification-proof/render-review';
function run(exe,args){return cp.execFileSync(bin+exe,args,{encoding:'utf8',maxBuffer:32*1024*1024,windowsHide:true});}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const probe=JSON.parse(run('ffprobe.exe',['-v','error','-show_streams','-show_format','-of','json',file])),v=probe.streams.find(s=>s.codec_type==='video');
 if(v.width!==1080||v.height!==1920||v.avg_frame_rate!=='30/1'||Number(v.nb_frames)!==390||Number(probe.format.duration)!==13||probe.streams.some(s=>s.codec_type==='audio'))throw Error('Unexpected review format');
 run('ffmpeg.exe',['-v','error','-i',file,'-f','null','-']);
 let originalAssets=0;for(const[p,expected]of Object.entries(JSON.parse(fs.readFileSync('analysis/approved-integrity.json','utf8')))){if(crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')!==expected)throw Error('Original changed '+p);originalAssets++;}
 const times=[1.55,2.22,2.8,4.35,6.95,7.84,7.94,8.16,8.28,8.43,8.6,9.2,9.69,9.80,9.94,10.1,10.54,10.8,11.9,12.7,12.96,13.7,14.0,14.45],tiles=[];
 for(const[i,t]of times.entries()){
  const frame=path.join(out,'frame-'+String(i).padStart(2,'0')+'-'+t+'s.png');run('ffmpeg.exe',['-y','-v','error','-ss',String(t-1.5),'-i',file,'-frames:v','1',frame]);
  const label=Buffer.from('<svg width="270" height="28"><rect width="270" height="28" fill="#061a2c"/><text x="8" y="19" font-size="16" fill="white">Reel '+t.toFixed(2)+' s</text></svg>');
  tiles.push({input:await sharp(frame).resize(270,480).extend({top:28,bottom:0,left:0,right:0,background:'#061a2c'}).composite([{input:label,left:0,top:0}]).png().toBuffer(),left:i%6*270,top:Math.floor(i/6)*508});
 }
 await sharp({create:{width:1620,height:2032,channels:4,background:'#061a2c'}}).composite(tiles).png().toFile(out+'/contact-sheet.png');
 const result={file,sourceWindow:[1.5,14.5],duration:13,width:v.width,height:v.height,fps:v.avg_frame_rate,frames:Number(v.nb_frames),audioStreams:0,decodeErrors:0,originalAssetsUnchanged:originalAssets,bytes:fs.statSync(file).size,reviewTimes:times};
 fs.writeFileSync(out+'/verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
})().catch(e=>{console.error(e);process.exitCode=1;});
