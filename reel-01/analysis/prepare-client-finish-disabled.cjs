// User-authorized localized disabled state; preserve original button geometry/glyphs.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/110f701c48e68d66/node_modules/hyperframes/package.json'),sharp=req('sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'assets/ui/client-finish-disabled'),proof=path.join(root,'client-finish-disabled-proof');
const enabled=path.join(root,'assets/ui/client-workout/finish-button.png'),reference=path.join(root,'assets/ui/coach-update/update-disabled-reference.png');
const screenshot=path.resolve(root,'../source/screenshots/SCREEN_04_PR_REAL.png');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
(async()=>{
 fs.mkdirSync(out,{recursive:true});fs.mkdirSync(proof,{recursive:true});
 const hashes=Object.fromEntries([enabled,reference,screenshot].map(p=>[path.relative(root,p).replaceAll('\\','/'),sha(p)]));
 const {data:original,info}=await sharp(enabled).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.width!==1332||info.height!==216)throw Error('Unexpected original button size');
 const greyPixel=await sharp(reference).extract({left:100,top:90,width:1,height:1}).removeAlpha().raw().toBuffer(),grey=[...greyPixel];
 const bluePixel=await sharp(enabled).extract({left:100,top:90,width:1,height:1}).removeAlpha().raw().toBuffer(),blue=[...bluePixel];
 const result=Buffer.from(original),foreground={left:340,top:35,width:670,height:145};
 let preservedWhiteGlyphPixels=0,blueResidue=0,changedOutsideGlyphArea=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const p=(y*info.width+x)*4,r=original[p],g=original[p+1],b=original[p+2];
  const glyphArea=x>=foreground.left&&x<foreground.left+foreground.width&&y>=foreground.top&&y<foreground.top+foreground.height;
  if(glyphArea){
   const ink=clamp((r-blue[0])/(255-blue[0]));
   for(let c=0;c<3;c++)result[p+c]=Math.round(grey[c]+(255-grey[c])*ink);
   // Full white source glyph pixels are kept verbatim; only their antialiased
   // edges are recomposited onto the requested grey native paper.
   if(Math.min(r,g,b)>=245&&Math.max(r,g,b)-Math.min(r,g,b)<=3){original.copy(result,p,p,p+4);preservedWhiteGlyphPixels++;}
  }else{
   const coverage=clamp((255-r)/(255-blue[0]));
   for(let c=0;c<3;c++)result[p+c]=Math.round(255+(grey[c]-255)*coverage);
   if(Math.max(Math.abs(result[p]-r),Math.abs(result[p+1]-g),Math.abs(result[p+2]-b))>0)changedOutsideGlyphArea++;
  }
  if(result[p+2]>result[p]+8||result[p+2]>result[p+1]+8)blueResidue++;
  if(result[p+3]!==original[p+3])throw Error('Original raster alpha changed');
 }
 if(blueResidue)throw Error('Blue pixel residue remains');
 if(preservedWhiteGlyphPixels<500)throw Error('Original white glyph foreground is missing');
 const target=path.join(out,'finish-disabled.png');
 await sharp(result,{raw:info}).png().toFile(target);
 const comparison=await sharp({create:{width:1332,height:432,channels:4,background:'#fff'}}).composite([{input:enabled,left:0,top:0},{input:target,left:0,top:216}]).png().toFile(path.join(proof,'comparison.png'));
 for(const[p,h]of Object.entries(hashes))if(sha(path.resolve(root,p))!==h)throw Error('Original source changed: '+p);
 const manifest={sourceHashes:hashes,sourceButton:'assets/ui/client-workout/finish-button.png',nativeSourceScreenshot:'source/screenshots/SCREEN_04_PR_REAL.png',greyPaperSource:{file:'assets/ui/coach-update/update-disabled-reference.png',sample:{left:100,top:90},rgb:grey,hex:'#'+grey.map(v=>v.toString(16).padStart(2,'0')).join('')},sourceBlue:blue,sourceBox:{left:54,top:2796,width:1332,height:216},logicalBox:{left:9,top:466,width:222,height:36},file:'assets/ui/client-finish-disabled/finish-disabled.png',sourceDimensions:{width:1332,height:216},foregroundArea:foreground,operation:'Only native blue button paper is changed to grey sampled from the original Coach disabled button. Original Terminar Rutina wording/check/positions/proportions and corner coverage are retained. White glyph cores remain original pixels; antialiased edges are recomposited onto grey, preventing blue fringes. No font or control is redrawn.',stateAvailability:'No exact grey Terminar Rutina screenshot found in SCREEN_03/SCREEN_04 or inspected original completion frames. This specific grey+white state is a user-authorized localized variant, not a claim of a captured Flutter state.',verification:{originalHashesUnchanged:true,alphaUnchanged:true,blueResiduePixels:blueResidue,preservedOriginalWhiteGlyphPixels:preservedWhiteGlyphPixels,outputSha256:sha(target)},integration:{id:'client-finish-button-disabled',class:'screen-button',geometry:'Same box as client-finish-button; initial opacity0.',tapSelectors:'#client-finish-button,#client-finish-button-disabled',tapAt:13.17,swapAt:13.29,loaderAtUnchanged:13.32,swap:'Hard state handoff (enabled opacity0; disabled opacity1) on the same GSAP timeline. Keep disabled visible until the screen fades; do not tween back to enabled.'}};
 fs.writeFileSync(path.join(out,'provenance.json'),JSON.stringify(manifest,null,2));
 console.log(JSON.stringify({file:manifest.file,grey,preservedWhiteGlyphPixels,blueResidue,box:manifest.logicalBox},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
