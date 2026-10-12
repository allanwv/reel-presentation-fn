import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {phoneGeometry,roundedScreenPath} from './geometry.mjs';
const require=createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/package.json');
const sharp=require('sharp'),fontkit=require('fontkit');
const project=path.resolve(import.meta.dirname,'..'),workspace=path.resolve(project,'..');
const dest=path.join(project,'assets'); await fs.mkdir(path.join(dest,'fonts'),{recursive:true});
const frame=n=>path.join(os.tmpdir(),'fitnode-gemini-reference-20261011',`frame-${String(n+1).padStart(3,'0')}.png`);
const raw=async p=>sharp(p).removeAlpha().raw().toBuffer();
const [f0,f3,f7]=await Promise.all([raw(frame(0)),raw(frame(72)),raw(frame(168))]);
const W=720,H=1280;
// Every plate pixel comes from an exposed background area of the approved video.
// The three feathered patches remove the initial logo, headline and subtitles.
const plate=Buffer.from(f0);
const blendPatch=(source,rect,feather=12)=>{
 const [x0,y0,x1,y1]=rect;
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
  const a=Math.max(0,Math.min(1,(x-x0)/feather,(x1-x)/feather,(y-y0)/feather,(y1-y)/feather));
  for(let c=0;c<3;c++){const i=(y*W+x)*3+c;plate[i]=Math.round(plate[i]*(1-a)+source[i]*a);}
 }
};
blendPatch(f7,[102,102,617,220]);
blendPatch(f7,[134,249,588,382],8);
blendPatch(f3,[83,432,640,476],4);
blendPatch(f7,[195,491,525,558],8);
await sharp(plate,{raw:{width:W,height:H,channels:3}}).png().toFile(path.join(dest,'background-clean.png'));
// Extract the reference's existing cast shadows into a distinct editable layer.
const shadow=Buffer.alloc(W*H*4);
for(let y=1098;y<1222;y++)for(let x=25;x<698;x++){
 const i=(y*W+x)*3,j=(y*W+x)*4;
 const base=plate[i]*.2126+plate[i+1]*.7152+plate[i+2]*.0722;
 const target=f3[i]*.2126+f3[i+1]*.7152+f3[i+2]*.0722;
 const edge=Math.min(1,(y-1098)/18,(1222-y)/22,(x-25)/25,(698-x)/25);
 shadow[j+3]=Math.round(Math.max(0,Math.min(.8,1-target/Math.max(base,1)))*255*Math.max(0,edge));
}
await sharp(shadow,{raw:{width:W,height:H,channels:4}}).png().toFile(path.join(dest,'phone-shadows.png'));
const paths={
 coach:'M99 532 L251 527 C279 524 295 540 298 567 L349 1025 C352 1050 338 1071 310 1076 L148 1095 C119 1099 98 1086 94 1061 L48 584 C44 555 64 535 99 532 Z',
 client:'M480 530 L626 538 C661 539 680 560 675 596 L632 1049 C629 1084 608 1104 574 1098 L408 1079 C383 1076 371 1059 377 1031 L423 579 C426 548 446 529 480 530 Z'
};
const cropRects={coach:{left:42,top:520,width:316,height:584},client:{left:366,top:520,width:318,height:590}};
for(const role of ['coach','client']){
 const inner=roundedScreenPath(phoneGeometry[role].quad,phoneGeometry[role].radius);
 const mask=Buffer.from(`<svg width="720" height="1280"><path d="${paths[role]} ${inner}" fill="white" fill-rule="evenodd"/></svg>`);
 const masked=await sharp(frame(72)).ensureAlpha().composite([{input:mask,blend:'dest-in'}]).png().toBuffer();
 await sharp(masked).extract(cropRects[role]).png().toFile(path.join(dest,`phone-${role}-reference.png`));
}
// Original official wordmark, black matte removed arithmetically; no redrawing.
const official=path.join(workspace,'assets/ASSET_FITNODE_LOGO_FULL_DARK.png');
const {data,info}=await sharp(official).removeAlpha().raw().toBuffer({resolveWithObject:true});
let l=info.width,t=info.height,r=0,b=0;
for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const i=(y*info.width+x)*3;if(Math.max(data[i],data[i+1],data[i+2])>45){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}}
const logo=Buffer.alloc((r-l+1)*(b-t+1)*4);
for(let y=t;y<=b;y++)for(let x=l;x<=r;x++){
 const i=(y*info.width+x)*3,j=((y-t)*(r-l+1)+x-l)*4;
 const alpha=Math.max(data[i],data[i+1],data[i+2]);
 for(let c=0;c<3;c++)logo[j+c]=alpha?Math.min(255,Math.round(data[i+c]*255/alpha)):0;
 logo[j+3]=alpha<24?0:alpha;
}
await sharp(logo,{raw:{width:r-l+1,height:b-t+1,channels:4}}).png().toFile(path.join(dest,'fitnode-official-transparent.png'));
const sourceNames=['SCREEN_01_COACH_ROUTINE.png','SCREEN_04_PR_REAL.png'];
const provenance=[];
for(const name of sourceNames){
 const source=path.join(workspace,'source/screenshots',name),target=path.join(dest,name);
 await fs.copyFile(source,target);
 const bytes=await fs.readFile(source),copy=await fs.readFile(target);
 const hash=crypto.createHash('sha256').update(bytes).digest('hex');
 if(!bytes.equals(copy))throw Error('Screenshot bytes changed');
 provenance.push({source:`../source/screenshots/${name}`,copy:`assets/${name}`,sha256:hash,dimensions:[1440,3120],modifications:'None. Byte-identical copy. CSS perspective only.'});
}
const interDir='C:/Users/aweis/.cache/hyperframes/fonts/inter';
for(const file of (await fs.readdir(interDir)).filter(n=>n.startsWith('700-normal-'))){
 const f=fontkit.openSync(path.join(interDir,file));
 if([...('PróximamenteEn iOS y AndroidUna app para ti y tus asesorados.Rutinas, alimentación y seguimiento.')].every(c=>f.hasGlyphForCodePoint(c.codePointAt(0)))){
  await fs.copyFile(path.join(interDir,file),path.join(dest,'fonts/Inter-latin.woff2'));
  console.log('Inter source',file,f.familyName,f.variationAxes);break;
 }
}
await fs.copyFile('C:/Windows/Fonts/arial.ttf',path.join(dest,'fonts/Arial.ttf'));
await fs.copyFile('C:/Windows/Fonts/arialbd.ttf',path.join(dest,'fonts/Arial-Bold.ttf'));
await fs.writeFile(path.join(project,'analysis/asset-provenance.json'),JSON.stringify({screenshots:provenance,logo:{source:'../assets/ASSET_FITNODE_LOGO_FULL_DARK.png',crop:[l,t,r-l+1,b-t+1],operation:'Black matte removed mathematically; original untouched.'},background:{source:'../references/GEMINI_REEL_BASE.mp4',frames:[0,72,168],operation:'Feathered exposed-background patches. No generative fill. No complete reference used as background.'},phones:{sourceFrame:72,operation:'Independent masked rigid shells from reference; screens replaced with intact originals.'}},null,2));
console.log('Logo crop',l,t,r-l+1,b-t+1);
for(const [x,y] of [[20,600],[690,700],[360,900],[360,1100],[100,450],[360,50]]){const i=(y*W+x)*3;console.log('background pixel',x,y,[...f0.subarray(i,i+3)],[...f3.subarray(i,i+3)],[...f7.subarray(i,i+3)]);}
