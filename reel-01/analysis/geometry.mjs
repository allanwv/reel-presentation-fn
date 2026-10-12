export const phoneGeometry={
 coach:{crop:{left:42,top:520,width:316,height:584},quad:[[65,542],[282,535],[340,1066],[112,1088]],radius:28},
 client:{crop:{left:366,top:520,width:318,height:590},quad:[[437,540],[661,550],[614,1090],[380,1065]],radius:28}
};
export function homography(quad,w=240,h=520){
 const src=[[0,0],[w,0],[w,h],[0,h]],a=[];
 for(let i=0;i<4;i++){const [x,y]=src[i],[u,v]=quad[i];a.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);}
 for(let i=0;i<8;i++){let pivot=i;for(let j=i+1;j<8;j++)if(Math.abs(a[j][i])>Math.abs(a[pivot][i]))pivot=j;[a[i],a[pivot]]=[a[pivot],a[i]];const d=a[i][i];for(let k=i;k<9;k++)a[i][k]/=d;for(let j=0;j<8;j++)if(j!==i){const f=a[j][i];for(let k=i;k<9;k++)a[j][k]-=f*a[i][k];}}
 return [...a.map(row=>row[8]),1];
}
export function roundedScreenPath(quad,r=28){
 const h=homography(quad),points=[];
 for(const [cx,cy,start] of [[240-r,r,-90],[240-r,520-r,0],[r,520-r,90],[r,r,180]])for(let k=0;k<=20;k++){
  const angle=(start+k*4.5)*Math.PI/180,x=cx+r*Math.cos(angle),y=cy+r*Math.sin(angle),d=h[6]*x+h[7]*y+1;
  points.push([(h[0]*x+h[1]*y+h[2])/d,(h[3]*x+h[4]*y+h[5])/d]);
 }
 return points.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(4)} ${y.toFixed(4)}`).join(' ')+' Z';
}
