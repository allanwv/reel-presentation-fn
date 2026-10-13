const fs=require('fs'),crypto=require('crypto');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/110f701c48e68d66/node_modules/hyperframes/package.json');
const sharp=req('sharp'),source='assets/ui/exercise-entry/field-reps-value.png',empty='assets/ui/exercise-entry/field-reps-empty.png',out='assets/ui/exercise-typing';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async()=>{
 fs.mkdirSync(out,{recursive:true});fs.mkdirSync('analysis/exercise-typing',{recursive:true});
 const sourceHashes=Object.fromEntries([source,empty].map(p=>[p,hash(p)]));
 const raw={width:276,height:168,channels:4},pixels=await sharp(source).ensureAlpha().raw().toBuffer(),one=Buffer.alloc(276*168*4);
 // Separate the authentic first glyph at the empty column between "1" and "2".
 // Move only whole original pixels, with no resampling, to the centered value position.
 const crop={left:96,top:54,width:30,height:58},offset={x:20,y:0};let copiedPixels=0;
 for(let y=crop.top;y<crop.top+crop.height;y++)for(let x=crop.left;x<crop.left+crop.width;x++){
  const s=(y*276+x)*4,d=((y+offset.y)*276+x+offset.x)*4;
  pixels.copy(one,d,s,s+4);if(pixels[s+3])copiedPixels++;
 }
 const value=out+'/field-reps-one-value.png';await sharp(one,{raw}).png().toFile(value);
 await sharp(empty).composite([{input:value}]).png().toFile('analysis/exercise-typing/reps-one-authentic-preview.png');
 const actual=await sharp(value).ensureAlpha().raw().toBuffer();if(!actual.equals(one))throw Error('Derived pixels changed');
 for(const[p,h]of Object.entries(sourceHashes))if(hash(p)!==h)throw Error('Source modified:'+p);
 const provenance={value:'1',size:{width:276,height:168},source,sourceHashes,crop,offset,copiedPixels,operation:'Authentic first glyph cropped from the existing Reps 12 raster, translated 20 whole pixels to the original centered input alignment. No redrawn font, recoloring, interpolation, keyboard or cursor.',output:value,sha256:hash(value)};
 fs.writeFileSync(out+'/provenance.json',JSON.stringify(provenance,null,2));console.log(JSON.stringify(provenance));
})().catch(e=>{console.error(e);process.exitCode=1;});
