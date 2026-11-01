// VelaSource standalone Express adapter smoke-test (licensed source only).
// All package JSON is served by this Worker with application/json and no GitHub redirects.
const ORIGIN = "https://velasource-demo-api.ryajohns1.workers.dev";
const FILM = Object.freeze({
  title: "Big Buck Bunny (2008) · CC BY 3.0 · Test Stream",
  releaseName: "Big.Buck.Bunny.2008.CCBY3.Sample.mp4",
  url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  provider: "VelaSource Licensed Sample",
  matchTier: "high",
  episodeVerified: true,
});
const RULE = Object.freeze({
  name:"VelaSource v4 Licensed Sample",
  enabled:true,
  base_url:ORIGIN+"/",
  response_type:"json",
  movie:{query:"search?kind=movie&title={query}&year={year}&imdbId={imdbId}",keywords:"{title}"},
  episode:{query:"search?kind=episode&title={query}&season={season}&episode={episode}",keywords:"{title}"},
  json_format:{results:"results",title:"title",url:"url",size:"sizeBytes",seeds:"seeds"},
});
const PACKAGE = {
  _manifest:{name:"VelaSource Express Adapter v4",id:"community.velasource.express.v4",version:4},
  velasource:RULE,
};
const VENDOR = {
  name:"VelaSource v4 · Hosted Express",
  description:"Licensed smoke-test adapter. Metadata and provider rules served together from Cloudflare.",
  packages:[{name:"VelaSource Express Adapter v4",description:"Hosted one-file Express provider; test only with Big Buck Bunny.",manifest:ORIGIN+"/package-v4.json"}],
};
// JakedUp-style vendor -> legacy manifest -> Express provider definition.
const V5_VENDOR = {
  name:"VelaSource - Vendor",
  description:"VelaSource independent source engine; licensed-sample compatibility check",
  packages:[{manifest:ORIGIN+"/syncler/express/manifest",
    description:"VelaSource Express v5 - licensed sample search"}]
};
const V5_MANIFEST = {
  name:"VelaSource - Express v5",
  id:"community.velasource.express.v5",
  version:5,
  classPath:"",
  permaUrl:ORIGIN+"/syncler/express",
  type:"express"
};
const V5_DEFINITION = {
  _manifest:{name:"VelaSource Express v5",id:"community.velasource.express.v5",version:5},
  velasource:{...RULE,name:"VelaSource v5 (licensed test)"}
};

// v6 authorized/public-media connector. Internet Archive records are checked
// for a close title/year match, an explicit CC/public-domain license and a real
// video filename before exposing any direct HTTPS candidate. No credentials.
const V6_VENDOR = {name:"VelaSource v6 — Licensed Archive",description:"Live public-domain/Creative-Commons film search (movies only).",packages:[
  {manifest:ORIGIN+"/syncler/v6/manifest",description:"VelaSource Archive v6 — licensed movie search"}
]};
const V6_MANIFEST = {name:"VelaSource — Archive Express v6",id:"community.velasource.archive.v6",
  version:6,classPath:"",permaUrl:ORIGIN+"/syncler/v6/express",type:"express"};
const V6_DEFINITION = {_manifest:{name:"VelaSource Archive v6",id:"community.velasource.archive.v6",version:6},
  archive:{name:"Internet Archive — CC & Public Domain",enabled:true,
    base_url:ORIGIN+"/",response_type:"json",
    movie:{query:"v6/search?kind=movie&title={query}&year={year}",keywords:"{title}"},
    episode:{query:"v6/search?kind=episode&title={query}&season={season}&episode={episode}",keywords:"{title}"},
    json_format:{results:"results",title:"title",url:"url",size:"sizeBytes"}}};
