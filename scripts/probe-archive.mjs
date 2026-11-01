#!/usr/bin/env node
// Probe public Internet Archive API for rights-labelled full-length films.
// No credentials or torrents; logs only item IDs/title/year/license and file counts.
const cases=['Big Buck Bunny','Sintel','Elephants Dream'];
for(const title of cases){
  const q='mediatype:movies AND title:("'+title.replace(/["\\]/g,' ')+'") AND licenseurl:http*';
  const u=new URL('https://archive.org/advancedsearch.php');
  u.searchParams.set('q',q);
  for(const f of ['identifier','title','year','licenseurl'])u.searchParams.append('fl[]',f);
  u.searchParams.set('rows','5');u.searchParams.set('output','json');
  try{
    const r=await fetch(u,{signal:AbortSignal.timeout(10000),headers:{accept:'application/json'}});
    const body=await r.text();
    if(!r.ok) {console.log(JSON.stringify({title,status:r.status,body:body.slice(0,180)}));continue;}
    const data=JSON.parse(body);
    const docs=data?.response?.docs??[];
    console.log(JSON.stringify({title,status:r.status,total:data?.response?.numFound??null,docs:docs.map(x=>({id:x.identifier,title:x.title,license:x.licenseurl,year:x.year}))}));
    for(const doc of docs.slice(0,2)){
      const mr=await fetch('https://archive.org/metadata/'+encodeURIComponent(doc.identifier),{signal:AbortSignal.timeout(10000)});
      if(!mr.ok){console.log(JSON.stringify({id:doc.identifier,metaStatus:mr.status}));continue;}
      const meta=await mr.json();
      console.log(JSON.stringify({id:doc.identifier,license:meta?.metadata?.licenseurl,media:(meta.files??[]).filter(f=>/\.(mp4|mkv|webm)$/i.test(f.name)).slice(0,4).map(f=>({name:f.name,source:f.source}))}));
    }
  }catch(e){console.log(JSON.stringify({title,error:String(e).slice(0,220)}));}
}
