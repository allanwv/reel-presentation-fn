/* One rigid, orthogonal CSS 3D chassis. The authentic DOM screen and foreground
   card plane share the same camera and pose; only GSAP owns pose.angle. */
window.FitnodePhone3D=function({phone,overlayPhone,plane,role}){
  const models={
    coach:{left:38,top:32,principal:[158,292],pitch:4.812269432,yaw:25.094292415,roll:-3.549403471,translation:[-1.882021092,-6.006762364,69.421017795]},
    client:{left:39,top:35,principal:[159,295],pitch:4.293821268,yaw:-19.872656569,roll:4.148459616,translation:[-.668743920,-5.431881122,50.746810608]}
  };
  const model=models[role],focal=1800,thickness=22,pose={angle:0};
  const element=(name,parent)=>{const el=document.createElement('div');el.className=name;parent.appendChild(el);return el;};
  function camera(parent,isOverlay){
    const cam=element('real-phone-camera',parent);
    cam.style.perspectiveOrigin=model.principal.map(n=>n+'px').join(' ');
    const rig=element('real-phone-pose'+(isOverlay?' real-phone-overlay':''),cam);
    Object.assign(rig.style,{left:model.left+'px',top:model.top+'px'});
    return{cam,rig};
  }
  phone.setAttribute('data-real-3d',role);
  const {cam,rig}=camera(phone,false),overlayCamera=camera(overlayPhone,true),overlay=overlayCamera.rig;
  rig.id=phone.id+'-3d';overlay.id=overlayPhone.id+'-3d';
  element('real-phone-back',rig);
  // Fill the solid interior behind the boundary faces. Subpixel raster seams
  // between corner facets then reveal the same metal instead of the backdrop.
  for(let z=-21.75;z<0;z+=.5)element('real-phone-core',rig).style.transform='translateZ('+z+'px)';
  // Clockwise rounded rectangle: each edge is a genuine vertical plane, with
  // outward normals. Subdivided corners close the complete 22px extrusion.
  const points=[],r=38,x=-13,y=-18,w=266,h=556;
  for(const [cx,cy,start] of [[x+w-r,y+r,-90],[x+w-r,y+h-r,0],[x+r,y+h-r,90],[x+r,y+r,180]]){
    for(let i=0;i<=32;i++){const a=(start+i*90/32)*Math.PI/180;points.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]);}
  }
  points.forEach(([ax,ay],i)=>{
    const [bx,by]=points[(i+1)%points.length],dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy),theta=Math.atan2(dy,dx)*180/Math.PI;
    const edge=element('real-phone-edge',rig);
    Object.assign(edge.style,{left:((ax+bx)/2-(len+.25)/2)+'px',top:((ay+by)/2-thickness/2)+'px',width:(len+.25)+'px',transform:'translateZ(-11px) rotateZ('+theta+'deg) rotateX(90deg)'});
  });
  element('real-phone-front',rig);
  element('real-phone-speaker',rig);
  const screen=phone.querySelector('#screen-'+role);
  rig.appendChild(screen);overlay.appendChild(plane);
  let last;
  function sync(){
    // Explicitly replace the former baked homography, including initialization
    // after the card engine is mounted. Never multiply two screen perspectives.
    screen.style.transform=plane.style.transform='translateZ(.7px)';
    if(last===pose.angle)return;
    const [tx,ty,tz]=model.translation;
    const transform='translate3d('+tx+'px,'+ty+'px,'+tz+'px) rotateZ('+model.roll+'deg) rotateY('+(model.yaw+pose.angle)+'deg) rotateX('+model.pitch+'deg)';
    rig.style.transform=overlay.style.transform=transform;last=pose.angle;
  }
  function projectedQuad(angle=pose.angle){
    const rad=Math.PI/180,cx=Math.cos(model.pitch*rad),sx=Math.sin(model.pitch*rad),cy=Math.cos((model.yaw+angle)*rad),sy=Math.sin((model.yaw+angle)*rad),cz=Math.cos(model.roll*rad),sz=Math.sin(model.roll*rad);
    return [[0,0],[240,0],[240,520],[0,520]].map(([u,v])=>{
      const x=u-120,y=v-260,z=11.7;
      const y1=cx*y-sx*z,z1=sx*y+cx*z;
      const x2=cy*x+sy*z1,z2=-sy*x+cy*z1;
      const x3=cz*x2-sz*y1+model.translation[0],y3=sz*x2+cz*y1+model.translation[1],z3=z2+model.translation[2]-11;
      return [model.principal[0]+x3/(1-z3/focal),model.principal[1]+y3/(1-z3/focal)];
    });
  }
  sync();
  return{pose,sync,rig,overlay,camera:cam,overlayCamera:overlayCamera.cam,projectedQuad,calibration:{...model,focal,thickness,screen:[240,520],body:[266,556],projection:'orthogonal-css-3d'}};
};
