import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/package.json');
const sharp=require('sharp'),fontkit=require('fontkit');
const dir=import.meta.dirname;
const image=await sharp(path.join(dir,'reference-07.png')).removeAlpha().raw().toBuffer();
let minX=720,minY=1280,maxX=0,maxY=0;
for(let y=640;y<730;y++)for(let x=70;x<650;x++){if(image[(y*720+x)*3]>140){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}
const w=maxX-minX+1,h=maxY-minY+1;
const target=Buffer.alloc(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++)target[y*w+x]=Math.max(0,Math.min(255,(image[((minY+y)*720+minX+x)*3]-8)*255/233));
await sharp(target,{raw:{width:w,height:h,channels:1}}).png().toFile(path.join(dir,'type-target-mask.png'));
const candidates=[['Arial Bold','C:/Windows/Fonts/arialbd.ttf'],['Segoe UI Bold','C:/Windows/Fonts/segoeuib.ttf'],['Segoe UI Semibold','C:/Windows/Fonts/seguisb.ttf'],['Calibri Bold','C:/Windows/Fonts/calibrib.ttf']];
const report=[],layers=[];
layers.push({input:await sharp(target,{raw:{width:w,height:h,channels:1}}).resize(w*2,h*2).png().toBuffer(),left:0,top:0});
for(let index=0;index<candidates.length;index++){
 const [name,file]=candidates[index];const font=fontkit.openSync(file);
 const run=font.layout('Próximamente');let pen=0,paths='';
 for(let i=0;i<run.glyphs.length;i++){const p=run.positions[i];paths+=`<path transform="translate(${pen+p.xOffset},${p.yOffset})" d="${run.glyphs[i].path.toSVG()}"/>`;pen+=p.xAdvance;}
 const svg=Buffer.from(`<svg width="${Math.ceil(pen*.12)}" height="${Math.ceil(font.unitsPerEm*.16)}" viewBox="0 0 ${pen} ${font.unitsPerEm*1.34}"><g fill="white" transform="translate(0,${font.unitsPerEm}) scale(1,-1)">${paths}</g></svg>`);
 const rendered=await sharp(svg).trim().resize(w,h,{fit:'fill'}).ensureAlpha().raw().toBuffer();
 let error=0;const mask=Buffer.alloc(w*h);for(let i=0;i<w*h;i++){mask[i]=rendered[i*4+3];error+=Math.abs(mask[i]-target[i]);}
 const naturalRatio=pen/font.unitsPerEm;
 report.push({name,error:error/(w*h*255),naturalWidthAt100:naturalRatio*100});
 layers.push({input:await sharp(mask,{raw:{width:w,height:h,channels:1}}).resize(w*2,h*2).png().toBuffer(),left:0,top:(index+1)*(h*2+30)});
 layers.push({input:Buffer.from(`<svg width="${w*2}" height="30"><text x="8" y="22" font-family="Arial" font-size="20" fill="white">${name}</text></svg>`),left:0,top:(index+1)*(h*2+30)+h*2});
}
await sharp({create:{width:w*2,height:5*(h*2+30),channels:3,background:'#151c25'}}).composite(layers).png().toFile(path.join(dir,'type-comparison.png'));
console.log({sourceBBox:{x:minX,y:minY,w,h},candidates:report.sort((a,b)=>a.error-b.error)});
