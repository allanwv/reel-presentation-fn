const fs = require('fs');
const crypto = require('crypto');
const req = require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/package.json');
const sharp = req('sharp');
const out = 'assets/ui/exercise-entry';
const screenshot = '../source/screenshots/SCREEN_01_COACH_ROUTINE.png';
const sha256 = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const definitions = {
  series: { value: '4', mask: {left:110,top:54,width:50,height:58} },
  reps: { value: '12', mask: {left:96,top:54,width:70,height:58} },
  rir: { value: '2', mask: {left:110,top:54,width:44,height:58} },
  rest: { value: '2', mask: {left:80,top:54,width:44,height:58} }
};

(async () => {
  fs.mkdirSync(out, {recursive:true});
  fs.mkdirSync('parameter-proof', {recursive:true});
  const before = {[screenshot]:sha256(screenshot)};
  const manifest = {
    size:{width:276,height:168},
    values:['4','12','2','2'],
    sourceHashes:before,
    operation:'Only embedded numeric content is masked on its original white input surface. All borders, field dimensions, and the original min suffix are preserved. Raster value layers use authentic screenshot pixels; no synthetic type or redrawn UI.',
    four:{source:screenshot,crop:{left:312,top:755,width:32,height:42},sourceInkBounds:{left:314,top:757,width:28,height:38},resize:{width:37,fit:'inside',scale:37/32},placement:{left:115,top:59},note:'Digit 4 from the original period label, same regular typography and text color, uniformly enlarged to match input cap height. This digit is not an original capture of a completed Series field.'},
    fields:{}
  };
  const four = await sharp(screenshot).extract(manifest.four.crop).resize({width:37}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const review = [];
  for (const [name,def] of Object.entries(definitions)) {
    const source = `assets/ui/floating/field-${name}-original.png`;
    before[source] = sha256(source);
    const original = await sharp(source).ensureAlpha().raw().toBuffer();
    const empty = Buffer.from(original);
    const value = Buffer.alloc(276*168*4);
    for(let y=def.mask.top;y<def.mask.top+def.mask.height;y++)for(let x=def.mask.left;x<def.mask.left+def.mask.width;x++) {
      const p=(y*276+x)*4;
      empty[p]=empty[p+1]=empty[p+2]=empty[p+3]=255;
      if(name !== 'series' && (original[p]!==255 || original[p+1]!==255 || original[p+2]!==255)) original.copy(value,p,p,p+4);
    }
    if(name === 'series') {
      for(let y=0;y<four.info.height;y++)for(let x=0;x<four.info.width;x++) {
        const s=(y*four.info.width+x)*4,p=((y+59)*276+x+115)*4;
        if(four.data[s]!==255 || four.data[s+1]!==255 || four.data[s+2]!==255) four.data.copy(value,p,s,s+4);
      }
    }
    const raw = {width:276,height:168,channels:4};
    const emptyPath=`${out}/field-${name}-empty.png`,valuePath=`${out}/field-${name}-value.png`,filledPath=`${out}/field-${name}-filled.png`;
    await sharp(empty,{raw}).png().toFile(emptyPath);
    await sharp(value,{raw}).png().toFile(valuePath);
    await sharp(empty,{raw}).composite([{input:valuePath}]).png().toFile(filledPath);
    const filled = await sharp(filledPath).ensureAlpha().raw().toBuffer();
    let outsideChanged=0,emptyNonwhite=0;
    for(let y=0;y<168;y++)for(let x=0;x<276;x++) {
      const p=(y*276+x)*4,inside=x>=def.mask.left&&x<def.mask.left+def.mask.width&&y>=def.mask.top&&y<def.mask.top+def.mask.height;
      if(!inside&&!filled.subarray(p,p+4).equals(original.subarray(p,p+4)))outsideChanged++;
      if(inside&&(empty[p]!==255||empty[p+1]!==255||empty[p+2]!==255))emptyNonwhite++;
    }
    if(outsideChanged||emptyNonwhite)throw Error(name+' localized mask verification failed');
    if(name!=='series'&&!filled.equals(original))throw Error(name+' original raster value was changed');
    manifest.fields[name]={value:def.value,source,mask:def.mask,empty:emptyPath,valueLayer:valuePath,filled:filledPath,verification:{outsideMaskPixelsChanged:outsideChanged,emptyMaskNonwhitePixels:emptyNonwhite,filledEqualsOriginal:name!=='series'}};
    const i=review.length/3;
    review.push({input:source,left:0,top:i*168},{input:emptyPath,left:276,top:i*168},{input:filledPath,left:552,top:i*168});
  }
  for(const [p,h]of Object.entries(before))if(sha256(p)!==h)throw Error('Source modified '+p);
  await sharp({create:{width:828,height:672,channels:4,background:'#ddd'}}).composite(review).png().toFile('parameter-proof/exercise-input-variants.png');
  fs.writeFileSync(out+'/provenance.json',JSON.stringify(manifest,null,2));
  console.log(JSON.stringify({ready:true,size:manifest.size,values:manifest.values,sourceHashesUnchanged:true,review:'parameter-proof/exercise-input-variants.png'}));
})().catch(e=>{console.error(e);process.exitCode=1;});
