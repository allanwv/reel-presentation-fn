const fs=require('fs'),path=require('path');
const source=[[-120,-260,0],[120,-260,0],[120,260,0],[-120,260,0]];
const quads={coach:[[23,22],[240,15],[298,546],[70,568]],client:[[71,20],[295,30],[248,570],[14,545]]};
const centers={coach:[158,292],client:[159,295]};
function project(p,f,center,points=source){
 const[rx,ry,rz,tx,ty,tz]=p;const D=Math.PI/180,a=rx*D,b=ry*D,c=rz*D;
 const sx=Math.sin(a),cx=Math.cos(a),sy=Math.sin(b),cy=Math.cos(b),sz=Math.sin(c),cz=Math.cos(c);
 return points.map(([x,y,z])=>{const y1=y*cx-z*sx,z1=y*sx+z*cx;const x2=x*cy+z1*sy,z2=-x*sy+z1*cy;const x3=x2*cz-y1*sz,y3=x2*sz+y1*cz;const den=1-(z2+tz)/f;return[center[0]+(x3+tx)/den,center[1]+(y3+ty)/den]});
}
function solve(a,b){
 const n=b.length,m=a.map((r,i)=>[...r,b[i]]);
 for(let i=0;i<n;i++){let k=i;for(let j=i+1;j<n;j++)if(Math.abs(m[j][i])>Math.abs(m[k][i]))k=j;[m[i],m[k]]=[m[k],m[i]];if(Math.abs(m[i][i])<1e-15)return null;const d=m[i][i];for(let c=i;c<=n;c++)m[i][c]/=d;for(let r=0;r<n;r++)if(r!==i){const t=m[r][i];for(let c=i;c<=n;c++)m[r][c]-=t*m[i][c]}}
 return m.map(r=>r[n]);
}
const residual=(p,f,c,q)=>project(p,f,c).flat().map((v,i)=>v-q.flat()[i]);
const cost=r=>r.reduce((s,v)=>s+v*v,0);
function fit(initial,f,c,q){
 let p=[...initial],lambda=.01,err=cost(residual(p,f,c,q));
 for(let iteration=0;iteration<100;iteration++){
  const r=residual(p,f,c,q),jac=p.map((_,j)=>{const h=j<3?1e-4:1e-3,v=[...p];v[j]+=h;return residual(v,f,c,q).map((a,i)=>(a-r[i])/h)});
  const a=p.map((_,j)=>p.map((_,k)=>jac[j].reduce((s,v,i)=>s+v*jac[k][i],0))),b=p.map((_,j)=>-jac[j].reduce((s,v,i)=>s+v*r[i],0));
  for(let j=0;j<6;j++)a[j][j]+=lambda;
  const delta=solve(a,b);if(!delta)break;
  const next=p.map((v,i)=>v+delta[i]),e=cost(residual(next,f,c,q));
  if(e<err){p=next;const improvement=err-e;err=e;lambda/=3;if(improvement<1e-12)break;}else lambda*=8;
 }
 return{p,cost:err};
}
const results={convention:'CSS y-down camera; model origin centered on 240x520 screen. Transform order translate3d(tx,ty,tz) rotateZ(roll) rotateY(yaw) rotateX(pitch). Camera CSS perspective f at phone center. Uniform scale=1, size preserved. Front plane centered using left=cx-120 and top=cy-260 before translate. CSS transform-origin center.',roles:{}};
for(const role of Object.keys(quads)){
 const fits=[];
 for(const focal of [1000,1500,1800]){
  let best;
  for(const yaw of [-40,-20,0,20,40])for(const pitch of [-12,0,12]){
   const q=fit([pitch,yaw,role==='coach'?-5:5,0,0,0],focal,centers[role],quads[role]);
   if(!best||q.cost<best.cost)best=q;
  }
  const projected=project(best.p,focal,centers[role]);
  const distances=projected.map((p,i)=>Math.hypot(p[0]-quads[role][i][0],p[1]-quads[role][i][1]));
  const[pitch,yaw,roll,translateX,translateY,translateZ]=best.p;
  const a=pitch*Math.PI/180,b=yaw*Math.PI/180,c=roll*Math.PI/180;
  const frontNormal=[Math.cos(c)*Math.sin(b)*Math.cos(a)+Math.sin(c)*Math.sin(a),Math.sin(c)*Math.sin(b)*Math.cos(a)-Math.cos(c)*Math.sin(a),Math.cos(b)*Math.cos(a)];
  const bodyThickness=22,pivotDepth=-bodyThickness/2;
  const pivotTranslation=[translateX,translateY,translateZ].map((v,i)=>v-pivotDepth*((i===2?1:0)-frontNormal[i]));
  fits.push({focal,principalPoint:centers[role],pitch,yaw,roll,translateX,translateY,translateZ,uniformScale:1,screen:{width:240,height:520,left:centers[role][0]-120,top:centers[role][1]-260},rmsCornerError:Math.sqrt(best.cost/4),maxCornerError:Math.max(...distances),projectedQuad:projected,cornerErrors:distances,focusYaw:yaw-Math.sign(yaw)*9,bodyThickness,bodyCenterPivot:{transformOrigin:[120,260,pivotDepth],translate:pivotTranslation,frontNormal,rule:'Apply the base correction once. Keep this translation constant as yaw varies; recomputing it each frame would cancel the physical front-surface arc.'}});
 }
 results.roles[role]={targetQuad:quads[role],fits};
}
fs.writeFileSync(path.join(__dirname,'pose-fit.json'),JSON.stringify(results,null,2));
if(require.main===module)console.log(JSON.stringify(results,null,2));
module.exports={source,quads,project,fit};
