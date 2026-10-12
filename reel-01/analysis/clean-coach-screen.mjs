import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {roundedScreenPath} from './geometry.mjs';
const sharp=createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/package.json')('sharp');
const source='assets/phone-coach-reference.png';
const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const cleaned=Buffer.from(data),mask=Buffer.alloc(info.width*info.height*4);
let changed=0;
// Only the old screen sliver, inside the original physical bezel. Keep the
// boundary's original antialiasing and every alpha value; no frame pixel moves.
for(let y=45;y<=510;y++){
  const left=Math.floor(239+y*.105),right=Math.floor(242.72+y*.1035-.5);
  for(let x=left;x<=right;x++){
    const i=(y*info.width+x)*4;
    if(data[i+3]===0)continue;
    cleaned[i]=cleaned[i+1]=cleaned[i+2]=255;
    mask[i]=mask[i+1]=mask[i+2]=mask[i+3]=255;
    changed++;
  }
}
const output='assets/ui/floating/phone-coach-clean.png';
await sharp(cleaned,{raw:{...info}}).png().toFile(output);
// A white screen backing closes subpixel seams between Chromium's projective
// rounded rectangle and the raster aperture. It sits beneath the real UI and
// original bezel, inside the same rigid phone transform, throughout the reel.
const aperture=roundedScreenPath([[23,22],[240,15],[298,546],[70,568]],28);
await fs.writeFile('assets/ui/floating/coach-screen-backing.svg','<svg xmlns="http://www.w3.org/2000/svg" width="316" height="584" viewBox="0 0 316 584"><path d="'+aperture+'" fill="#fff" stroke="#fff" stroke-width="4" stroke-linejoin="round"/></svg>');
await sharp(mask,{raw:{...info}}).png().toFile('days-proof/ui-residual-mask.png');
const hash=crypto.createHash('sha256').update(await fs.readFile(source)).digest('hex');
await fs.writeFile('days-proof/screen-cleanup.json',JSON.stringify({source,sha256:hash,output,changedPixels:changed,alphaUnchanged:true,operation:'Old UI sliver integrated into #ffffff; physical bezel, screen geometry and original files unchanged.',region:{y:[45,510],left:'floor(239 + y * .105)',right:'floor(242.72 + y * .1035 - .5)'}},null,2));
console.log('Coach UI residue cleaned in derived asset:',changed,'pixels; alpha and bezel preserved.');
