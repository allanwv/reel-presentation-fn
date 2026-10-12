const fs=require('fs'),path=require('path'),crypto=require('crypto');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/package.json');
const sharp=req('sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'assets/ui/client-workout'),proof=path.join(root,'client-workout-proof');
const screenshot=path.resolve(root,'../source/screenshots/SCREEN_04_PR_REAL.png'),video=path.resolve(root,'../source/videos/VIDEO_02_CLIENT_WORKOUT_FULL.mp4'),videoFrame=path.join(proof,'video-40.png');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const card={left:0,top:1500,width:1440,height:840},row={left:0,top:2124,width:1440,height:212},button={left:54,top:2796,width:1332,height:216};
const features={weight:{left:674,top:2184,width:115,height:84},reps:{left:1025,top:2184,width:116,height:84},previous:{left:286,top:2184,width:182,height:84},medal:{left:55,top:2153,width:135,height:166},check:{left:1264,top:2168,width:120,height:120}};
const pendingCheck={left:946,top:1504,width:100,height:100},pendingNumber={left:68,top:1522,width:43,height:56};
function removeGold(data,w,h){
 const result=Buffer.alloc(w*h*4);
 for(let i=0;i<w*h;i++){
   const s=i*4,r=data[s],g=data[s+1],b=data[s+2];
   // Preserve authentic dark numeral pixels. Only the gold paper surrounding them is removed.
   const d=Math.max(255-r,249-g,227-b,0),a=Math.min(1,Math.max(0,(d-9)/24));
   result[s]=r;result[s+1]=g;result[s+2]=b;result[s+3]=Math.round(a*data[s+3]);
 }
 return result;
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});fs.mkdirSync(proof,{recursive:true});
 const before=hash(screenshot),videoHash=hash(video),meta=await sharp(screenshot).metadata();
 if(meta.width!==1440||meta.height!==3120)throw Error('Unexpected screenshot dimensions');
 const original=await sharp(screenshot).ensureAlpha().raw().toBuffer(),aperture=Buffer.from(original);
 for(const b of [card,button])for(let y=b.top;y<b.top+b.height;y++)for(let x=b.left;x<b.left+b.width;x++)aperture[(y*1440+x)*4+3]=0;
 await sharp(aperture,{raw:{width:1440,height:3120,channels:4}}).png().toFile(path.join(out,'screen-apertures.png'));
 await sharp(screenshot).extract(card).png().toFile(path.join(out,'series-card-original.png'));
 await sharp(screenshot).extract(row).png().toFile(path.join(out,'series-row-completed.png'));
 await sharp(screenshot).extract(button).png().toFile(path.join(out,'finish-button.png'));
 const cardData=await sharp(screenshot).extract(card).ensureAlpha().raw().toBuffer();
 for(let y=row.top-card.top;y<row.top-card.top+row.height;y++)for(let x=0;x<1440;x++)cardData[(y*1440+x)*4+3]=0;
 await sharp(cardData,{raw:{width:1440,height:840,channels:4}}).png().toFile(path.join(out,'series-card-apertures.png'));
 const pending=sharp({create:{width:1440,height:212,channels:4,background:'#fff'}}),parts=[];
 for(const name of ['previous','weight','reps']){
  const b=features[name],raw=await sharp(screenshot).extract(b).ensureAlpha().raw().toBuffer(),isolated=removeGold(raw,b.width,b.height);
  const png=await sharp(isolated,{raw:{width:b.width,height:b.height,channels:4}}).png().toBuffer();
  parts.push({input:png,left:b.left,top:b.top-row.top});
  await sharp(isolated,{raw:{width:b.width,height:b.height,channels:4}}).png().toFile(path.join(out,`${name}-ink.png`));
  await sharp(screenshot).extract(b).png().toFile(path.join(out,`${name}-original.png`));
 }
 const control=await sharp(videoFrame).extract(pendingCheck).resize({width:120,height:120}).png().toBuffer();
 await sharp(control).toFile(path.join(out,'check-pending.png'));
 parts.push({input:control,left:features.check.left,top:features.check.top-row.top});
 const num=await sharp(videoFrame).extract(pendingNumber).resize({width:57,height:75}).png().toBuffer();
 await sharp(num).toFile(path.join(out,'set-three-pending.png'));
 parts.push({input:num,left:92,top:60});
 await pending.composite(parts).png().toFile(path.join(out,'series-row-pending.png'));
 for(const name of ['medal','check'])await sharp(screenshot).extract(features[name]).png().toFile(path.join(out,`${name}-original.png`));
 // A fixed, opaque native-color backing prevents original values or pending
 // controls from becoming visible when one completed feature is pulsed.
 const completedRaw=await sharp(screenshot).extract(row).ensureAlpha().raw().toBuffer(),completedClean=Buffer.from(completedRaw);
 for(const name of ['weight','reps','medal','check']){
  const b=features[name];
  for(let y=b.top-row.top;y<b.top-row.top+b.height;y++)for(let x=b.left;x<b.left+b.width;x++){
   const p=(y*1440+x)*4,s=(y*1440+900)*4;
   completedRaw.copy(completedClean,p,s,s+4);
  }
 }
 await sharp(completedClean,{raw:{width:1440,height:212,channels:4}}).png().toFile(path.join(out,'series-row-completed-clean.png'));
 const separated=await sharp(completedClean,{raw:{width:1440,height:212,channels:4}}).composite(['weight','reps','medal','check'].map(name=>({input:path.join(out,`${name}-original.png`),left:features[name].left,top:features[name].top-row.top}))).raw().toBuffer();
 if(!separated.equals(completedRaw))throw Error('Independent row features do not reconstruct exact completed screenshot');
 const completedCard=await sharp(cardData,{raw:{width:1440,height:840,channels:4}}).composite([{input:path.join(out,'series-row-completed.png'),left:0,top:624}]).png().toBuffer();
 const pendingCard=await sharp(cardData,{raw:{width:1440,height:840,channels:4}}).composite([{input:path.join(out,'series-row-pending.png'),left:0,top:624}]).png().toBuffer();
 await sharp(pendingCard).png().toFile(path.join(out,'series-card-pending.png'));
 await sharp(completedCard).png().toFile(path.join(out,'series-card-completed.png'));
 const exactRaw=await sharp(completedCard).ensureAlpha().raw().toBuffer(),expectedRaw=await sharp(screenshot).extract(card).ensureAlpha().raw().toBuffer();
 if(!exactRaw.equals(expectedRaw))throw Error('Completed card differs from original screenshot');
 const reconstructed=await sharp(aperture,{raw:{width:1440,height:3120,channels:4}}).composite([{input:completedCard,left:0,top:1500},{input:path.join(out,'finish-button.png'),left:54,top:2796}]).raw().toBuffer();
 if(!reconstructed.equals(original))throw Error('Screen apertures do not reconstruct exact final screenshot');
 const qaTop=await sharp({create:{width:1440,height:930,channels:4,background:'#eceff4'}}).composite([
  {input:await sharp(pendingCard).resize({width:720}).png().toBuffer(),left:0,top:0},
  {input:await sharp(completedCard).resize({width:720}).png().toBuffer(),left:720,top:0},
  {input:await sharp(screenshot).extract(row).resize({width:1440}).png().toBuffer(),left:0,top:450},
  {input:await sharp(path.join(out,'finish-button.png')).resize({width:1332}).png().toBuffer(),left:54,top:690}
 ]).png().toFile(path.join(proof,'asset-contact-sheet.png'));
 if(before!==hash(screenshot)||videoHash!==hash(video))throw Error('Original media changed');
 const manifest={source:'source/screenshots/SCREEN_04_PR_REAL.png',sourceDimensions:{width:1440,height:3120},sourceSha256:before,videoSource:'source/videos/VIDEO_02_CLIENT_WORKOUT_FULL.mp4',videoSha256:videoHash,videoFrame:{seconds:40,width:1080,height:2340},card,row,button,features,pendingCheck,pendingNumber,
  logicalScale:1/6,logicalCard:{left:0,top:250,width:240,height:140},logicalRow:{left:0,top:104,width:240,height:35.333333333333336},logicalButton:{left:9,top:466,width:222,height:36},
  exactFinalReconstruction:true,
  limitation:'Video 02 contains a different exercise and different loads. The exact 75 kg x 10 pending-to-PR transition is unavailable. Pending row is a localized mask variant: genuine 75, 10 and previous 70x10 pixels retained from SCREEN_04; genuine unchecked control and set digit 3 extracted from video at 40 s. Completed row, medal, green check and finish button are exact screenshot crops. No new metrics or messages.',
  motionGuidance:'Use series-card-apertures as fixed background. Keep pending row fixed. Fade completed row container 0 to 1, then retain it. Both rows start at row.top-card.top = 624 screenshot px (104 logical). For independent metric/medal/check pulses, completed container contains series-row-completed-clean plus weight/reps/medal/check-original crops at features coordinates relative to row. Clean backing removes original foreground copies and uses authentic nearby yellow paper pixels; opaque backing prevents pending content showing through while features move. Composite at rest reconstructs the exact screenshot. Keep pulses subtle within row bounds. Simpler option is series-row-completed as one rigid object.',
  assetHashes:Object.fromEntries(fs.readdirSync(out).filter(n=>n.endsWith('.png')).map(n=>[n,hash(path.join(out,n))]))};
 fs.writeFileSync(path.join(out,'provenance.json'),JSON.stringify(manifest,null,2));
 console.log(JSON.stringify({out,exactFinalReconstruction:true,card,button,limitation:manifest.limitation},null,2));
})();
