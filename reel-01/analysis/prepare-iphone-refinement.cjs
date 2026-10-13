const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/110f701c48e68d66/node_modules/hyperframes/package.json'),sharp=req('sharp');
const ffmpeg='C:/Users/aweis/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/ffmpeg.exe';
(async()=>{
 const dir='iphone-refinement-proof';fs.mkdirSync(dir,{recursive:true});
 for(const f of ['index.html','assets/ui/phone-3d/phone-3d.js','assets/ui/phone-3d/phone-3d.css'])fs.copyFileSync(f,dir+'/before-'+path.basename(f)+'.txt');
 const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
 const originals=Object.fromEntries([...walk('../source'),...walk('../references'),...walk('assets')].filter(f=>/\.(png|webp|jpg|svg|mp4|woff2)$/i.test(f)).map(f=>[f,hash(f)]));fs.writeFileSync(dir+'/original-hashes.json',JSON.stringify(originals,null,2));
 const images=[];
 for(const t of [.2,8,20,35,44,46.7]){
  const frame=cp.execFileSync(ffmpeg,['-v','error','-ss',String(t),'-i','../source/videos/VIDEO_01_COACH_ROUTINE_ASSIGN.mp4','-frames:v','1','-f','image2pipe','-vcodec','png','pipe:1'],{maxBuffer:20e6});
  fs.writeFileSync(dir+'/coach-source-'+t+'.png',frame);
  images.push(await sharp(frame).extract({left:0,top:230,width:1080,height:230}).resize(720).png().toBuffer());
 }
 await sharp({create:{width:720,height:6*154,channels:3,background:'white'}}).composite(images.map((input,i)=>({input,left:0,top:i*154}))).png().toFile(dir+'/source-selector-contact.png');
 const menu=await sharp('assets/ui/mesocycle/menu-open.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const samples={};for(const[x,y]of[[10,100],[200,150],[200,200],[200,310],[100,20],[450,249]]){const p=(y*menu.info.width+x)*4;samples[x+','+y]=[...menu.data.slice(p,p+4)];}
 const top=await sharp('assets/ui/coach-update/screen-apertures-with-update-hole.png').metadata();
 await sharp('assets/ui/coach-update/screen-apertures-with-update-hole.png').extract({left:0,top:0,width:top.width,height:Math.round(top.width/4)}).resize(960).png().toFile(dir+'/coach-status-reference.png');
 console.log(JSON.stringify({samples,status:top,originals:Object.keys(originals).length}));
})().catch(e=>{console.error(e);process.exitCode=1;});
