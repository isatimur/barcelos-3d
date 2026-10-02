// Interpretive architecture on real OSM outlines. Heights and decorative
// details are visual estimates, disclosed in every landmark card.
import { bbox, edges, inside, offset } from '../geom.js';
import { polyWindows, polyBand, roofOver, onEdge } from '../metric.js';
import { win } from '../parts.js';

function wrap(fn) { fn.metric=true;fn.rule={snap:false,note:'Interpretive architecture, OSM footprint; estimated height and decorative detail.'};return fn; }
function building(k,{footprint:f,dims},style='house'){
 const H=dims.height_m.total,b=bbox(f.outline), wallH=style==='civic'?H-0.5:H-2.5;
 k.begin('main');
 k.prism(f.outline,0,wallH,style==='church'?'graniteWarm':'plaster');
 polyBand(k,f.outline,0.1,0.6,0.12,'granite');
 polyBand(k,f.outline,wallH-0.4,0.35,0.15,'graniteLight');
 const storeys=style==='church'?[wallH*0.48]:[1.1,Math.max(4.5,wallH-3.2)];
 polyWindows(k,f.outline,{storeys,bay:style==='church'?6:4,w:1.25,h:style==='church'?3:2,win:{arch:style==='church'?'round':null,trim:'graniteLight',pane:'glass'}});
 // A simple roof over the mapped outline; not a measured roof survey.
 // Civic halls (museum, theatre, market) get a flat roof that follows the
 // outline: a hip roof's oriented box would overfill an irregular plan.
 if(style==='civic') k.prism(offset(f.outline,0.12),wallH,0.5,'lead');
 else roofOver(k,f.outline,wallH,2.5,'terracotta','hip',{over:0.06});
 const front=edges(f.outline).filter(e=>e.len>4).sort((a,b)=>b.len-a.len)[0];
 if(front){onEdge(k,front);win(k,0,0.1,2.3,3.6,0,{trim:'graniteLight',pane:'wood',arch:'round',bw:0.35});k.pop();}
 k.end('main');
}
const house=wrap((k,s)=>building(k,s));
const church=wrap((k,s)=>building(k,s,'church'));
const civic=wrap((k,s)=>building(k,s,'civic'));
const tower=wrap((k,{footprint:f,dims})=>{
 const H=dims.height_m.total,b=bbox(f.outline);
 k.begin('main');k.prism(f.outline,0,H-1.4,'granite');
 polyBand(k,f.outline,H*0.47,0.4,0.08,'graniteDark');
 polyWindows(k,f.outline,{storeys:[H*0.3,H*0.65],bay:6,w:0.8,h:2,win:{trim:'graniteLight',pane:'dark'}});
 k.prism(f.outline,H-1.4,0.3,'graniteLight');
 for(const e of edges(f.outline)){onEdge(k,e,H-1.1);const n=Math.max(2,Math.floor(e.len/2));for(let i=0;i<n;i++) k.box(e.len/n*0.5,1.1,0.65,'granite',-e.len/2+(i+0.5)*e.len/n,0,0);k.pop();}
 k.end('main');
});
const domeChurch=wrap((k,{footprint:f,dims})=>{
 const H=dims.height_m.total,b=bbox(f.outline),r=Math.min(b.w,b.d)*0.25;
 k.begin('main');k.prism(f.outline,0,H*0.49,'plaster');
 polyBand(k,f.outline,0.1,0.9,0.08,'granite');polyBand(k,f.outline,H*0.49-0.4,0.4,0.12,'granite');
 roofOver(k,f.outline,H*0.49,2,'terracotta','hip',{over:0.1});
 polyWindows(k,f.outline,{storeys:[3.5],bay:5,w:1.4,h:3.4,win:{trim:'granite',pane:'glass',arch:'round'}});
 const base=H-r-2;
 k.cyl(r,r,Math.max(0.3,base-H*0.49),20,'plaster',b.cx,H*0.49,b.cz);
 k.dome(r,'terracotta',b.cx,base,b.cz,{seg:32,rings:12});
 k.cyl(0.8,1,1.4,12,'graniteLight',b.cx,H-2,b.cz);
 k.box(0.2,0.6,0.2,'iron',b.cx,H-0.6,b.cz);k.box(0.7,0.16,0.16,'iron',b.cx,H-0.45,b.cz);
 k.end('main');
});
const palace=wrap((k,{footprint:f,dims})=>{
 const H=dims.height_m.total;
 k.begin('main');k.prism(f.outline,0,0.2,'sand');
 const es=edges(f.outline).filter(e=>e.len>1.2);
 es.forEach((e,i)=>{onEdge(k,e);const h=i%3===0?H:H*(0.38+(i%4)*0.12);const count=e.len>8?Math.max(1,Math.floor(e.len/6)):0;
 if(count)k.arcade(e.len,h,0.75,count,Math.min(3,e.len/count*0.6),Math.min(h*0.65,5.5),'granite',0,0,0,{pointed:true});
 else k.box(e.len,h,0.75,'granite');k.pop();});
 k.end('main');
});
const bridge=wrap((k,{footprint:f,dims})=>{
 const H=dims.height_m.total,b=bbox(f.outline),alongZ=b.d>b.w,L=Math.max(b.w,b.d),W=Math.min(b.w,b.d);
 k.begin('main');k.push({x:b.cx,z:b.cz,ry:alongZ?Math.PI/2:0});
 // Two pierced walls, five pointed arches; a little deeper than the deck so the
 // openings read from a low camera along the bridge.
 for(const z of [-W*0.38,W*0.38]) k.arcade(L,H-0.9,Math.max(0.7,W*0.28),5,L/5*0.76,H*0.78,'granite',0,0,z,{pointed:true});
 k.box(L,0.5,W,'graniteLight',0,H-1.1,0);
 // the roadway on the deck, and parapets with a pale coping course
 k.box(L,0.14,W*0.62,'dark',0,H-0.82,0);
 for(const z of [-W/2+0.16,W/2-0.16]){k.box(L,0.6,0.32,'granite',0,H-0.6,z);k.box(L,0.16,0.4,'graniteLight',0,H-0.28,z);}
 k.pop();k.end('main');
});
function garden(k,{footprint:f,dims},park){
 const H=dims.height_m.total,b=bbox(f.outline);
 k.begin('main');k.prism(f.outline,0,0.16,'grass');
 // Planting is decorative, constrained to the mapped polygon.
 const step=park?18:10;
 for(let x=b.x0+step/2;x<b.x1-step/3;x+=step)for(let z=b.z0+step/2;z<b.z1-step/3;z+=step){
  if(!inside(f.outline,x,z)||!inside(f.outline,x+3,z+3)||!inside(f.outline,x-3,z-3))continue;
  if(park){k.cyl(0.2,0.35,H*0.45,6,'trunk',x,0,z);k.sphere(H*0.3,'foliage',x,H*0.7,z,{sy:1,seg:8,rings:6});}
  else{k.box(5,0.35,5,'hedge',x,0.16,z);k.cyl(0.7,0.7,H-0.51,10,'hedge',x,0.51,z);}
 }
 k.end('main');
}
const stadium=wrap((k,{footprint:f,dims})=>{
 const H=dims.height_m.total,b=bbox(f.outline),pitch=f.parts.find(p=>p.tag==='pitch')?.pts;
 const hole=pitch||f.outline.map(([x,z])=>[b.cx+(x-b.cx)*0.62,b.cz+(z-b.cz)*0.62]);
 k.begin('main');
 k.prism(f.outline,0,H*0.35,'graniteGrey',{holes:[hole]});
 k.prism(hole,0.1,0.15,'grass');
 for(let i=0;i<9;i++){const t=0.72+i*0.025;const ring=f.outline.map(([x,z])=>[b.cx+(x-b.cx)*t,b.cz+(z-b.cz)*t]);const inner=ring.map(([x,z])=>[b.cx+(x-b.cx)*0.98,b.cz+(z-b.cz)*0.98]);k.prism(ring,H*0.36+i*H*0.045,0.7,i%2?'white':'maroon',{holes:[inner]});}
 k.prism(f.outline,H-0.8,0.8,'steel',{holes:[hole]});
 k.end('main');
});
export const detailedBuilders={
 'ponte-medieval':bridge,'bom-jesus-cruz':domeChurch,'igreja-matriz':church,'paco-condes':palace,'torre-menagem':tower,'museu-olaria':civic,'pacos-concelho':house,'solar-pinheiros':house,'teatro-gil-vicente':civic,'estadio-cidade':stadium,'parque-cidade':wrap((k,s)=>garden(k,s,true)),'jardim-barrocas':wrap((k,s)=>garden(k,s,false)),'mercado-municipal':civic,'igreja-barcelinhos':church
};
