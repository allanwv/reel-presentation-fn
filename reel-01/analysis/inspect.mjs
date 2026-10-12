import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/package.json');
const sharp=require('sharp');
const workspace=path.resolve(import.meta.dirname,'../..');
const out=import.meta.dirname;
const label=(text,w,h=30)=>Buffer.from(`<svg width="${w}" height="${h}"><rect width="100%" height="100%" fill="#202833"/><text x="8" y="21" font-family="Arial" font-size="16" fill="white">${text}</text></svg>`);
async function sheet(files,filename,cols,w,h,labels){
 const layers=[];
 for(let i=0;i<files.length;i++){
  const x=i%cols*w,y=Math.floor(i/cols)*(h+30);
  const thumb=await sharp(files[i]).resize(w,h,{fit:'contain',background:'#303846'}).png().toBuffer();
  layers.push({input:thumb,left:x,top:y},{input:label(labels[i],w),left:x,top:y+h});
 }
 await sharp({create:{width:cols*w,height:Math.ceil(files.length/cols)*(h+30),channels:3,background:'#303846'}}).composite(layers).png().toFile(path.join(out,filename));
}
const frames=(await fs.readdir(path.join(out,'reference-frames'))).filter(f=>f.endsWith('.png')).sort().map(f=>path.join(out,'reference-frames',f));
for(let part=0;part<2;part++) await sheet(frames.slice(part*20,(part+1)*20),`video-overview-${part+1}.png`,5,216,384,Array.from({length:20},(_,i)=>`${((i+part*20)/4).toFixed(2)} s (sample)`));
const screenshots=(await fs.readdir(path.join(workspace,'source/screenshots'))).filter(f=>f.endsWith('.png'));
await sheet(screenshots.map(f=>path.join(workspace,'source/screenshots',f)),'screenshots-overview.png',4,216,480,screenshots.map(f=>f.replace('SCREEN_','').replace('.png','')));
const assets=(await fs.readdir(path.join(workspace,'assets'))).filter(f=>f.endsWith('.png'));
await sheet(assets.map(f=>path.join(workspace,'assets',f)),'logos-overview.png',2,540,200,assets);
for(const p of [...screenshots.map(f=>path.join(workspace,'source/screenshots',f)),...assets.map(f=>path.join(workspace,'assets',f)),path.join(workspace,'references/gemini_base_image_generated.png')]){
 const m=await sharp(p).metadata(); console.log(path.relative(workspace,p),m.width,m.height,m.channels);
}
