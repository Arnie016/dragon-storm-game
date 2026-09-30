// The flight chart shares the game's terrain sampler and authored coordinates.
// Terrain is cached; opening the chart only redraws the live navigation symbols.
const INK = '#373a31', SEA = '#bbc4b5', GOLD = '#a97232';
const GREEN = '#286b5d', RED = '#a44d3d', PAPER = '#e0d1ae';
const finite = (n, fallback = 0) => Number.isFinite(n) ? n : fallback;
const position = value => {
  const p = value?.position || value?.lampPos || value;
  if (Array.isArray(p)) return {x:p[0], y:p[1], z:p[2]};
  return p && Number.isFinite(p.x) && Number.isFinite(p.z) ? p : null;
};
const hit = item => !!(item?.userData?.hit || item?.hit);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export function createNavigationMap({canvas, world, terrainHeight, canvasFactory} = {}) {
  if (!canvas || !world) throw new TypeError('Navigation map requires a canvas and world data');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Navigation map requires a 2D canvas context');
  const makeCanvas = canvasFactory || ((w,h) => {
    const c = canvas.ownerDocument?.createElement('canvas') || new OffscreenCanvas(w,h);
    c.width=w; c.height=h; return c;
  });
  const heightAt = terrainHeight || world.homeHeight || (() => -10);
  let cache=null, projection=null, samples=0, disposed=false;

  function getBounds() {
    const points=[];
    const add=(x,z,r=0) => { if(Number.isFinite(x)&&Number.isFinite(z)) points.push([x-r,z-r],[x+r,z+r]); };
    for(const [x,,z] of world.ROUTE||[]) add(x,z,120);
    for(const [x,,z] of world.TUTORIAL||[]) add(x,z,120);
    for(const [x,z,r] of world.MOUNTAINS||[]) add(x,z,r);
    if(world.HOME) add(world.HOME.x,world.HOME.z,world.HOME.r);
    for(const p of Object.values(world.LANDMARK_POSITIONS||{})) add(p[0],p[2],80);
    if(!points.length) points.push([-1000,-2000],[1000,400]);
    return {minX:Math.min(...points.map(p=>p[0]))-100,maxX:Math.max(...points.map(p=>p[0]))+100,
      minZ:Math.min(...points.map(p=>p[1]))-100,maxZ:Math.max(...points.map(p=>p[1]))+100};
  }

  function build(w,h) {
    cache=makeCanvas(w,h); const c=cache.getContext('2d');
    const b=getBounds(), margin=36, top=94, bottom=145;
    const scale=Math.min((w-margin*2)/(b.maxX-b.minX),(h-top-bottom)/(b.maxZ-b.minZ));
    const pw=(b.maxX-b.minX)*scale, ph=(b.maxZ-b.minZ)*scale;
    const x=(w-pw)/2,y=top+(h-top-bottom-ph)/2;
    const project=p=>({x:x+(p.x-b.minX)*scale,y:y+(p.z-b.minZ)*scale});
    projection={...b,x,y,w:pw,h:ph,scale,project};
    c.fillStyle=PAPER; c.fillRect(0,0,w,h);
    const wash=c.createLinearGradient(0,0,w,h); wash.addColorStop(0,'rgba(255,251,224,.3)'); wash.addColorStop(1,'rgba(83,66,42,.12)');
    c.fillStyle=wash;c.fillRect(0,0,w,h);
    c.strokeStyle='#a08d68';c.lineWidth=1;c.strokeRect(12,12,w-24,h-24);c.strokeRect(17,17,w-34,h-34);
    c.fillStyle=INK;c.textAlign='left';c.font='bold 27px Georgia, serif';c.fillText('THE SABLE REACH',36,51);
    c.fillStyle='#6a6957';c.font='11px sans-serif';c.fillText('A FLIGHT CHART · NORTH IS UP',37,71);
    c.fillStyle=SEA;c.fillRect(x,y,pw,ph);
    // One deterministic raster of the exact collision surface, with slope shading.
    const cols=180, rows=Math.max(1,Math.round(cols*ph/pw));
    const heights=new Float32Array((cols+1)*(rows+1));
    for(let j=0;j<=rows;j++) for(let i=0;i<=cols;i++) {
      heights[j*(cols+1)+i]=finite(heightAt(b.minX+i/cols*(b.maxX-b.minX),b.minZ+j/rows*(b.maxZ-b.minZ)),-10); samples++;
    }
    const raster=makeCanvas(cols,rows),rc=raster.getContext('2d'),pixels=rc.createImageData(cols,rows);
    for(let j=0;j<rows;j++) for(let i=0;i<cols;i++) {
      const k=j*(cols+1)+i,hh=(heights[k]+heights[k+1]+heights[k+cols+1]+heights[k+cols+2])/4;
      const shade=clamp((heights[k]-heights[k+1]+heights[k]-heights[k+cols+1])*.33,-20,20);
      const color=hh<=.5?[187,196,181]:hh<12?[191,185,147]:hh<80?[145,157,117]:hh<180?[155,151,119]:hh<340?[178,167,139]:[209,201,177];
      const index=(j*cols+i)*4;
      for(let q=0;q<3;q++)pixels.data[index+q]=clamp(color[q]+(hh>0?shade:0),0,255);
      pixels.data[index+3]=255;
    }
    rc.putImageData(pixels,0,0);c.drawImage(raster,x,y,pw,ph);
    c.save();c.beginPath();c.rect(x,y,pw,ph);c.clip();
    // Marching squares follows the rendered coastline, including the harbor bay.
    for(const level of [.5,45,100,180,300,450]) {
      c.beginPath();c.strokeStyle=level===.5?'rgba(61,81,67,.68)':'rgba(78,79,55,.26)';c.lineWidth=level===.5?1.15:.65;
      for(let j=0;j<rows;j++) for(let i=0;i<cols;i++) {
        const k=j*(cols+1)+i,values=[heights[k],heights[k+1],heights[k+cols+2],heights[k+cols+1]];
        const verts=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]],crossings=[];
        for(let e=0;e<4;e++) {const n=(e+1)%4;
          if((values[e]>=level)===(values[n]>=level))continue;
          const t=(level-values[e])/(values[n]-values[e]);
          crossings.push([x+(verts[e][0]+(verts[n][0]-verts[e][0])*t)/cols*pw,y+(verts[e][1]+(verts[n][1]-verts[e][1])*t)/rows*ph]);
        }
        for(let e=0;e+1<crossings.length;e+=2){c.moveTo(...crossings[e]);c.lineTo(...crossings[e+1]);}
      }c.stroke();
    }
    c.strokeStyle='rgba(60,77,70,.1)';c.lineWidth=1;c.setLineDash([2,6]);
    for(let gx=Math.ceil(b.minX/500)*500;gx<b.maxX;gx+=500){const p=project({x:gx,z:b.minZ});c.beginPath();c.moveTo(p.x,y);c.lineTo(p.x,y+ph);c.stroke();}
    for(let gz=Math.ceil(b.minZ/500)*500;gz<b.maxZ;gz+=500){const p=project({x:b.minX,z:gz});c.beginPath();c.moveTo(x,p.y);c.lineTo(x+pw,p.y);c.stroke();}
    c.setLineDash([]);
    for(const [rx,rz,rr] of world.KEEPERS?.rocks||[]) { const p=project({x:rx,z:rz});c.fillStyle='#a09e7e';c.strokeStyle='#6d765d';c.beginPath();c.arc(p.x,p.y,Math.max(2,rr*scale),0,Math.PI*2);c.fill();c.stroke(); }
    if(world.CANYON?.length) {
      for(const [lineWidth,color] of [[9,'#77795c'],[3,SEA]]) {
        c.beginPath();world.CANYON.forEach(([cx,cz],i)=>{const p=project({x:cx,z:cz});i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y);});
        c.strokeStyle=color;c.lineWidth=lineWidth;c.lineCap='round';c.stroke();
      }
    }
    c.restore();c.lineWidth=1;c.strokeStyle='#8f9278';c.strokeRect(x,y,pw,ph);
    const label=(text,wx,wz,dx=0,dy=0)=>{const p=project({x:wx,z:wz});c.font='italic 13px Georgia, serif';c.textAlign='center';c.lineWidth=3;c.strokeStyle='rgba(224,209,174,.85)';c.strokeText(text,p.x+dx,p.y+dy);c.fillStyle='#545b48';c.fillText(text,p.x+dx,p.y+dy);};
    if(world.VILLAGE)label('Hearthholm',world.VILLAGE.x,world.VILLAGE.z,0,19);
    if(world.KEEPERS?.center)label('Keeper Shallows',...world.KEEPERS.center,38,29);
    if(world.CANYON?.length)label('Serpent Reach',world.CANYON[0][0],world.CANYON[0][1],94,-8);
    if(world.RIBS?.length)label('Rib Wastes',world.RIBS[2]?.x??0,world.RIBS[2]?.z??-1100,0,27);
    if(world.GATE)label('Tempest Gate',world.GATE.x,world.GATE.z,0,-20);
    // Compass and scale sit inside the chart margin, away from the route.
    const cx=x+pw-31,cy=y+36;c.fillStyle=INK;c.font='bold 13px Georgia';c.textAlign='center';c.fillText('N',cx,cy-15);
    c.beginPath();c.moveTo(cx,cy-9);c.lineTo(cx-5,cy+9);c.lineTo(cx,cy+5);c.lineTo(cx+5,cy+9);c.closePath();c.fill();
    const bar=Math.min(500*scale,pw*.22),meters=Math.round(bar/scale);c.strokeStyle=INK;c.lineWidth=1.2;c.beginPath();c.moveTo(x+12,y+ph-24);c.lineTo(x+12+bar,y+ph-24);c.stroke();
    c.font='10px sans-serif';c.textAlign='left';c.fillText(`${meters} m`,x+12,y+ph-10);
  }

  function symbol(c,p,type,color,size=6) {
    c.save();c.translate(p.x,p.y);c.strokeStyle=color;c.fillStyle=PAPER;c.lineWidth=1.7;c.beginPath();
    if(type==='diamond'){c.moveTo(0,-size);c.lineTo(size,0);c.lineTo(0,size);c.lineTo(-size,0);c.closePath();}
    else if(type==='tower'){c.rect(-size*.65,-size*.75,size*1.3,size*1.5);c.moveTo(-size,-size);c.lineTo(size,-size);}
    else c.arc(0,0,size,0,Math.PI*2);
    c.fill();c.stroke();c.restore();
  }
  function clippedText(text,x,y,maxWidth,font,color=INK) {
    ctx.font=font;ctx.fillStyle=color;ctx.textAlign='left';
    let value=String(text||'');
    if(ctx.measureText(value).width>maxWidth){while(value.length&&ctx.measureText(value+'…').width>maxWidth)value=value.slice(0,-1);value+='…';}
    ctx.fillText(value,x,y);
  }

  function draw(state={}) {
    if(disposed)return;
    const w=canvas.width||900,h=canvas.height||900;
    if(!cache||cache.width!==w||cache.height!==h)build(w,h);
    ctx.clearRect(0,0,w,h);ctx.drawImage(cache,0,0);
    const {project,x,y,w:pw,h:ph}=projection;
    const rings=state.rings||[],tutorial=state.tutorialRings||[],player=position(state.player),objective=position(state.objective);
    const route=rings.length?rings:(world.ROUTE||[]).map(p=>({position:{x:p[0],y:p[1],z:p[2]}}));
    ctx.save();ctx.beginPath();ctx.rect(x,y,pw,ph);ctx.clip();
    // The numbered road remains readable after completion; future legs are dashed.
    for(let i=1;i<route.length;i++){
      const a=position(route[i-1]),b=position(route[i]);if(!a||!b)continue;
      const pa=project(a),pb=project(b),complete=hit(route[i-1])&&hit(route[i]);
      ctx.strokeStyle=complete?'rgba(40,107,93,.8)':'rgba(76,72,84,.5)';ctx.lineWidth=complete?2:1.35;ctx.setLineDash(complete?[]:[4,5]);
      ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);ctx.stroke();
    }ctx.setLineDash([]);
    if(!state.tutorialDone)for(const r of tutorial){const p=position(r);if(p)symbol(ctx,project(p),'ring',hit(r)?GREEN:'#5c8280',4);}
    for(const site of state.sites||[]){if(site.done||site.g?.visible===false)continue;const p=position(site);if(!p)continue;const sp=project(p);symbol(ctx,sp,'diamond',GOLD,4);}
    for(const g of state.gates||[]){const p=position(g);if(p)symbol(ctx,project(p),'diamond',hit(g)?GREEN:'#527d70',4);}
    for(const tower of state.towers||[]) {
      const p=position(tower.lampPos||tower.group||tower);if(!p)continue;const tp=project(p);
      symbol(ctx,tp,'tower',tower.destroyed?'#73796b':RED,5);
      if(tower.destroyed){ctx.strokeStyle='#73796b';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(tp.x-6,tp.y+6);ctx.lineTo(tp.x+6,tp.y-6);ctx.stroke();}
      else if(tower.hp<tower.maxHp){ctx.fillStyle='#69413a';ctx.fillRect(tp.x-7,tp.y+9,14,2);ctx.fillStyle=RED;ctx.fillRect(tp.x-7,tp.y+9,14*clamp(tower.hp/tower.maxHp,0,1),2);}
    }
    route.forEach((ring,i)=>{
      const pos=position(ring);if(!pos)return;const p=project(pos),done=hit(ring);
      ctx.beginPath();ctx.arc(p.x,p.y,8,0,Math.PI*2);ctx.fillStyle=done?GREEN:PAPER;ctx.fill();ctx.strokeStyle=done?GREEN:'#66586d';ctx.lineWidth=1.5;ctx.stroke();
      ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=done?'#fff4d8':'#514556';ctx.fillText(String(i+1),p.x,p.y+.5);ctx.textBaseline='alphabetic';
    });
    if(player&&objective) {
      const pp=project(player),op=project(objective);
      ctx.strokeStyle='rgba(152,100,42,.85)';ctx.lineWidth=1.5;ctx.setLineDash([7,4]);ctx.beginPath();ctx.moveTo(pp.x,pp.y);ctx.lineTo(op.x,op.y);ctx.stroke();ctx.setLineDash([]);
      symbol(ctx,op,'diamond',GOLD,12);ctx.fillStyle=GOLD;ctx.beginPath();ctx.arc(op.x,op.y,2.5,0,Math.PI*2);ctx.fill();
    }
    if(state.raid&&world.VILLAGE){const p=project(world.VILLAGE);ctx.strokeStyle=RED;ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,19,0,Math.PI*2);ctx.stroke();ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillStyle=RED;ctx.fillText('UNDER ATTACK',p.x,p.y+31);}
    if(player) {
      const p=project(player);p.x=clamp(p.x,x+13,x+pw-13);p.y=clamp(p.y,y+13,y+ph-13);
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-finite(player.yaw));ctx.fillStyle='#173e3b';ctx.strokeStyle='#fff2cd';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(8,10);ctx.lineTo(0,6);ctx.lineTo(-8,10);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    }ctx.restore();
    const heading=player?((Math.round(-finite(player.yaw)*180/Math.PI)%360)+360)%360:0;
    ctx.textAlign='right';ctx.fillStyle=INK;ctx.font='11px sans-serif';
    ctx.fillText(`${rings.filter(hit).length} / ${route.length} BEACONS`,w-37,47);
    ctx.fillText(`${Math.round(finite(player?.y))} m ALT  ·  ${String(heading).padStart(3,'0')}° HDG`,w-37,67);
    const fy=h-119;ctx.strokeStyle='#b3a381';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(36,fy);ctx.lineTo(w-36,fy);ctx.stroke();
    clippedText(state.objectiveLabel||'Explore the Sable Reach',36,fy+24,w-72,'bold 14px Georgia, serif');
    if(player&&objective) {
      const dx=objective.x-player.x,dz=objective.z-player.z,dist=Math.hypot(dx,dz),delta=Math.round(finite(objective.y)-finite(player.y));
      const bearing=((Math.round(Math.atan2(dx,-dz)*180/Math.PI)%360)+360)%360;
      clippedText(`${dist>=1000?(dist/1000).toFixed(2)+' km':Math.round(dist)+' m'} TO OBJECTIVE  ·  COURSE ${String(bearing).padStart(3,'0')}°  ·  ${delta>2?'CLIMB '+delta+' m':delta< -2?'DESCEND '+Math.abs(delta)+' m':'HOLD ALTITUDE'}`,36,fy+44,w-72,'11px sans-serif','#6e664e');
    }else clippedText('Follow the numbered beacons. Contours show the height of the land.',36,fy+44,w-72,'11px sans-serif','#6e664e');
    const items=[['ring','Beacon',GREEN],['tower','Watchtower',RED],['diamond','Objective',GOLD],['diamond','Legend',GOLD]];
    items.forEach(([type,label,color],i)=>{const px=42+i*(w-84)/4;symbol(ctx,{x:px,y:h-43},type,color,4);clippedText(label,px+11,h-39,(w-84)/4-17,'10px sans-serif','#645f4e');});
  }
  return {draw,invalidate(){cache=null;projection=null;},dispose(){cache=null;projection=null;disposed=true;},
    getStats(){return {cached:!!cache,samples,bounds:projection?{minX:projection.minX,maxX:projection.maxX,minZ:projection.minZ,maxZ:projection.maxZ}:null};}};
}
