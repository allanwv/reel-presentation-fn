// Derived pixels only: immutable originals and existing PR layers are never overwritten.
const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/110f701c48e68d66/node_modules/hyperframes/package.json'),sharp=req('sharp');
sharp.concurrency(2);
const out='assets/ui/client-completion',proof='completion-proof',source='../source/screenshots/SCREEN_04_PR_REAL.png';
const ffmpeg='C:/Users/aweis/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe';
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const originals=[source,'../source/videos/VIDEO_02_CLIENT_WORKOUT_FULL.mp4',...['LOADING','SERPENTINA'].map(s=>'../source/screenshots/SCREEN_10_WORKOUT_COMPLETE_'+s+'.png'),'../source/screenshots/SCREEN_10_WORKOUT_COMPLETED.png'];
(async()=>{
 fs.mkdirSync(out,{recursive:true});fs.mkdirSync(proof+'/particle-source',{recursive:true});
 const sourceHashes=Object.fromEntries(originals.map(f=>[f,hash(f)])),rows=[{top:1696,height:214},{top:1910,height:214}];
 const original=await sharp(source).ensureAlpha().raw().toBuffer(),card=await sharp('assets/ui/client-workout/series-card-apertures.png').ensureAlpha().raw().toBuffer(),ink=[];
 const pendingControl=await sharp('assets/ui/client-workout/check-pending.png').png().toBuffer();
 for(let n=0;n<2;n++){
  const b=rows[n],completed=await sharp(source).extract({left:0,top:b.top,width:1440,height:b.height}).png().toBuffer();
  fs.writeFileSync(out+'/set-'+(n+1)+'-completed.png',completed);
  const raw=await sharp(completed).ensureAlpha().raw().toBuffer(),pending=Buffer.from(raw);
  // Remove only the native green paper. All numeral and label pixels are retained.
  for(let p=0;p<raw.length;p+=4){const r=raw[p],g=raw[p+1],b=raw[p+2];if(g>=r&&g>=b&&g-r>3){pending[p]=Math.min(255,r+16);pending[p+1]=g;pending[p+2]=Math.min(255,b+11);}}
  const check={left:1264,top:rows[0].top===b.top?44:44,width:120,height:120};
  const pendingPng=await sharp(pending,{raw:{width:1440,height:b.height,channels:4}}).composite([{input:pendingControl,left:check.left,top:check.top}]).png().toBuffer();
  fs.writeFileSync(out+'/set-'+(n+1)+'-pending.png',pendingPng);
  for(let y=b.top-1500;y<b.top-1500+b.height;y++)for(let x=0;x<1440;x++)card[(y*1440+x)*4+3]=0;
  ink.push({row:n+1,sourceBox:{left:0,top:b.top,width:1440,height:b.height},logicalTop:(b.top-1500)/6,logicalHeight:b.height/6,check});
 }
 await sharp(card,{raw:{width:1440,height:840,channels:4}}).png().toFile(out+'/series-card-three-apertures.png');
 const exact=await sharp(card,{raw:{width:1440,height:840,channels:4}}).composite(rows.map((b,i)=>({input:out+'/set-'+(i+1)+'-completed.png',left:0,top:b.top-1500})).concat([{input:'assets/ui/client-workout/series-row-completed.png',left:0,top:624}])).ensureAlpha().raw().toBuffer();
 const expected=await sharp(source).extract({left:0,top:1500,width:1440,height:840}).ensureAlpha().raw().toBuffer();
 if(!exact.equals(expected))throw Error('Completed series must reconstruct the authentic screenshot exactly');
 fs.copyFileSync('../source/screenshots/SCREEN_10_WORKOUT_COMPLETED.png',out+'/workout-completed.png');
 fs.copyFileSync('../source/screenshots/SCREEN_10_WORKOUT_COMPLETE_LOADING.png',out+'/workout-loading.png');
 // Decode only the real celebration, plus one clean reference frame. Never reanalyse the full recording.
 if(!fs.existsSync(proof+'/particle-source/frame-205.png'))cp.execFileSync(ffmpeg,['-v','error','-ss','53.96','-i','../source/videos/VIDEO_02_CLIENT_WORKOUT_FULL.mp4','-t','6.84','-vf','fps=30,scale=600:1300','-y',proof+'/particle-source/frame-%03d.png'],{windowsHide:true});
 if(!fs.existsSync(proof+'/particle-source/clean.png'))cp.execFileSync(ffmpeg,['-v','error','-ss','60.8','-i','../source/videos/VIDEO_02_CLIENT_WORKOUT_FULL.mp4','-frames:v','1','-vf','scale=600:1300','-y',proof+'/particle-source/clean.png'],{windowsHide:true});
 const clean=await sharp(proof+'/particle-source/clean.png').removeAlpha().raw().toBuffer();
 const frames=fs.readdirSync(proof+'/particle-source').filter(f=>/^frame-\d+\.png$/.test(f)).sort(),textures=[];
 for(const [index,f] of frames.entries()){
  const rgb=await sharp(proof+'/particle-source/'+f).removeAlpha().raw().toBuffer(),rgba=Buffer.alloc(600*1300*4);
  for(let p=0,j=0;p<rgb.length;p+=3,j+=4){const r=rgb[p],g=rgb[p+1],b=rgb[p+2],sat=Math.max(r,g,b)-Math.min(r,g,b),delta=Math.max(Math.abs(r-clean[p]),Math.abs(g-clean[p+1]),Math.abs(b-clean[p+2]));
   // The original recording's static interface is subtracted. Neutral text, shimmer,
   // status icons and real blue links are not celebration particles.
   const isUiBlue=Math.abs(r-47)<21&&Math.abs(g-128)<15&&Math.abs(b-237)<20;
   const palette=[[255,216,0],[129,199,132],[84,201,240],[229,57,53],[33,150,243],[179,157,219]];
   const colorDistance=Math.min(...palette.map(c=>Math.hypot(r-c[0],g-c[1],b-c[2])));
   if(p/3>=600*42&&sat>46&&delta>38&&!isUiBlue&&colorDistance<32){rgba[j]=r;rgba[j+1]=g;rgba[j+2]=b;rgba[j+3]=Math.min(255,(sat-46)*15,(delta-38)*16);}
  }
  textures.push(await sharp(rgba,{raw:{width:600,height:1300,channels:4}}).resize(360,780).png().toBuffer());
 }
 const pageFrames=20,atlases=[];
 for(let i=0;i<textures.length;i+=pageFrames){const name='serpentinas-'+String(atlases.length).padStart(2,'0')+'.png';await sharp({create:{width:1800,height:3120,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(textures.slice(i,i+pageFrames).map((input,j)=>({input,left:(j%5)*360,top:Math.floor(j/5)*780}))).png().toFile(out+'/'+name);atlases.push(name);}
 const qa=[];for(const i of [0,15,30,60,100,145,180,204].filter(i=>i<textures.length)){qa.push({input:await sharp({create:{width:360,height:780,channels:4,background:'#fff'}}).composite([{input:textures[i]}]).png().toBuffer(),left:(qa.length%4)*360,top:Math.floor(qa.length/4)*780});}
 await sharp({create:{width:1440,height:1560,channels:4,background:'#fff'}}).composite(qa).png().toFile(proof+'/real-particles-contact-sheet.png');
 const manifest={sourceHashes,rows:ink,exactCompletedCardReconstruction:true,prLayersUnchanged:true,celebration:{source:'source/videos/VIDEO_02_CLIENT_WORKOUT_FULL.mp4',start:53.96,end:60.80,fps:30,frames:textures.length,atlasColumns:5,atlasRows:4,frameWidth:360,frameHeight:780,atlases,method:'Real video pixels with static UI subtraction and neutral/blue-link rejection; no generated confetti or reconstructed trajectories.'},loading:{sourceDimensions:[412,787],logicalBox:[0,15,240,458.45],note:'Original screenshot is a cropped capture of a different routine; white padding preserves text proportions. Its original text and figures remain unchanged.'},final:'Exact byte copy of SCREEN_10_WORKOUT_COMPLETED.png'};
 for(const[f,h]of Object.entries(sourceHashes))if(hash(f)!==h)throw Error('Original modified '+f);
 fs.writeFileSync(out+'/provenance.json',JSON.stringify(manifest,null,2));console.log(JSON.stringify({rows:ink,frames:textures.length,atlases:atlases.length,exactCompletedCardReconstruction:true}));
})().catch(e=>{console.error(e);process.exitCode=1;});
