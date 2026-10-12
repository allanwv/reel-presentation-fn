import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/package.json');
const puppeteer=require('puppeteer-core'),sharp=require('sharp');
const inter=await fs.readFile(path.join(import.meta.dirname,'../assets/fonts/Inter-latin.woff2'));
const browser=await puppeteer.launch({executablePath:'C:/Users/aweis/.cache/puppeteer/chrome-headless-shell/win64-152.0.7977.75/chrome-headless-shell-win64/chrome-headless-shell.exe',headless:true,args:['--disable-gpu']});
try{
 const page=await browser.newPage();
 await page.setContent(`<style>@font-face{font-family:Inter;src:url(data:font/woff2;base64,${inter.toString('base64')});font-weight:100 900}</style>`);
 await page.evaluate(()=>document.fonts.load('700 100px Inter'));
 const candidates=[...['Arial','Segoe UI','Calibri'].map(f=>[f,700]),...[600,650,700,750,800].map(w=>['Inter',w])];
 const source=await sharp(path.join(import.meta.dirname,'type-target-mask.png')).greyscale().raw().toBuffer();
 const report=[],layers=[];
 for(const [family,weight] of candidates){
  const png=await page.evaluate(({family,weight})=>{const c=document.createElement('canvas');c.width=1000;c.height=200;const ctx=c.getContext('2d');ctx.font=`${weight} 100px "${family}"`;ctx.fillStyle='white';ctx.fillText('Próximamente',10,130);return c.toDataURL();},{family,weight});
  const original=sharp(Buffer.from(png.split(',')[1],'base64'));
  const trimmed=await original.trim().png().toBuffer();const meta=await sharp(trimmed).metadata();
  const buf=await sharp(trimmed).resize(533,62,{fit:'fill'}).ensureAlpha().raw().toBuffer();
  let sum=0;for(let i=0;i<source.length;i++)sum+=Math.abs(buf[i*4+3]-source[i]);
  report.push({family,weight,error:sum/(source.length*255),naturalWidthAt100:meta.width,naturalHeightAt100:meta.height});
 }
 report.sort((a,b)=>a.error-b.error);console.log(JSON.stringify(report,null,2));
 await fs.writeFile(path.join(import.meta.dirname,'font-match.json'),JSON.stringify(report,null,2));
}finally{await browser.close();}
