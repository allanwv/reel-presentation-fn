// Geometry-only alternative audit; no authored composition mutation.
const fs=require('fs');
const quads={coach:[[65,542],[282,535],[340,1066],[112,1088]],client:[[437,540],[661,550],[614,1090],[380,1065]]};
function solve(quad){const src=[[0,0],[240,0],[240,520],[0,520]],a=[];for(let i=0;i<4;i++){const[x,y]=src[i],[u,v]=quad[i];a.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);}for(let i=0;i<8;i++){let p=i;for(let j=i+1;j<8;j++)if(Math.abs(a[j][i])>Math.abs(a[p][i]))p=j;[a[i],a[p]]=[a[p],a[i]];const d=a[i][i];for(let k=i;k<9;k++)a[i][k]/=d;for(let j=0;j<8;j++)if(j!==i){const f=a[j][i];for(let k=i;k<9;k++)a[j][k]-=f*a[i][k];}}const h=a.map(r=>r[8]);return [[h[0],h[1],h[2]],[h[3],h[4],h[5]],[h[6],h[7],1]];}
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),len=a=>Math.hypot(...a),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),scale=(a,s)=>a.map(v=>v*s);
const results=[];
for(const [role,q]of Object.entries(quads)){
 const H=solve(q),f=1500,cx=360,cy=640,ki=v=>[(v[0]-cx*v[2])/f,(v[1]-cy*v[2])/f,v[2]],r1=ki(H.map(r=>r[0])),r2=ki(H.map(r=>r[1])),t=ki(H.map(r=>r[2])),center=add(t,add(scale(r1,120),scale(r2,260))),norm=cross(r1,r2);
 const project=v=>[f*v[0]/v[2]+cx,f*v[1]/v[2]+cy],rotate=(v,a)=>{const c=Math.cos(a),s=Math.sin(a);return[c*v[0]+s*v[2],v[1],-s*v[0]+c*v[2]];};
 const base={role,normalYaw:Math.atan2(norm[0],norm[2])*180/Math.PI,firstColumnYaw:Math.atan2(r1[2],r1[0])*180/Math.PI,basisDot:dot(r1,r2)/(len(r1)*len(r2)),basisNormRatio:len(r1)/len(r2)};
 for(const angle of [0,role==='coach'?9:-9,role==='coach'?-9:9]){
  const a=angle*Math.PI/180,corners=[[0,0],[240,0],[240,520],[0,520]].map(([x,y])=>project(add(center,rotate(add(scale(r1,x-120),scale(r2,y-260)),a)))),left=len(sub(corners[3],corners[0])),right=len(sub(corners[2],corners[1])),verticalDriftLeft=corners[3][0]-corners[0][0],verticalDriftRight=corners[2][0]-corners[1][0];
  results.push({...base,correctionAnglePositiveCameraZ:angle,corners,ratioRoverL:right/left,verticalDriftLeft,verticalDriftRight,meanVerticalDrift:(verticalDriftLeft+verticalDriftRight)/2,centerProjection:project(center),topWidth:len(sub(corners[1],corners[0])),bottomWidth:len(sub(corners[2],corners[3]))});
 }
}
fs.writeFileSync('analysis/yaw-audit/physical-plane-measurements.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
