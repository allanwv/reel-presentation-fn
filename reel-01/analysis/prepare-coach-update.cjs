const fs=require('fs'),crypto=require('crypto');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/package.json');
const sharp=req('sharp');
const source='../source/screenshots/SCREEN_01_COACH_ROUTINE.png';
const existing='assets/ui/floating/screen-apertures.png';
const video='../source/videos/VIDEO_01_COACH_ROUTINE_ASSIGN.mp4';
const out='assets/ui/coach-update';
const box={left:54,top:2828,width:1332,height:181};
const ink={left:530,top:2880,right:890,bottom:2955};
const blue=[47,128,237],white=[255,255,255];
const clamp=n=>Math.max(0,Math.min(1,n));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const hashes={[source]:hash(source),[existing]:hash(existing),[video]:hash(video)};
 const {data:native,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const base=await sharp(existing).ensureAlpha().raw().toBuffer();
 const backing=Buffer.from(base),patch=Buffer.alloc(box.width*box.height*4);
 for(let y=0;y<box.height;y++)for(let x=0;x<box.width;x++){
   const sx=x+box.left,sy=y+box.top,s=(sy*info.width+sx)*4,p=(y*box.width+x)*4;
   const lum=(native[s]+native[s+1]+native[s+2])/3;
   const isInk=sx>=ink.left&&sx<ink.right&&sy>=ink.top&&sy<ink.bottom;
   const shape=isInk?1:clamp((255-lum)/(255-224));
   // Preserve raster edges, letterforms and checkmark. Recolor only their pixels.
   const text=isInk&&lum<221?clamp((224-lum)/(224-158)):0;
   for(let c=0;c<3;c++)patch[p+c]=Math.round(blue[c]+(white[c]-blue[c])*text);
   patch[p+3]=Math.round(255*shape);
   backing[s+3]=0;
 }
 const patchFile=out+'/update-enabled.png',baseFile=out+'/screen-apertures-with-update-hole.png';
 await sharp(patch,{raw:{width:box.width,height:box.height,channels:4}}).png().toFile(patchFile);
 await sharp(backing,{raw:{width:info.width,height:info.height,channels:4}}).png().toFile(baseFile);
 await sharp(source).extract(box).png().toFile(out+'/update-disabled-reference.png');
 const detail=await sharp({create:{width:box.width,height:box.height,channels:4,background:'#fff'}}).composite([{input:patchFile}]).png().toBuffer();
 await sharp({create:{width:box.width,height:box.height*2,channels:4,background:'#fff'}}).composite([{input:out+'/update-disabled-reference.png',left:0,top:0},{input:detail,left:0,top:box.height}]).png().toFile(out+'/detail-before-after.png');
 let changedOutside=0,residualOldGray=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
   const inside=x>=box.left&&x<box.left+box.width&&y>=box.top&&y<box.top+box.height,i=(y*info.width+x)*4;
   if(!inside&&!backing.subarray(i,i+4).equals(base.subarray(i,i+4)))changedOutside++;
 }
 for(let p=0;p<patch.length;p+=4)if(patch[p+3]&&patch[p]===patch[p+1]&&patch[p+1]===patch[p+2]&&patch[p]<250)residualOldGray++;
 if(changedOutside||residualOldGray)throw Error('Localized recolor verification failed');
 for(const[p,h]of Object.entries(hashes))if(hash(p)!==h)throw Error('Original modified '+p);
 const provenance={sourceHashes:hashes,sourceSize:{width:1440,height:3120},buttonBox:box,cssBox:Object.fromEntries(Object.entries(box).map(([k,v])=>[k,v/6])),detectedOriginalCoverage:{left:56,top:2830,right:1383,bottom:3006},enabledColor:'#2F80ED',textIconColor:'#FFFFFF',authenticEnabledState:{source:video,time:60,note:'The original recording shows the blue enabled Actualizar button with white check/text. Its visual state was inspected; the production patch retains screenshot geometry and glyph pixels.'},files:{enabledPatch:patchFile,screenWithHole:baseFile},operation:'Raster-derived button coverage and foreground alpha. Original disabled surface and its glyphs are recolored locally; no redrawn text, icon or shape. Base screenshot is identical outside the button rectangle and contains no old button pixels in that rectangle.',verification:{sourceHashesUnchanged:true,outsideButtonPixelsChanged:changedOutside,residualOldGrayPixels:residualOldGray}};
 fs.writeFileSync(out+'/provenance.json',JSON.stringify(provenance,null,2));
 console.log(JSON.stringify(provenance.verification));
})().catch(e=>{console.error(e);process.exitCode=1;});
