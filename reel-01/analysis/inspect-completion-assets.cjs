const fs=require('fs'),path=require('path');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/110f701c48e68d66/node_modules/hyperframes/package.json');
const sharp=req('sharp');
(async()=>{
 for(const f of ['SCREEN_04_PR_REAL.png','SCREEN_10_WORKOUT_COMPLETE_LOADING.png','SCREEN_10_WORKOUT_COMPLETE_SERPENTINA.png','SCREEN_10_WORKOUT_COMPLETED.png']){
  const m=await sharp('../source/screenshots/'+f).metadata();console.log(f,m.width,m.height);
 }
 const {data,info}=await sharp('../source/screenshots/SCREEN_04_PR_REAL.png').removeAlpha().raw().toBuffer({resolveWithObject:true});
 let prior='',start=1500;const runs=[];
 for(let y=1500;y<2340;y++){let p=(y*info.width+10)*3,c=[...data.subarray(p,p+3)].join(',');if(c!==prior){if(y>start&&y-start>3)runs.push([start,y,prior]);start=y;prior=c;}}
 console.log(JSON.stringify(runs));
 const pix=await sharp('completion-proof/particle-source/frame-061.png').removeAlpha().raw().toBuffer(),colors=new Map();
 for(let p=600*50*3;p<pix.length;p+=3){const r=pix[p],g=pix[p+1],b=pix[p+2];if(Math.max(r,g,b)-Math.min(r,g,b)>65){const k=[r,g,b].map(v=>Math.round(v/8)*8).join(',');colors.set(k,(colors.get(k)||0)+1);}}
 console.log([...colors.entries()].sort((a,b)=>b[1]-a[1]).slice(0,24));
})();