const rightsPattern=/^https?:\/\/(?:www\.)?creativecommons\.org\/(?:licenses\/(?:by(?:-sa|-nc(?:-sa|-nd)?|-nd)?|zero)\/|publicdomain\/(?:zero|mark)\/)/i;
const movieFiles=/\.(?:mp4|m4v|webm|mkv)$/i;
const excludeFiles=/(?:^|[.\s_-])(?:trailer|sample|teaser|preview|clip|commentary)(?:[.\s_-]|$)/i;
const shortText=x=>typeof x==="string"?x:Array.isArray(x)?x[0]:"";
const normalized=x=>String(x||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
function similarity(a,b) {
  const sa=new Set(normalized(a).split(" ").filter(Boolean));
  const sb=new Set(normalized(b).split(" ").filter(Boolean));
  if(!sa.size||!sb.size)return 0;
  let matched=0;for(const word of sa)if(sb.has(word))matched++;
  return matched/Math.max(sa.size,sb.size);
}
const licensed=x=>rightsPattern.test(shortText(x?.licenseurl));
const archiveCache=new Map();
async function archiveJson(url,timeout=2600) {
  const r=await fetch(url,{headers:{accept:"application/json"},signal:AbortSignal.timeout(timeout)});
  if(!r.ok)throw Error("Archive HTTP "+r.status);
  if(Number(r.headers.get("content-length")||0)>1200000)throw Error("Archive response too large");
  const body=await r.text();
  if(body.length>1200000)throw Error("Archive response too large");
  return JSON.parse(body);
}
async function archiveSearch(title,year) {
  const query=title.trim().replace(/["\\]/g," ").replace(/[^a-zA-Z0-9 .'-]/g," ").slice(0,80);
  if(!query || normalized(query).length<3) return {results:[],status:"invalid-title"};
  const search=new URL("https://archive.org/advancedsearch.php");
  search.searchParams.set("q",'mediatype:movies AND title:("'+query+'") AND licenseurl:http*');
  for(const field of ["identifier","title","year","licenseurl"])search.searchParams.append("fl[]",field);
  search.searchParams.set("rows","8");search.searchParams.set("output","json");
  const docs=(await archiveJson(search.toString(),3200))?.response?.docs??[];
  const candidates=docs.filter(x=>typeof x.identifier==="string" && /^[a-zA-Z0-9_.-]{1,120}$/.test(x.identifier)
      && licensed(x) && similarity(title,shortText(x.title))>=.78
      && (!year || !x.year || Math.abs(Number(shortText(x.year))-Number(year))<=1)).slice(0,5);
  let count=0;
  const checks=candidates.map(async item=>{
    try {
      const meta=await archiveJson("https://archive.org/metadata/"+encodeURIComponent(item.identifier),2500);
      if(!licensed(meta?.metadata) || similarity(title,shortText(meta.metadata.title))<.78)return null;
      const file=(Array.isArray(meta.files)?meta.files:[])
        .filter(f=>typeof f?.name==="string"&&f.name.length<=255&&movieFiles.test(f.name)&&!excludeFiles.test(f.name)&&f.private!=="true")
        .sort((a,b)=>(Number(b.source==="original")*10+Number(/1080p/i.test(b.name))*2+Number(/\.mp4$/i.test(b.name)))-
                     (Number(a.source==="original")*10+Number(/1080p/i.test(a.name))*2+Number(/\.mp4$/i.test(a.name))))[0];
      if(!file)return null;
      const fileUrl="https://archive.org/download/"+encodeURIComponent(item.identifier)+"/"+file.name.split("/").map(encodeURIComponent).join("/");
      count++;
      return {title:shortText(meta.metadata.title),url:fileUrl,
        filename:file.name,sizeBytes:Number(file.size)||undefined,
        year:Number(shortText(item.year))||undefined,archiveId:item.identifier,
        license:shortText(meta.metadata.licenseurl),provider:"Internet Archive"};
    } catch { return null; }
  });
  const settled=await Promise.all(checks);
  const unique=new Map();for(const item of settled)if(item && !unique.has(item.archiveId))unique.set(item.archiveId,item);
  return {results:[...unique.values()].slice(0,4),status:"ok",checked:candidates.length,accepted:count};
}
async function handleArchiveSearch(url) {
  if(url.searchParams.get("kind")!=="movie")return sendJson({service:"VelaSource",version:6,results:[],status:"movies-only"});
  const title=url.searchParams.get("title")||"",year=url.searchParams.get("year")||"";
  if(title.length>120||!/^\d{0,4}$/.test(year)||normalized(title).length<3)return sendJson({results:[],error:"Invalid title or year"},400);
  const key=normalized(title)+"|"+year,now=Date.now(),entry=archiveCache.get(key);
  if(entry&&now-entry.when<300000)return sendJson({...entry.data,cacheHit:true},200,"public, max-age=45");
  try {
    const data=await archiveSearch(title,year);
    const response={service:"VelaSource",version:6,source:"Internet Archive licensed films",
      results:data.results,status:data.status,checked:data.checked??0,elapsedMs:null};
    archiveCache.set(key,{when:Date.now(),data:response});
    if(archiveCache.size>100)archiveCache.delete(archiveCache.keys().next().value);
    return sendJson(response,200,"public, max-age=45");
  } catch(e) {
    return sendJson({service:"VelaSource",version:6,results:[],status:"provider-unavailable",
      message:String(e.message||e).slice(0,90)},200,"no-store");
  }
}

function sendJson(data,status=200,cache="no-store"){
  return new Response(JSON.stringify(data),{status,headers:{
    "content-type":"application/json; charset=utf-8",
    "cache-control":cache,
    "access-control-allow-origin":"*",
    "x-content-type-options":"nosniff"
  }});
}
const normalize=s=>s.toLowerCase().replace(/[^a-z0-9]+/g," ").trim().slice(0,140);
export default {
  async fetch(req) {
    const url=new URL(req.url);
    if(req.method!=="GET")return sendJson({error:"GET only"},405);
    if(url.pathname==="/health")return sendJson({ok:true,service:"VelaSource Express smoke test",version:4,providerCount:1,mode:"licensed-sample"});
    if(url.pathname==="/vendor-v4.json")return sendJson(VENDOR);
    if(url.pathname==="/package-v4.json")return sendJson(PACKAGE);
    if(url.pathname==="/syncler/vendor" || url.pathname==="/syncler/vendor/")return sendJson(V5_VENDOR);
    if(url.pathname==="/syncler/express/manifest" || url.pathname==="/syncler/express/manifest/")return sendJson(V5_MANIFEST);
    if(url.pathname==="/syncler/express" || url.pathname==="/syncler/express/")return sendJson(V5_DEFINITION);
    if(url.pathname==="/syncler/v6/vendor" || url.pathname==="/syncler/v6/vendor/")return sendJson(V6_VENDOR);
    if(url.pathname==="/syncler/v6/manifest")return sendJson(V6_MANIFEST);
    if(url.pathname==="/syncler/v6/express")return sendJson(V6_DEFINITION);
    if(url.pathname==="/v6/search")return handleArchiveSearch(url);
    if(url.pathname==="/search" || url.pathname==="/v1/express/search"){
      const kind=url.searchParams.get("kind")||"movie";
      const title=normalize(url.searchParams.get("title")||"");
      if(!["movie","episode"].includes(kind)||!title)return sendJson({error:"invalid search",results:[]},400);
      const match=kind==="movie" && (
        title==="big buck bunny" || title==="big buck bunny 2008" ||
        (url.searchParams.get("imdbId")==="tt1254207" && title.startsWith("big buck bunny"))
      );
      return sendJson({
        service:"VelaSource",version:4,mode:"licensed-sample",
        results:match?[FILM]:[],count:match?1:0,
        providerReports:[{name:"VelaSource Licensed Sample",status:"ok",count:match?1:0}]
      },200,"public, max-age=45");
    }
    if(url.pathname==="/")return sendJson({name:"VelaSource v4 test adapter",vendor:ORIGIN+"/vendor-v4.json"});
    return sendJson({error:"Not found"},404);
  }
};