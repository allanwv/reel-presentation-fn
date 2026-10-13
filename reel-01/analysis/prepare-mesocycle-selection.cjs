const fs=require('fs'),req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/110f701c48e68d66/node_modules/hyperframes/package.json'),sharp=req('sharp');
(async()=>{
 const dir='assets/ui/mesocycle-selection';fs.mkdirSync(dir,{recursive:true});
 const menu=await sharp('assets/ui/mesocycle/menu-open.png').ensureAlpha().raw().toBuffer({resolveWithObject:true}),w=menu.info.width,h=menu.info.height;
 const png=(data,file,width=w,height=h)=>sharp(data,{raw:{width,height,channels:4}}).png().toFile(dir+'/'+file);
 const base=Buffer.from(menu.data);
 // Preserve native alpha, rounded contour and divider. Isolate only the existing
 // glyphs/check/highlight so the selected row can change without repaint flashes.
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(y>=169&&y<=181)continue;const p=(y*w+x)*4;base[p]=base[p+1]=base[p+2]=255;}
 function mask(box,bg,ink,name){
  const out=Buffer.alloc(w*h*4);for(let y=box[1];y<box[3];y++)for(let x=box[0];x<box[2];x++){
   const p=(y*w+x)*4;let num=0,den=0;for(let c=0;c<3;c++){num+=(bg[c]-menu.data[p+c])*(bg[c]-ink[c]);den+=(bg[c]-ink[c])**2;}
   const a=Math.max(0,Math.min(1,num/den));out[p]=ink[0];out[p+1]=ink[1];out[p+2]=ink[2];out[p+3]=Math.round(a*menu.data[p+3]);
  }return png(out,name);
 }
 await Promise.all([
  png(base,'menu-base.png'),
  mask([28,65,345,120],[255,255,255],[49,49,49],'independent-mask.png'),
  mask([27,200,350,248],[228,228,228],[49,128,237],'meso-mask.png'),
  mask([27,260,330,303],[228,228,228],[180,180,180],'subtitle.png'),
  mask([390,227,440,272],[228,228,228],[49,128,237],'check.png')
 ]);
 const card=await sharp('assets/ui/mesocycle/card-closed.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const source=await sharp('iphone-refinement-proof/coach-source-35.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
 function bbox(img,b){let x0=Infinity,y0=Infinity,x1=0,y1=0;for(let y=b[1];y<b[3];y++)for(let x=b[0];x<b[2];x++){const p=(y*img.info.width+x)*4;if(Math.max(...img.data.subarray(p,p+3))<90&&img.data[p+3]>200){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}}return{left:x0,top:y0,width:x1-x0+1,height:y1-y0+1};}
 const target=bbox(card,[95,45,435,140]),from=bbox(source,[65,380,450,470]);
 if(!Number.isFinite(from.left))throw Error('Native Independiente value not found');
 const glyph=await sharp('iphone-refinement-proof/coach-source-35.png').extract({...from,left:from.left-2,top:from.top-2,width:from.width+4,height:from.height+4}).resize({height:target.height+4}).png().toBuffer();
 const initial=Buffer.from(card.data);
 for(let y=50;y<145;y++)for(let x=95;x<690;x++){const p=(y*card.info.width+x)*4;initial[p]=initial[p+1]=initial[p+2]=255;}
 await sharp(initial,{raw:card.info}).composite([{input:glyph,left:target.left-2,top:target.top-2}]).png().toFile(dir+'/card-independent.png');
 fs.writeFileSync(dir+'/provenance.json',JSON.stringify({field:{source:'source/videos/VIDEO_01_COACH_ROUTINE_ASSIGN.mp4',at:35,crop:from,target,operation:'Native Independiente glyph pixels uniformly scaled into the original card value area; localized white patch only.'},dropdown:{source:'reel-01/assets/ui/mesocycle/menu-open.png',operation:'Original rounded alpha/divider and original label/check masks. Selected row color sampled RGB 228,228,228; original selected/unselected label colors.'}},null,2));
 console.log(JSON.stringify({from,target,dir}));
})().catch(e=>{console.error(e);process.exitCode=1;});
