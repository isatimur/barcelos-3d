// Deterministic build from reviewed content and the checked-in OSM snapshot.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {places,routeDefs} from '../content/barcelos.mjs';
import {minAreaRect,centroid,tagHeight} from './geo-lib.mjs';
const read = p => JSON.parse(readFileSync(p,'utf8'));
const write = (p,data) => writeFileSync(p,JSON.stringify(data,null,2)+'\n');
const readOpt = p => (existsSync(p) ? read(p) : {});
const HIST = readOpt('data/sources/history-ru.json');
const FACTS = readOpt('data/sources/facts-ru.json');
const GALLERY = readOpt('data/sources/gallery.json');
const VIDEOS = readOpt('data/sources/videos.json');
const raw=read('data/sources/landmark-osm.json');
const osm=new Map(raw.elements.map(e=>[e.type[0]+e.id,e]));
const videos=existsSync('data/sources/videos.json')?read('data/sources/videos.json'):{};
const footprints={}, dimensions={}, landmarks=[], translations={pt:{landmarks:{},routes:{}},en:{landmarks:{},routes:{}}};
const langs=['pt','en','ru'];
const tips=['Confirme horários e acesso no local; as estimativas do mapa não substituem a sinalização.','Check opening hours and access locally; map estimates do not replace signs on site.','Уточняйте часы и доступ на месте; оценки карты не заменяют указатели.'];
for(const p of places){
  const e=osm.get(p.osm);
  if(!e) throw Error(`Missing OSM record: ${p.id}`);
  const g=e.geometry || e.members?.find(m=>m.role==='outer')?.geometry;
  if(!g?.length || g[0].lat!==g.at(-1).lat || g[0].lon!==g.at(-1).lon) throw Error(`Not a closed outline: ${p.id}`);
  const outline=g.slice(0,-1).map(q=>[q.lat,q.lon]);
  const box=minAreaRect(outline), centre=centroid(outline);
  const url=`https://www.openstreetmap.org/${e.type}/${e.id}`;
  const tagged=tagHeight(e.tags);
  const height=tagged?.h || p.height;
  const heightSource=tagged?.src || 'estimate';
  const heightNote=tagged ? 'Height derived from OSM height or building:levels tags.' : `Interpretive model height (${height} m), not a surveyed measurement. Chosen for the building or landscape type; verify before measurement use.`;
  const metadata={type:e.type,id:e.id,url,height_m:height,height_source:heightSource};
  const flat=['park','garden'].includes(p.model);
  const part={id:p.osm,name:e.tags.name,tag:flat?'garden':p.model==='bridge'?'bridge':p.model==='palace'?'ruins':'building',pts:outline,height_m:height};
  const parts=[part];
  for(const m of e.members || []) if(m.role==='inner' && m.geometry) parts.push({id:`w${m.ref}`,name:'Mapped inner court / pitch',tag:'pitch',height_m:0,pts:m.geometry.slice(0,-1).map(q=>[q.lat,q.lon])});
  footprints[p.id]={osm:metadata,outline,parts,centroid:centre,bearing_deg:box.bearing,extent_m:[+box.long.toFixed(2),+box.short.toFixed(2)],height_m:height,height_source:heightSource,height_note:heightNote,exclude_outline:!flat&&p.model!=='bridge'};
  dimensions[p.id]={footprint_m:{length:+box.long.toFixed(2),width:+box.short.toFixed(2),matches_osm:true},height_m:{total:height},elements:{},facade_azimuth_deg:box.bearing||180,facade_faces:'none',facade_note:'Model aligned to the mapped long axis; this is not a surveyed front-facade bearing.',confidence:tagged?'medium':'low',sources:[
    {paths:['footprint_m.length','footprint_m.width','facade_azimuth_deg'],url,fact:'Minimum-area bounding rectangle of the OSM outline; orientation used for model alignment.',value:`${box.long.toFixed(2)} × ${box.short.toFixed(2)} m; ${box.bearing} degrees`},
    tagged?{paths:['height_m.total'],url,fact:heightNote,value:String(height)}:{paths:['height_m.total'],source:'estimate',fact:'Visual interpretation only',reasoning:heightNote}
  ]};
  const media=existsSync(`data/sources/media.json`)?read('data/sources/media.json')[p.id]:null;
  const record={id:p.id,name_pt:p.name[0],name_ru:p.name[2],category:p.category,lat:+centre[0].toFixed(7),lon:+centre[1].toFixed(7),year:p.year,model:p.model,short_ru:p.short[2],long_ru:p.text[2],history_ru:(HIST[p.id]?.length?HIST[p.id].join('\n\n'):p.text[2]),facts_ru:(FACTS[p.id]?.length?FACTS[p.id]:p.facts[0]),tip_ru:tips[2],sources:[{title:'OpenStreetMap',url},...(p.source&&p.source!==url?[{title:'Fonte cultural / Heritage source',url:p.source}]:[]),{title:'Câmara Municipal de Barcelos',url:'https://www.cm-barcelos.pt/'}],osm:metadata,model_accuracy:'interpretive',image:media?.src||null,image_credit:media?.credit||null,media_status:media?'curated':'not-curated',gallery:(media?.images||[]).map((im,i)=>({src:im.src,kind:i===0?'exterior':'detail',caption_ru:p.short[2],credit:im.credit})),panorama:null,videos:videos[p.id]||[]};
  landmarks.push(record);
  for(const [i,lang] of langs.entries()) if(lang!=='ru') translations[lang].landmarks[p.id]={name:p.name[i],short:p.short[i],long:p.text[i],history:p.text[i],facts:p.facts[i===0?1:2],tip:tips[i],year:p.year,gallery:[]};
}
write('data/landmarks.json',landmarks);write('data/footprints.json',footprints);write('data/dimensions.json',dimensions);
if(existsSync('data/routes.json')){
 const routes=read('data/routes.json').routes;
 for(const r of routes){const d=routeDefs.find(d=>d.id===r.id);if(!d)continue;
  for(const [i,lang] of ['pt','en'].entries())translations[lang].routes[r.id]={name:d.names[i],subtitle:d.descriptions[i],description:d.descriptions[i]+(i===0?' Percurso pedonal calculado com OpenStreetMap; tempos aproximados, sem garantia de acessibilidade.':' Walking route calculated with OpenStreetMap; times are approximate and accessibility is not guaranteed.'),duration:`≈ ${r.duration_min} min`,stops:r.stops.map(s=>({time:s.time_ru,note:translations[lang].landmarks[s.landmark_id].short})),legs:r.legs.map(()=>({note:i===0?'A pé · percurso calculado':'On foot · calculated route'}))};
 }
}
for(const lang of ['pt','en'])writeFileSync(`src/locales/${lang}.barcelos.js`,`// Generated by scripts/build-barcelos.mjs\nexport const landmarks = ${JSON.stringify(translations[lang].landmarks,null,2)};\nexport const routes = ${JSON.stringify(translations[lang].routes,null,2)};\n`);
const chapterIds=['ponte-medieval','paco-condes','bom-jesus-cruz','museu-olaria','estadio-cidade'];
const story={kicker_pt:'Barcelos · rio, pedra e barro',kicker_en:'Barcelos · river, stone and clay',kicker_ru:'Барселуш · река, камень и глина',title_pt:'Uma cidade em cinco lugares',title_en:'A city in five places',title_ru:'Город в пяти местах',subtitle_pt:'Percorra os lugares, leia as fontes e descubra as ligações entre eles.',subtitle_en:'Move through the places, read their sources and discover the connections.',subtitle_ru:'Пройдите по местам, изучите источники и найдите связи между ними.',chapters:chapterIds.map((id,n)=>{const p=places.find(p=>p.id===id);const l=landmarks.find(l=>l.id===id);const c={id,focus:[id],time:['morning','day','day','sunset','night'][n],sources:l.sources};for(const [i,lang]of langs.entries()){c[`era_${lang}`]=p.year||p.name[i];c[`title_${lang}`]=p.name[i];c[`text_${lang}`]=p.text[i];}return c;})};
write('data/story.json',story);
console.log(`Built ${landmarks.length} landmarks, sourced dimensions/outlines, two translations and ${story.chapters.length} story chapters.`);
