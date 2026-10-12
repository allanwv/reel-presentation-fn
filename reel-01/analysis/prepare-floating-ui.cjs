const fs=require('fs'),crypto=require('crypto'),{execFileSync}=require('child_process');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/package.json');
const sharp=req('sharp');
const ffmpeg='C:/Users/aweis/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/ffmpeg.exe';
const original='../source/screenshots/SCREEN_01_COACH_ROUTINE.png',video='../source/videos/VIDEO_01_COACH_ROUTINE_ASSIGN.mp4';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const frame=t=>execFileSync(ffmpeg,['-v','error','-ss',String(t),'-i',video,'-frames:v','1','-f','image2pipe','-vcodec','png','pipe:1'],{maxBuffer:20*1024*1024});
(async()=>{
 const dir='assets/ui/floating';fs.mkdirSync(dir,{recursive:true});
 const bands={mesocycle:{left:0,top:334,width:1440,height:210},days:{left:0,top:930,width:1440,height:340},exercise:{left:0,top:1640,width:1440,height:925}};
 const raw=await sharp(original).ensureAlpha().raw().toBuffer();
 const sourceHashes={[original]:hash(original),[video]:hash(video)};
 for(const [id,rect]of Object.entries(bands)){
  await sharp(original).extract(rect).png().toFile(dir+'/'+id+'-original.png');
  for(let y=rect.top;y<rect.top+rect.height;y++)for(let x=0;x<1440;x++)raw[(y*1440+x)*4+3]=0;
 }
 await sharp(raw,{raw:{width:1440,height:3120,channels:4}}).png().toFile(dir+'/screen-apertures.png');
 const daysCrop={left:0,top:790,width:1080,height:255};
 const dayStates={none:48.2,l:49.2,lx:49.8,lxv:50.8};
 for(const [name,time]of Object.entries(dayStates))await sharp(frame(time)).extract(daysCrop).resize(1440,340).png().toFile(dir+'/days-'+name+'.png');
 // Border-aligned, uniformly scaled crops from original editor fields.
 const cells={series:{left:120,top:2329,width:276,height:168},reps:{left:428,top:2329,width:276,height:168},rir:{left:736,top:2329,width:276,height:168},rest:{left:1044,top:2329,width:276,height:168}};
 const fieldSources={rir:{time:54.8,crop:{left:552,top:1271,width:207,height:126}},rest:{time:56.6,crop:{left:783,top:1271,width:207,height:126}}};
 const exercise=await sharp(original).extract(bands.exercise).ensureAlpha().raw().toBuffer();
 for(const [id,rect]of Object.entries(cells)){
  await sharp(original).extract(rect).png().toFile(dir+'/field-'+id+'-original.png');
  for(let y=rect.top-bands.exercise.top;y<rect.top-bands.exercise.top+rect.height;y++)for(let x=rect.left;x<rect.left+rect.width;x++)exercise[(y*1440+x)*4+3]=0;
 }
 await sharp(exercise,{raw:{width:1440,height:925,channels:4}}).png().toFile(dir+'/exercise-field-apertures.png');
 for(const [id,s]of Object.entries(fieldSources))await sharp(frame(s.time)).extract(s.crop).resize(276,168).png().toFile(dir+'/field-'+id+'-focused.png');
 const manifest={sourceHashes,bands,days:{crop:daysCrop,states:dayStates},cells,fieldSources,missing:['Series: authentic focused/editing state at value 3','Reps: authentic focused/editing state at value 12'],operations:'Native screenshot crops and transparent apertures; video states uniformly resized 4/3. No redrawn UI.'};
 for(const [p,h]of Object.entries(sourceHashes))if(hash(p)!==h)throw Error('Original media changed');
 fs.writeFileSync(dir+'/provenance.json',JSON.stringify(manifest,null,2));
 await sharp({create:{width:552,height:336,channels:3,background:'#dddddd'}}).composite([{input:dir+'/field-rir-original.png',left:0,top:0},{input:dir+'/field-rir-focused.png',left:276,top:0},{input:dir+'/field-rest-original.png',left:0,top:168},{input:dir+'/field-rest-focused.png',left:276,top:168}]).png().toFile('overlay-proof/field-crops-review.png');
 console.log('Authentic floating UI crops prepared; originals unchanged.');
})().catch(e=>{console.error(e);process.exitCode=1});
