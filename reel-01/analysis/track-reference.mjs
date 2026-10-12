import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/package.json');
const sharp=require('sharp');
const folder=path.join(os.tmpdir(),'fitnode-gemini-reference-20261011');
const fp=n=>path.join(folder,'frame-'+String(n+1).padStart(3,'0')+'.png');
const source=await sharp(fp(72)).removeAlpha().raw().toBuffer();
const background=await sharp(fp(0)).removeAlpha().raw().toBuffer();
const patterns=[['coach',130,490,101,29],['client',455,495,171,29]].map(([role,x,y,w,h])=>{
 const samples=[];for(let dy=0;dy<h;dy+=2)for(let dx=0;dx<w;dx+=2)samples.push({offset:(dy*720+x+dx)*3,target:source[((y+dy)*720+x+dx)*3]>120?1:0});
 return {role,samples};
});
const rows=[];let previous=null;
for(let n=0;n<240;n++){
 const data=await sharp(fp(n)).removeAlpha().raw().toBuffer();
 const row={frame:n,time:n/24};
 if(n<=130)for(const {role,samples} of patterns){
  let best=Infinity,bestY=-1;
  for(let y=470;y<1250;y++){
   let mismatch=0;const base=y*720*3;
   for(const sample of samples){mismatch+=((data[base+sample.offset]>120?1:0)^sample.target);if(mismatch>=best)break;}
   if(mismatch<best){best=mismatch;bestY=y;}
  }
  let phoneTop=null;
  if(n>=18){const startX=role==='coach'?35:370,endX=role==='coach'?352:691;for(let y=520;y<1280;y++){let dark=0,white=0;for(let x=startX;x<endX;x++){const i=(y*720+x)*3;if(data[i+2]<background[i+2]-12)dark++;if(Math.min(data[i],data[i+1],data[i+2])>165)white++;}if(dark>80||white>120){phoneTop=y;break;}}}
  row[role]={labelY:best/samples.length<.15?bestY+2:null,maskMismatch:best/samples.length,phoneTopEdgeEstimate:phoneTop};
 }
 if(previous){let sum=0,count=0;for(let i=0;i<data.length;i+=48){sum+=Math.abs(data[i]-previous[i]);count++;}row.frameLumaChange=sum/count;}
 rows.push(row);previous=data;
}
await fs.writeFile(path.join(import.meta.dirname,'frame-tracking.json'),JSON.stringify(rows,null,2));
const sampleFrames=[0,3,6,9,12,15,18,21,24,27,30,36,48,60,72,84,96,99,102,105,108,111,114,117,120,123,126,129];
console.log(JSON.stringify(rows.filter(r=>sampleFrames.includes(r.frame)),null,2));
