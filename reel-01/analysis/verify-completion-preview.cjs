const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto');
const sharp=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/110f701c48e68d66/node_modules/hyperframes/package.json')('sharp');
const bin='C:/Users/aweis/AppData/Local/Microsoft/WinGet/Links/',file='output/FITNODE_ASESORADO_SERIES_FINALIZACION_PREVIEW.mp4',out='completion-proof/render-review';
const run=(exe,args)=>cp.execFileSync(bin+exe,args,{encoding:'utf8',maxBuffer:32*1024*1024,windowsHide:true});
(async()=>{
 fs.mkdirSync(out,{recursive:true});const p=JSON.parse(run('ffprobe.exe',['-v','error','-show_streams','-show_format','-of','json',file])),v=p.streams.find(s=>s.codec_type==='video');
 if(v.width!==1080||v.height!==1920||v.avg_frame_rate!=='30/1'||Number(v.nb_frames)!==153||Number(p.format.duration)!==5.1||p.streams.some(s=>s.codec_type==='audio'))throw Error('Incorrect preview format');
 run('ffmpeg.exe',['-v','error','-i',file,'-f','null','-']);
 let originals=0;for(const[f,h]of Object.entries(JSON.parse(fs.readFileSync('analysis/approved-integrity.json','utf8')))){if(crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')!==h)throw Error('Original altered '+f);originals++;}
 const times=[10,10.6,10.96,11.36,11.75,12.4,12.8,12.96,13.2,13.42,13.7,14.1,14.5,14.7,14.8,15.0],tiles=[];
 for(const[i,t]of times.entries()){
  const f=out+'/frame-'+t+'.png';run('ffmpeg.exe',['-v','error','-ss',String(t-10),'-i',file,'-frames:v','1','-y',f]);
  const label=Buffer.from('<svg width="270" height="28"><rect width="270" height="28" fill="#061a2c"/><text x="8" y="20" font-size="16" fill="white">Reel '+t.toFixed(2)+' s</text></svg>');
  tiles.push({input:await sharp(f).resize(270,480).extend({top:28,bottom:0,left:0,right:0,background:'#061a2c'}).composite([{input:label,left:0,top:0}]).png().toBuffer(),left:i%4*270,top:Math.floor(i/4)*508});
 }
 await sharp({create:{width:1080,height:2032,channels:4,background:'#061a2c'}}).composite(tiles).png().toFile(out+'/contact-sheet.png');
 const result={file,sourceWindow:[10,15.1],duration:5.1,width:v.width,height:v.height,fps:v.avg_frame_rate,frames:Number(v.nb_frames),decodeErrors:0,audioStreams:0,approvedOriginalAssetsUnchanged:originals,bytes:fs.statSync(file).size,times};
 fs.writeFileSync(out+'/verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
})().catch(e=>{console.error(e);process.exitCode=1;});
