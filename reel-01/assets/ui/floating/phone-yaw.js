/* Calibrated planar 3D yaw. Original raster pixels, screen masks and card geometry stay intact. */
window.FitnodePhoneYaw=function({phone,overlayPhone,plane,quad,focal=1500}){
  const source=[[0,0],[240,0],[240,520],[0,520]];
  function homography(from,to){
    const a=[];
    from.forEach(([x,y],i)=>{const[u,v]=to[i];a.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v]);});
    for(let i=0;i<8;i++){
      let p=i;for(let j=i+1;j<8;j++)if(Math.abs(a[j][i])>Math.abs(a[p][i]))p=j;
      [a[i],a[p]]=[a[p],a[i]];const d=a[i][i];
      for(let k=i;k<9;k++)a[i][k]/=d;
      for(let j=0;j<8;j++)if(j!==i){const f=a[j][i];for(let k=i;k<9;k++)a[j][k]-=f*a[i][k];}
    }
    return a.map(row=>row[8]);
  }
  const h=homography(source,quad),dc=h[6]*120+h[7]*260+1;
  const cx=(h[0]*120+h[1]*260+h[2])/dc,cy=(h[3]*120+h[4]*260+h[5])/dc;
  // Lift the baked homography into camera space: the initial pose is recovered exactly.
  const lifted=quad.map(([x,y],i)=>{
    const[u,v]=source[i],w=(h[6]*u+h[7]*v+1)/dc;
    return[(x-cx)*w,(y-cy)*w,focal*(1-w)];
  });
  function wrap(parent,children,id){
    const rig=document.createElement('div');rig.id=id;rig.className='phone-yaw-rig';
    Object.assign(rig.style,{position:'absolute',inset:'0',width:'100%',height:'100%',overflow:'visible',transformOrigin:'0px 0px',transformStyle:'flat'});
    parent.appendChild(rig);for(const child of children)rig.appendChild(child);return rig;
  }
  const rig=wrap(phone,[...phone.children],phone.id+'-yaw');
  const overlay=wrap(overlayPhone,[plane],overlayPhone.id+'-yaw');
  const pose={angle:0};let last;
  function projectedQuad(angle){
    const t=angle*Math.PI/180,c=Math.cos(t),s=Math.sin(t);
    return lifted.map(([x,y,z])=>{
      const xr=c*x+s*z,zr=-s*x+c*z,den=1-zr/focal;
      return[cx+xr/den,cy+y/den];
    });
  }
  function sync(){
    if(pose.angle===last)return;
    // C(0)=identity, including rasterisation, so the approved entrance and return stay exact.
    let transform='none';
    if(Math.abs(pose.angle)>1e-9){
      const q=homography(quad,projectedQuad(pose.angle));
      transform='matrix3d('+[q[0],q[3],0,q[6],q[1],q[4],0,q[7],0,0,1,0,q[2],q[5],0,1].join(',')+')';
    }
    rig.style.transform=overlay.style.transform=transform;last=pose.angle;
  }
  sync();
  return{pose,sync,rig,overlay,projectedQuad,calibration:{focal,center:[cx,cy],quad,lifted}};
};
