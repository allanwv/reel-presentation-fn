const fs=require('fs'),crypto=require('crypto');
const sharp=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/package.json')('sharp');
(async()=>{
 const dir='assets/ui/floating/day-taps';fs.mkdirSync(dir,{recursive:true});
 const names=['l','m','x','j','v','s','d'],centers=[154,343,531,719,908,1097,1285],size=156;
 const files={original:'assets/ui/floating/days-original.png',none:'assets/ui/floating/days-none.png',selected:'assets/ui/floating/days-lxv.png'};
 const raw={};for(const [name,file]of Object.entries(files))raw[name]=await sharp(file).ensureAlpha().raw().toBuffer();
 const locate=(data,approx)=>{
   let left=1440,right=0,top=340,bottom=0;
   for(let y=120;y<300;y++)for(let x=approx-85;x<approx+85;x++){
     const i=(y*1440+x)*4;
     if(Math.min(data[i],data[i+1],data[i+2])<240){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   }
   return {x:Math.round((left+right)/2),y:Math.round((top+bottom)/2)};
 };
 const aperture=Buffer.from(raw.original),positions=[],mask=Buffer.from('<svg width="156" height="156"><circle cx="78" cy="78" r="76" fill="white"/></svg>');
 for(let n=0;n<7;n++){
   const name=names[n],target=locate(raw.original,centers[n]),left=target.x-size/2,top=target.y-size/2;
   const initial=['m','j','s'].includes(name);
   positions.push({name,left:left/6,top:top/6,initial});
   for(let y=top;y<top+size;y++)for(let x=left;x<left+size;x++)aperture[(y*1440+x)*4+3]=0;
   for(const state of ['empty',...(name==='d'?[]:['selected'])]){
     const source=state==='empty'?(initial?'none':'original'):(initial?'original':'selected');
     const center=locate(raw[source],centers[n]);
     await sharp(files[source]).extract({left:center.x-size/2,top:center.y-size/2,width:size,height:size}).ensureAlpha().composite([{input:mask,blend:'dest-in'}]).png().toFile(dir+'/'+name+'-'+state+'.png');
   }
 }
 await sharp(aperture,{raw:{width:1440,height:340,channels:4}}).png().toFile(dir+'/background.png');
 let html=fs.readFileSync('index.html','utf8');
 if(html.includes('day-taps.js'))throw Error('Day taps already installed; regenerate assets separately if required');
 html=html.replace('<script src="assets/ui/floating/floating-cards.js"></script>','<script src="assets/ui/floating/floating-cards.js"></script>\n<script src="assets/ui/floating/day-taps.js"></script>');
 const circles=positions.map(p=>'<div class="ui-day" data-day="'+p.name+'" data-initial-selected="'+p.initial+'" style="left:'+p.left+'px;top:'+p.top+'px"><img class="ui-day-empty" src="'+dir+'/'+p.name+'-empty.png" alt="'+p.name.toUpperCase()+' sin seleccionar">'+(p.name==='d'?'':'<img class="ui-day-selected" src="'+dir+'/'+p.name+'-selected.png" alt="'+p.name.toUpperCase()+' seleccionado">')+'</div>').join('\n');
 html=html.replace(/<div id="days-card"[\s\S]*?(?=<div id="exercise-card")/,'<div id="days-card" class="ui-card ui-days" data-label="Días originales · selección L X V"><img class="ui-days-background" src="'+dir+'/background.png" alt="Días de la semana"><img class="ui-days-initial" src="assets/ui/floating/days-original.png" alt="Selección original antes de configurar los días">\n'+circles+'</div>\n');
 html=html.replace(/\/\/ Clear the screenshot's M\/J\/S[\s\S]*?(?=const exercise=cards.add)/,"// Fixed background; original circle pixels alone receive the tap animation.\nFitnodeDayTaps({timeline:tl,card:days});\n");
 fs.writeFileSync('index.html',html);
 const sourceHashes=Object.fromEntries(Object.values(files).map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
 fs.writeFileSync(dir+'/provenance.json',JSON.stringify({sourceHashes,positions,cropSize:size,operation:'Authentic circle crops, alpha-only outer margins. Fixed original card background. No UI controls redrawn.'},null,2));
 console.log('Day layers prepared: fixed background and original circles.');
})().catch(error=>{console.error(error);process.exitCode=1});
