import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/package.json');
const sharp=require('sharp');
const out=import.meta.dirname;
const frames=path.join(os.tmpdir(),'fitnode-gemini-reference-20261011');
const fp=n=>path.join(frames,`frame-${String(n+1).padStart(3,'0')}.png`);
const selected=[0,6,12,18,24,30,36,48,60,72,84,96,102,108,114,120,123,126,129,132,135,138,144,168,192,216,239];
const layers=[];for(let i=0;i<selected.length;i++){
 const n=selected[i],x=i%9*180,y=Math.floor(i/9)*350;
 layers.push({input:await sharp(fp(n)).resize(180,320).png().toBuffer(),left:x,top:y});
 layers.push({input:Buffer.from(`<svg width="180" height="30"><rect width="180" height="30" fill="#202833"/><text x="5" y="21" font-family="Arial" font-size="16" fill="white">${n}/24 = ${(n/24).toFixed(3)} s</text></svg>`),left:x,top:y+320});
}
await sharp({create:{width:1620,height:1050,channels:3,background:'#202833'}}).composite(layers).png().toFile(path.join(out,'exact-timing-sheet.png'));
for(const [name,rect] of [['coach-shell',{left:42,top:520,width:316,height:584}],['client-shell',{left:366,top:520,width:318,height:590}],['closing-type',{left:72,top:640,width:580,height:166}]]) await sharp(fp(name==='closing-type'?168:72)).extract(rect).resize(rect.width*2,rect.height*2).png().toFile(path.join(out,name+'-detail.png'));
const report=[];
for(const n of selected){
 const {data,info}=await sharp(fp(n)).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const bbox=(x0,y0,x1,y1,test)=>{let l=x1,t=y1,r=-1,b=-1,count=0; for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*info.width+x)*3;if(test(data[i],data[i+1],data[i+2])){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);count++;}}return count?{x:l,y:t,w:r-l+1,h:b-t+1,count}:null;};
 report.push({frame:n,time:n/24,coachWhite:bbox(0,550,360,1280,(r,g,b)=>Math.min(r,g,b)>185),clientWhite:bbox(360,550,720,1280,(r,g,b)=>Math.min(r,g,b)>185),logo:bbox(80,40,650,n<120?240:470,(r,g,b)=>b>120&&g>100&&r<g*.6)});
}
await fs.writeFile(path.join(out,'raw-measurements.json'),JSON.stringify(report,null,2));
const textRegions=[['hero-line-1',72,[120,250,610,319]],['hero-line-2',72,[120,320,610,380]],['hero-subtitle',72,[70,385,650,440]],['coach-label',72,[100,475,260,526]],['client-label',72,[430,475,650,530]],['closing-title',168,[65,630,660,740]],['closing-subtitle',168,[170,740,550,815]]];
const boxes={};
for(const [name,n,region] of textRegions){const data=await sharp(fp(n)).removeAlpha().raw().toBuffer();const [x0,y0,x1,y1]=region;let l=x1,t=y1,r=0,b=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(data[(y*720+x)*3]>140){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}boxes[name]={x:l,y:t,width:r-l+1,height:b-t+1};}
await fs.writeFile(path.join(out,'text-bounds.json'),JSON.stringify(boxes,null,2));console.log(JSON.stringify(boxes,null,2));
