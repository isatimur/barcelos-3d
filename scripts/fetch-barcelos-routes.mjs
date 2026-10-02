// FOSSGIS walking profile only. Never substitute car routes for walking paths.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {routeDefs} from '../content/barcelos.mjs';
const landmarks=JSON.parse(readFileSync('data/landmarks.json','utf8'));
const byId=new Map(landmarks.map(l=>[l.id,l]));
const cache='data/.cache/routes';mkdirSync(cache,{recursive:true});
const routes=[];
for(const def of routeDefs){
 const legs=[];
 for(let i=1;i<def.stops.length;i++){
  const from=def.stops[i-1],to=def.stops[i],a=byId.get(from),b=byId.get(to);
  const file=`${cache}/${from}--${to}.json`;
  const url=`https://routing.openstreetmap.de/routed-foot/route/v1/foot/${a.lon},${a.lat};${b.lon},${b.lat}?overview=full&geometries=geojson`;
  let j;
  if(existsSync(file))j=JSON.parse(readFileSync(file,'utf8'));
  else{
   const res=await fetch(url,{signal:AbortSignal.timeout(30000),headers:{'User-Agent':'barcelos-3d-content/1.0'}});
   if(!res.ok)throw Error(`Walking route ${from} -> ${to}: HTTP ${res.status}`);
   j=await res.json();if(j.code!=='Ok'||!j.routes?.[0]?.geometry?.coordinates?.length)throw Error(`No walking route ${from} -> ${to}`);
   writeFileSync(file,JSON.stringify(j));
   await new Promise(resolve=>setTimeout(resolve,1000));
  }
  const r=j.routes[0];
  legs.push({from,to,mode:'foot',distance_m:Math.round(r.distance),duration_min:Math.max(1,Math.ceil(r.duration/60)),note_ru:'Пешком · рассчитанный маршрут',pts:r.geometry.coordinates.map(([lon,lat])=>[+lat.toFixed(5),+lon.toFixed(5)]),routing_source:url});
  console.log(`${from} -> ${to}: ${Math.round(r.distance)} m`);
 }
 let clock=10*60;
 const stops=def.stops.map((id,i)=>{if(i)clock+=legs[i-1].duration_min;const time=`${String(Math.floor(clock/60)).padStart(2,'0')}:${String(clock%60).padStart(2,'0')}`;const stay=id==='museu-olaria'?40:15;clock+=stay;return{landmark_id:id,time_ru:time,stay_min:stay,note_ru:byId.get(id).short_ru};});
 const duration=clock-600;
 routes.push({id:def.id,name_ru:def.names[2],subtitle_ru:def.descriptions[2],description_ru:def.descriptions[2]+' Пешеходный маршрут рассчитан по OpenStreetMap. Время примерное, доступность не гарантирована.',color:def.color,duration_ru:`≈ ${duration} мин`,duration_min:duration,distance_km:Math.round(legs.reduce((s,l)=>s+l.distance_m,0)/100)/10,stops,legs});
}
writeFileSync('data/routes.json',JSON.stringify({attribution:'© OpenStreetMap contributors (ODbL). Walking geometry: FOSSGIS / OSRM. Times are estimates; check local access.',routing_profile:'foot',generated_at:new Date().toISOString(),routes},null,2)+'\n');
console.log('Saved three walking routes. Run node scripts/build-barcelos.mjs to refresh route translations.');
