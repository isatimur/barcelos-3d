import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
const w=JSON.parse(readFileSync('data/.cache/research/wikidata.json','utf8'));
const map={Q9088866:'torre-menagem',Q10300883:'bom-jesus-cruz',Q5993993:'igreja-matriz',Q10347027:'paco-condes',Q10333855:'museu-olaria',Q66813160:'solar-pinheiros',Q10378848:'teatro-gil-vicente'};
mkdirSync('assets/img',{recursive:true});
const media=existsSync('data/sources/media.json')?JSON.parse(readFileSync('data/sources/media.json')):{};
const clean=s=>String(s||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').trim();
for(const [qid,id] of Object.entries(map)){
 const filename=w.entities[qid]?.claims.P18?.[0]?.mainsnak?.datavalue?.value;
 if(!filename||media[id])continue;
 const url='https://commons.wikimedia.org/w/api.php?'+new URLSearchParams({action:'query',titles:'File:'+filename,prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'960',format:'json'});
 const res=await fetch(url,{signal:AbortSignal.timeout(30000),headers:{'User-Agent':'Barcelos3D/1.0 (educational map)'}});
 if(!res.ok)throw Error(`Commons ${res.status}`);
 const j=await res.json();const info=Object.values(j.query.pages)[0].imageinfo?.[0];if(!info)throw Error(filename);
 const license=clean(info.extmetadata?.LicenseShortName?.value);if(!/^(CC BY(-SA)?|CC0|Public domain)/i.test(license))throw Error(`Unverified reuse license ${license}`);
 const image=await fetch(info.thumburl||info.url,{signal:AbortSignal.timeout(30000),headers:{'User-Agent':'Barcelos3D/1.0'}});if(!image.ok)throw Error(`Image ${image.status}`);
 const data=Buffer.from(await image.arrayBuffer());if(data[0]!==255||data[1]!==216)throw Error('Not JPEG');
 const src=`assets/img/${id}.jpg`;writeFileSync(src,data);
 media[id]={src,credit:{author:clean(info.extmetadata.Artist?.value)||'Wikimedia Commons contributors',license,source_url:info.descriptionurl},retrieved:'2026-10-02',wikidata:qid};
 writeFileSync('data/sources/media.json',JSON.stringify(media,null,2)+'\n');
 console.log(`${id}: ${license}, ${data.length} bytes`);
 await new Promise(resolve=>setTimeout(resolve,1000));
}
