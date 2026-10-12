const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {execFileSync}=require('child_process');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/package.json');
const sharp=req('sharp');
const ffmpeg='C:/Users/aweis/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/ffmpeg.exe';
const screenshot='../source/screenshots/SCREEN_01_COACH_ROUTINE.png',video='../source/videos/VIDEO_01_COACH_ROUTINE_ASSIGN.mp4';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async()=>{
 const originalHashes={[screenshot]:hash(screenshot),[video]:hash(video)};
 fs.mkdirSync('assets/ui/mesocycle',{recursive:true});
 const band={left:0,top:334,width:1440,height:210};
 await sharp(screenshot).extract(band).png().toFile('assets/ui/mesocycle/card-closed.png');
 const mask=Buffer.from('<svg width="1440" height="3120"><rect width="1440" height="3120" fill="white"/><rect y="334" width="1440" height="210" fill="black"/></svg>');
 // Copy original pixels with a transparent aperture. There is no card beneath the animated card.
 const raw=await sharp(screenshot).ensureAlpha().raw().toBuffer();
 for(let y=334;y<544;y++)for(let x=0;x<1440;x++)raw[(y*1440+x)*4+3]=0;
 await sharp(raw,{raw:{width:1440,height:3120,channels:4}}).png().toFile('assets/ui/mesocycle/screen-with-card-aperture.png');
 const menu={left:356,top:395,width:476,height:340};
 for(const [name,time]of [['open',46.7],['pressed',47.35]]){
  const frame=execFileSync(ffmpeg,['-v','error','-ss',String(time),'-i',video,'-frames:v','1','-f','image2pipe','-vcodec','png','pipe:1'],{maxBuffer:20*1024*1024});
  const rounded=Buffer.from('<svg width="476" height="340"><rect width="476" height="340" rx="50" fill="white"/></svg>');
  await sharp(frame).extract(menu).ensureAlpha().composite([{input:rounded,blend:'dest-in'}]).png().toFile('assets/ui/mesocycle/menu-'+name+'.png');
 }
 const provenance={originalHashes,card:{source:screenshot,crop:band},menu:{source:video,crop:menu,states:{open:46.7,pressed:47.35},operation:'Original pixels; rounded alpha boundary only. Uniform scaling in original screen coordinates.'},selection:'Authentic re-selection of the already selected Meso octubre (4 semanas). No alternate selected mesocycle supplied.'};
 for(const [p,h]of Object.entries(originalHashes))if(hash(p)!==h)throw Error('Original media modified');
 fs.writeFileSync('assets/ui/mesocycle/provenance.json',JSON.stringify(provenance,null,2));
 console.log('Extracted card and two authentic menu states; original hashes unchanged.');
})().catch(e=>{console.error(e);process.exitCode=1});
