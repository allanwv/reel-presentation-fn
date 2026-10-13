// Binary removal of tracked authentic particles. No source video is decoded.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const req=require('module').createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/110f701c48e68d66/node_modules/hyperframes/package.json'),sharp=req('sharp');
sharp.concurrency(2);
const root=path.resolve(__dirname,'..'),src=path.join(root,'assets/ui/client-completion'),out=path.join(src,'density-80'),proof=path.join(root,'serpentinas-density-proof');
const meta=JSON.parse(fs.readFileSync(path.join(src,'provenance.json'),'utf8')).celebration;
const W=meta.frameWidth,H=meta.frameHeight,AW=W*meta.atlasColumns,AH=H*meta.atlasRows,N=meta.frames;
const palette=[[255,216,0],[129,199,132],[84,201,240],[229,57,53],[33,150,243],[179,157,219]];
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
function color(r,g,b){let k=0,d=Infinity;for(let i=0;i<6;i++){const c=palette[i],v=(r-c[0])**2+(g-c[1])**2+(b-c[2])**2;if(v<d){d=v;k=i;}}return k;}
function frameFromAtlas(data,n){const frame=Buffer.alloc(W*H*4),cx=(n%5)*W,cy=Math.floor(n/5)*H;for(let y=0;y<H;y++)data.copy(frame,y*W*4,((cy+y)*AW+cx)*4,((cy+y)*AW+cx+W)*4);return frame;}
function components(frame){
 const labels=new Int32Array(W*H),colors=new Int8Array(W*H);colors.fill(-1);
 for(let i=0;i<W*H;i++)if(frame[i*4+3]>2)colors[i]=color(frame[i*4],frame[i*4+1],frame[i*4+2]);
 const comps=[];
 for(let origin=0;origin<W*H;origin++)if(colors[origin]>=0&&!labels[origin]){
  const id=comps.length+1,c=colors[origin],queue=[origin];labels[origin]=id;
  let sx=0,sy=0,area=0,x0=W,y0=H,x1=0,y1=0;
  for(let q=0;q<queue.length;q++){
   const p=queue[q],x=p%W,y=Math.floor(p/W);sx+=x;sy+=y;area++;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);
   // Bridge tiny transparent gaps from the earlier color-subtraction matte.
   // This joins one paper fragment without adding any pixels to its silhouette.
   for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const nx=x+dx,ny=y+dy;if(nx<0||nx>=W||ny<0||ny>=H)continue;const np=ny*W+nx;if(!labels[np]&&colors[np]===c){labels[np]=id;queue.push(np);}}
  }
  comps.push({id,c,area,x:sx/area,y:sy/area,box:[x0,y0,x1,y1],pixels:queue});
 }
 return{labels,comps};
}
function randomKey(id){let n=(id+1)*2654435761>>>0;n^=n>>>16;n=Math.imul(n,2246822507);n^=n>>>13;return n>>>0;}
(async()=>{
 fs.mkdirSync(out,{recursive:true});fs.mkdirSync(proof,{recursive:true});
 const previewFrames=process.argv.includes('--preview');
 if(previewFrames)fs.mkdirSync(path.join(proof,'frames'),{recursive:true});
 const before=Object.fromEntries(meta.atlases.map(n=>[n,hash(path.join(src,n))]));
 const all=[],tracks=[];let active=[];
 for(let page=0;page<meta.atlases.length;page++){
  const data=await sharp(path.join(src,meta.atlases[page])).ensureAlpha().raw().toBuffer();
  for(let local=0;local<20&&page*20+local<N;local++){
   const index=page*20+local,frame=frameFromAtlas(data,local),{comps}=components(frame),major=comps.filter(c=>c.area>=5),minor=comps.filter(c=>c.area<5);
   const candidates=[];
   for(const c of major)for(const t of active){
    const gap=index-t.last;if(gap>3||t.c!==c.c)continue;
    const px=t.x+t.vx*gap,py=t.y+t.vy*gap,d=Math.hypot(c.x-px,c.y-py),limit=gap===1?18:22;
    if(d>limit)continue;
    const areaPenalty=Math.abs(Math.log((c.area+3)/(t.area+3)))*1.5;
    candidates.push({c,t,cost:d+areaPenalty+(gap-1)*2});
   }
   candidates.sort((a,b)=>a.cost-b.cost);
   const usedC=new Set(),usedT=new Set();
   for(const q of candidates)if(!usedC.has(q.c.id)&&!usedT.has(q.t.id)){
    const c=q.c,t=q.t,gap=index-t.last,dx=(c.x-t.x)/gap,dy=(c.y-t.y)/gap;
    t.vx=t.samples.length>1?.65*dx+.35*t.vx:dx;t.vy=t.samples.length>1?.65*dy+.35*t.vy:dy;
    t.x=c.x;t.y=c.y;t.area=c.area;t.last=index;t.samples.push({frame:index,component:c.id});c.track=t.id;usedC.add(c.id);usedT.add(t.id);
   }
   for(const c of major)if(c.track===undefined){const t={id:tracks.length,c:c.c,x:c.x,y:c.y,vx:0,vy:0,area:c.area,last:index,birth:index,samples:[{frame:index,component:c.id}]};tracks.push(t);c.track=t.id;}
   for(const c of minor){let closest,dist=5;for(const q of major){if(q.c!==c.c)continue;const d=Math.hypot(c.x-q.x,c.y-q.y);if(d<dist){dist=d;closest=q;}}if(closest)c.track=closest.track;}
   active=tracks.filter(t=>index-t.last<=3);
   all.push({frame,index,comps});
  }
 }
 // Rejoin track breaks and ambiguous split/merge fragments. An ambiguous
 // overlap is kept as one conservative trajectory group: pieces belonging to
 // that group are always removed together, never independently frame by frame.
 const parent=tracks.map(t=>t.id),find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;},join=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent[Math.max(a,b)]=Math.min(a,b);};
 const boxDistance=(a,b)=>Math.hypot(Math.max(0,a[0]-b[2],b[0]-a[2]),Math.max(0,a[1]-b[3],b[1]-a[3]));
 for(let frame=1;frame<N;frame++){
  const prev=all[frame-1].comps.filter(c=>c.area>=5),now=all[frame].comps.filter(c=>c.area>=5);
  // Entirely new fragments near a continuing paper piece share its identity.
  for(const c of now)if(tracks[c.track].birth===frame)for(const q of now){
   if(c.track===q.track||c.c!==q.c||tracks[q.track].birth===frame)continue;
   if(boxDistance(c.box,q.box)>3)continue;
   if(Math.max(c.box[2],q.box[2])-Math.min(c.box[0],q.box[0])>32||Math.max(c.box[3],q.box[3])-Math.min(c.box[1],q.box[1])>32)continue;
   join(c.track,q.track);
  }
  for(const p of prev)if(tracks[p.track].last===frame-1){
   const t=tracks[p.track],expected=[p.box[0]+t.vx,p.box[1]+t.vy,p.box[2]+t.vx,p.box[3]+t.vy];
   let best,dist=6;
   for(const c of now){if(c.c!==p.c)continue;const d=boxDistance(expected,c.box);if(d<dist){dist=d;best=c;}}
   if(best)join(p.track,best.track);
  }
 }
 const originalTracks=tracks.slice(),groupMap=new Map();
 for(const t of tracks){const id=find(t.id);let g=groupMap.get(id);if(!g){g={...t,id,samples:[],members:[]};groupMap.set(id,g);}g.samples.push(...t.samples);g.members.push(t.id);g.birth=Math.min(g.birth,t.birth);g.last=Math.max(g.last,t.last);}
 const groupedTracks=[...groupMap.values()];
 console.log(JSON.stringify({preGrouping:tracks.length,conservativeGroups:groupedTracks.length,largestGroups:groupedTracks.map(t=>t.members.length).sort((a,b)=>b-a).slice(0,12)}));
 // Balance the selection in each native color family. Duration weighting keeps
 // the visible density reduction at 20%, rather than deleting only tiny tracks.
 const removed=new Set(),selection=[];
 for(let c=0;c<6;c++){
  const group=groupedTracks.filter(t=>t.c===c),target=Math.round(group.reduce((s,t)=>s+t.samples.length,0)*.2);
  const count=Math.round(group.length*.2),ordered=group.filter(t=>t.samples.length<=target).sort((a,b)=>randomKey(a.id)-randomKey(b.id));
  const chosen=new Set(ordered.slice(0,count).map(t=>t.id));let sum=ordered.slice(0,count).reduce((s,t)=>s+t.samples.length,0);
  // Cardinality stays fixed at 20% of whole groups. Swap complete groups to
  // balance their total visible lifetime around 20% as well.
  for(let iteration=0;iteration<500&&sum!==target;iteration++){
   let best,err=Math.abs(target-sum);
   for(const a of ordered)if(chosen.has(a.id))for(const b of ordered)if(!chosen.has(b.id)){
    const next=sum-a.samples.length+b.samples.length,e=Math.abs(target-next);
    if(e<err){err=e;best={a,b,next};if(e===0)break;}
   }
   if(!best)break;chosen.delete(best.a.id);chosen.add(best.b.id);sum=best.next;
  }
  for(const id of chosen)removed.add(id);
  selection.push({color:c,totalTracks:group.length,removedTracks:group.filter(t=>removed.has(t.id)).length,componentObservations:group.reduce((s,t)=>s+t.samples.length,0),removedObservations:sum,targetObservations:target});
 }
 const frameCounts=[],outputFrames=[],qa=[];let retainedPixels=0,removedPixels=0;
 for(const f of all){
  const result=Buffer.from(f.frame);let observed=0,dropped=0,pixels=0;
  for(const c of f.comps){const cut=c.track!==undefined&&removed.has(find(c.track));if(c.area>=5){observed++;if(cut)dropped++;}
   if(cut)for(const p of c.pixels){if(result[p*4+3]){result[p*4+3]=0;pixels++;}}
  }
  // Any very faint resizing edge not represented by alpha>2 stays untouched;
  // clear it only when a removed component pixel is directly adjacent.
  for(let p=0;p<W*H;p++)if(result[p*4+3]>0&&result[p*4+3]<=2){const x=p%W,y=Math.floor(p/W);let cut=false;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&nx<W&&ny>=0&&ny<H){const np=ny*W+nx;if(f.frame[np*4+3]>2&&result[np*4+3]===0)cut=true;}}if(cut){result[p*4+3]=0;pixels++;}}
  for(let p=0;p<W*H;p++)if(result[p*4+3]){if(!result.subarray(p*4,p*4+4).equals(f.frame.subarray(p*4,p*4+4)))throw Error('Retained source pixel changed');retainedPixels++;}
  removedPixels+=pixels;frameCounts.push({frame:f.index,piecesBefore:observed,piecesRemoved:dropped,piecesAfter:observed-dropped,removedPixels:pixels});
  outputFrames.push(await sharp(result,{raw:{width:W,height:H,channels:4}}).png().toBuffer());
  if(previewFrames)await sharp({create:{width:W*2,height:H,channels:4,background:'#fff'}}).composite([{input:await sharp(f.frame,{raw:{width:W,height:H,channels:4}}).png().toBuffer(),left:0,top:0},{input:outputFrames.at(-1),left:W,top:0}]).png().toFile(path.join(proof,'frames','frame-'+String(f.index).padStart(3,'0')+'.png'));
  if([15,30,60,100,145,180].includes(f.index)){
   const idx=qa.length/2,rowIndex=Math.floor(idx/3),colIndex=idx%3;
   const original=await sharp({create:{width:W,height:H,channels:4,background:'#fff'}}).composite([{input:await sharp(f.frame,{raw:{width:W,height:H,channels:4}}).png().toBuffer()}]).png().toBuffer();
   const reduced=await sharp({create:{width:W,height:H,channels:4,background:'#fff'}}).composite([{input:outputFrames.at(-1)}]).png().toBuffer();
   qa.push({input:original,left:colIndex*W*2,top:rowIndex*H},{input:reduced,left:colIndex*W*2+W,top:rowIndex*H});
  }
 }
 const atlases=[];
 for(let page=0;page<meta.atlases.length;page++){
  const name=meta.atlases[page];await sharp({create:{width:AW,height:AH,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(outputFrames.slice(page*20,page*20+20).map((input,i)=>({input,left:(i%5)*W,top:Math.floor(i/5)*H}))).png().toFile(path.join(out,name));atlases.push(name);
 }
 await sharp({create:{width:W*6,height:H*2,channels:4,background:'#fff'}}).composite(qa).png().toFile(path.join(proof,'comparison-contact-sheet.png'));
 for(const[name,value]of Object.entries(before))if(hash(path.join(src,name))!==value)throw Error('Original atlas changed');
 const totalObservations=frameCounts.reduce((s,f)=>s+f.piecesBefore,0),removedObservations=frameCounts.reduce((s,f)=>s+f.piecesRemoved,0);
 const manifest={source:'../serpentinas-*.png',sourceHashes:before,method:'Native-color connected components are tracked frame-to-frame with constant-velocity prediction. Split, merge and nearby track breaks are conservatively joined into complete temporal groups. A deterministic duration-weighted selection removes whole groups, balanced over all six native colors. Binary alpha removal only. Retained RGBA pixels are byte-identical to source at the same frame and coordinates. No source-video reprocessing, new particle geometry or new trajectories.',frames:N,frameWidth:W,frameHeight:H,atlasColumns:5,atlasRows:4,pageFrames:20,atlases,fragmentTracks:tracks.length,totalTracks:groupedTracks.length,removedTracks:removed.size,totalComponentObservations:totalObservations,removedComponentObservations:removedObservations,quantityReduction:removedObservations/totalObservations,retainedPixels,removedPixels,selection,frameCounts,tracks:groupedTracks.map(t=>({id:t.id,color:t.c,birth:t.birth,last:t.last,samples:t.samples.length,memberTracks:t.members.length,removed:removed.has(t.id)})),limitations:'Conservative temporal groups are inferred from raster pieces, not source engine particle IDs. A group may contain more than one touching same-color physical particle. The source raster does not expose an exact physical particle count. Full groups are removed throughout their observed lifetime, never partial opacity. Temporal source frame order is unchanged. Root timeline applies 80% playback speed separately.'};
 fs.writeFileSync(path.join(out,'provenance.json'),JSON.stringify(manifest,null,2));
 Object.assign(manifest,{remainingGroups:groupedTracks.length-removed.size,groupReduction:removed.size/groupedTracks.length,physicalParticleCount:null,remainingComponentObservations:totalObservations-removedObservations,preview:{file:'serpentinas-density-proof/SERPENTINAS_DENSIDAD_80_COMPARACION.mp4',layout:'Original left / reduced right',fps:24,playbackSpeed:.8}});
 fs.writeFileSync(path.join(out,'provenance.json'),JSON.stringify(manifest,null,2));
 console.log(JSON.stringify({out,frames:N,totalTracks:groupedTracks.length,removedTracks:removed.size,totalObservations,removedObservations,quantityReduction:manifest.quantityReduction,removedPixels},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
