import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/aweis/AppData/Local/npm-cache/_npx/702923228c2ce1e6/node_modules/hyperframes/package.json');
const sharp=require('sharp');
const dir=import.meta.dirname,project=path.resolve(dir,'..'),workspace=path.resolve(project,'..');
const tracking=JSON.parse(await fs.readFile(path.join(dir,'frame-tracking.json'),'utf8'));
const geometry=JSON.parse(await fs.readFile(path.join(dir,'text-bounds.json'),'utf8'));
const provenance=JSON.parse(await fs.readFile(path.join(dir,'asset-provenance.json'),'utf8'));
function trace(role,channel,start,end){return tracking.filter(r=>r.time>=start&&r.time<=end&&r[role]?.[channel]!=null).map(r=>({t:r.time,value:r[role][channel]}));}
function easePath(points){
 if(points.length<2)return null;
 const first=points[0],last=points.at(-1),dx=last.t-first.t,dy=last.value-first.value;
 const p=points.map(v=>({x:(v.t-first.t)/dx,y:(v.value-first.value)/dy}));
 const sec=p.slice(1).map((v,i)=>(v.y-p[i].y)/(v.x-p[i].x));
 const slopes=p.map((_,i)=>i===0?sec[0]:i===p.length-1?sec.at(-1):sec[i-1]*sec[i]<=0?0:2/(1/sec[i-1]+1/sec[i]));
 let d='M0,0';for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],step=(b.x-a.x)/3;d+=' C'+[a.x+step,a.y+slopes[i-1]*step,b.x-step,b.y-slopes[i]*step,b.x,b.y].map(v=>v.toFixed(5)).join(',');}
 return {start:first.t,end:last.t,from:first.value,to:last.value,gsapCustomEasePath:d,method:'Monotone cubic interpolation of measured samples; inferred curve, not original source keyframes.'};
}
const motion={
 status:'Static proof stage only. Full movement and MP4 are awaiting user approval.',
 reference:{file:'../references/GEMINI_REEL_BASE.mp4',width:720,height:1280,fps:24,frames:240,visualDurationSeconds:10,containerDurationSeconds:10.005,audio:'Present in reference, intentionally excluded from reconstruction'},
 coordinateSystem:{width:720,height:1280,outputScale:1.5,output:[1080,1920],note:'All coordinates below are reference pixels; multiply by 1.5 for final canvas.'},
 referencePriority:'Exact video frames at 3 and 7 seconds determine proof framing. Base image differs in aspect and layout; its real screen subjects select screenshots 01 and 04.',
 stillGeometry:geometry,
 phonePlanes:{coach:{source:'SCREEN_01_COACH_ROUTINE.png',quad:[[65,542],[282,535],[340,1066],[112,1088]]},client:{source:'SCREEN_04_PR_REAL.png',quad:[[437,540],[661,550],[614,1090],[380,1065]]},screenPlaneSize:[240,520],sourceScreenshotSize:[1440,3120],note:'Identical 6:1 reduction before planar perspective. No UI text, numbers, scroll state or pixels edited.'},
 timing:{entrance:[.083,1.5],holdAndFloat:[1.5,4.083],phoneExit:[4.083,5.125],labelExit:[4.083,5.375],logoMove:[4.958,5.917],closingReveal:[5.25,6.083],finalHold:[6.083,10],badgeVisibleIntervalsApprox:[[.1,1.3],[4.167,5.45]],badgeAt3:0},
 entranceOffset:{coachFirstTrackedLabel:tracking.find(r=>r.coach?.labelY!=null)?.time,clientFirstTrackedLabel:tracking.find(r=>r.client?.labelY!=null)?.time,note:'First fully measurable label, not exact first visible pixel.'},
 rotationObservation:{coach:[{t:.25,pose:'rear visible'},{t:.5,pose:'near profile'},{t:.75,pose:'front, oblique'},{t:1.5,pose:'front settling toward measured 3s plane'}],client:'Already front-facing during entrance. Independent timing; no matching full back rotation.',limitation:'No 3D phone model or source rotation curves supplied. Exact 3D angles are not recoverable uniquely from the raster video.'},
 floatMeasured:{coachTopEdge:{at1_5:539,at3:531,at4:522},clientTopEdge:{at1_5:543,at3:534,at4:527},note:'Gentle upward arc, not a complete sine loop. Preserve measured curve rather than add yoyo cycles.'},
 exitObservation:'Phones move down faster than their labels. Keep label and phone channels separate; the growing gap is in the reference.',
 logo:{presentation:{x:126,y:125,width:467},closing:{x:122,y:380,width:484},observedTopY:[[5,140],[5.125,186],[5.25,272],[5.375,332],[5.5,362],[5.625,375],[5.75,380],[6,380]]},
 typography:{family:'Inter',heroWeight:700,closingWeight:750,bodyWeight:400,labelWeight:500,method:'Local-font raster comparison, then per-line bounding-box fit with editable SVG text.',limitation:'Font source was not supplied; Inter is a measured visual match, not a confirmed original font.'},
 curves:{},
 limits:['Reference shells/background are 720p-derived raster layers; screenshots remain native 1440x3120 assets.','Only the two approved-review poses exist in the composition; no full sequence animation has been built.']
};
for(const role of ['coach','client'])motion.curves[role]={
 labelEntrance:easePath(trace(role,'labelY',0,1.5)),
 phoneEntranceVisible:easePath(trace(role,'phoneTopEdgeEstimate',.75,1.5)),
 phoneFloat:trace(role,'phoneTopEdgeEstimate',1.5,4.083),
 labelFloat:trace(role,'labelY',1.5,4.083),
 phoneExit:easePath(trace(role,'phoneTopEdgeEstimate',4.083,5.083)),
 labelExit:easePath(trace(role,'labelY',4.083,5.333))
};
await fs.writeFile(path.join(dir,'motion-analysis.json'),JSON.stringify(motion,null,2));
const verification={screenshots:[],proofs:[],referenceFramesProcessed:tracking.length,hyperframes:{ok:true,browserSkipped:false,checkedTimes:[3,7],errors:0,lintWarnings:8,warningCode:'nested_structure_needs_subcomposition',note:'Eight separate tracks confirmed by official timeline command. Warnings recommend splitting the current single-file composition; no runtime/layout/contrast errors.'}};
for(const p of provenance.screenshots){
 const original=await fs.readFile(path.resolve(project,p.source)),copy=await fs.readFile(path.join(project,p.copy));
 const originalHash=crypto.createHash('sha256').update(original).digest('hex'),copyHash=crypto.createHash('sha256').update(copy).digest('hex');
 if(originalHash!==p.sha256||copyHash!==originalHash)throw Error('Screenshot integrity mismatch');
 verification.screenshots.push({source:p.source,sha256:originalHash,unchanged:true});
}
for(const filename of ['frame-00-at-3s.png','frame-01-at-7s.png']){
 const m=await sharp(path.join(project,'proofs',filename)).metadata();if(m.width!==1080||m.height!==1920)throw Error('Unexpected proof dimensions');
 verification.proofs.push({file:'proofs/'+filename,width:m.width,height:m.height});
}
await fs.writeFile(path.join(dir,'verification.json'),JSON.stringify(verification,null,2));
console.log(JSON.stringify({framesInspected:tracking.length,proofs:verification.proofs,screenshotsUnchanged:verification.screenshots.every(s=>s.unchanged),entranceOffset:motion.entranceOffset},null,2));
