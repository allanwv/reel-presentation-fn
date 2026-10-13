// Authentic screenshot pixels only. Existing production files are immutable inputs.
const fs=require('fs'),crypto=require('crypto');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/package.json');
const sharp=req('sharp');
const out='assets/ui/client-series-expanded';
const source='../source/screenshots/SCREEN_04_PR_REAL.png';
const screen='assets/ui/client-workout/screen-apertures.png';
const previousCard='assets/ui/client-completion/series-card-three-apertures.png';
const oldBox={left:0,top:1500,width:1440,height:840};
const box={left:0,top:690,width:1440,height:1650};
const rows=[{id:'set-1',top:1696,height:214,file:'assets/ui/client-completion/set-1-completed.png'},{id:'set-2',top:1910,height:214,file:'assets/ui/client-completion/set-2-completed.png'},{id:'pr',top:2124,height:212,file:'assets/ui/client-workout/series-row-completed.png'}];
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const sources=[source,screen,previousCard,...rows.map(r=>r.file),'assets/ui/client-workout/finish-button.png'];
 const sourceHashes=Object.fromEntries(sources.map(p=>[p,hash(p)]));
 const original=await sharp(source).ensureAlpha().raw().toBuffer();
 const oldScreen=await sharp(screen).ensureAlpha().raw().toBuffer(),newScreen=Buffer.from(oldScreen);
 const oldCard=await sharp(previousCard).ensureAlpha().raw().toBuffer();
 const expanded=await sharp(source).extract(box).ensureAlpha().raw().toBuffer();
 // The existing three-row aperture area is copied byte-for-byte below the header.
 oldCard.copy(expanded,(oldBox.top-box.top)*1440*4);
 for(let y=box.top;y<box.top+box.height;y++)for(let x=0;x<1440;x++)newScreen[(y*1440+x)*4+3]=0;
 const baseFile=out+'/screen-apertures.png',cardFile=out+'/series-card-three-apertures.png';
 await sharp(newScreen,{raw:{width:1440,height:3120,channels:4}}).png().toFile(baseFile);
 await sharp(expanded,{raw:{width:box.width,height:box.height,channels:4}}).png().toFile(cardFile);
 await sharp(source).extract({left:0,top:box.top,width:1440,height:oldBox.top-box.top}).png().toFile(out+'/authentic-exercise-header.png');
 const completed=await sharp(expanded,{raw:{width:box.width,height:box.height,channels:4}}).composite(rows.map(r=>({input:r.file,left:0,top:r.top-box.top}))).ensureAlpha().raw().toBuffer();
 const expected=await sharp(source).extract(box).ensureAlpha().raw().toBuffer();
 if(!completed.equals(expected))throw Error('Expanded completed card differs from the authentic source crop');
 const full=await sharp(newScreen,{raw:{width:1440,height:3120,channels:4}}).composite([{input:await sharp(completed,{raw:{width:box.width,height:box.height,channels:4}}).png().toBuffer(),left:0,top:box.top},{input:'assets/ui/client-workout/finish-button.png',left:54,top:2796}]).ensureAlpha().raw().toBuffer();
 if(!full.equals(original))throw Error('Screen + expanded card + completed rows + button must reconstruct the exact original screenshot');
 let outsideChanged=0;
 for(let y=0;y<3120;y++)for(let x=0;x<1440;x++)if(!(y>=box.top&&y<box.top+box.height)){
   const p=(y*1440+x)*4;if(!newScreen.subarray(p,p+4).equals(oldScreen.subarray(p,p+4)))outsideChanged++;
 }
 if(outsideChanged)throw Error('Screen outside expanded card changed');
 for(const[p,h]of Object.entries(sourceHashes))if(hash(p)!==h)throw Error('Source input modified: '+p);
 await sharp(completed,{raw:{width:box.width,height:box.height,channels:4}}).resize({width:720}).png().toFile(out+'/expanded-card-preview.png');
 const manifest={sourceHashes,sourceSize:{width:1440,height:3120},oldBox,box,logicalBox:{left:0,top:115,width:240,height:275},header:{sourceBox:{left:0,top:690,width:1440,height:810},content:'Authentic exercise thumbnail, name, Piernas chip, timer/menu controls, instructions icon, Reps/RIR/Descanso labels and values; no title or control reconstructed.'},offsets:{addedPixels:810,addedLogicalPixels:135,oldContentTop:135,oldPivotLogical:{x:120,y:70},newPivotToPreserveRowMotion:{x:120,y:205}},rows:rows.map(r=>({id:r.id,screenTop:r.top,oldLogicalTop:(r.top-oldBox.top)/6,newLogicalTop:(r.top-box.top)/6,height:r.height/6,existingAsset:r.file})),integration:'Replace only screen and card surface sources with this directory. Change outer card CSS and cards.add box to logicalBox. Add 135 logical px to .client-set-row and .client-record-row top values. Preserve feature positions inside each row. Override the floating card transform-origin to 120px 205px to preserve the old card motion pivot (and thus all existing row trajectories), or intentionally use the new center if choreography is being adjusted. Existing row state/tap animations require no changes.',verification:{originalInputsUnchanged:true,previousCardAreaByteIdentical:true,screenPixelsChangedOutsideExpandedBox:outsideChanged,exactCompletedCardReconstruction:true,exactFullScreenReconstruction:true}};
 fs.writeFileSync(out+'/provenance.json',JSON.stringify(manifest,null,2));
 console.log(JSON.stringify({box,logicalBox:manifest.logicalBox,rows:manifest.rows,verification:manifest.verification}));
})().catch(e=>{console.error(e);process.exitCode=1;});
