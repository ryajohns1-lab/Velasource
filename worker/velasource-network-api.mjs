/**
 * VelaSource v7 — independent rights-aware provider network.
 * Search providers: Internet Archive, Wikimedia Commons, owner-authorized JSON feed (optional).
 * No torrent indexes, no debrid credentials, and no arbitrary user-defined remote URLs.
 * v5/v6 Cloudflare Worker remains deployed separately and unchanged.
 */
const ROOT = "https://velasource-network-api.ryajohns1.workers.dev";
const VERSION = 7;
const vendor = {
  name: "VelaSource v7 — Provider Network",
  description: "Parallel movie lookup across license-labelled public media catalogs; optional owner-authorized feed for movies/episodes.",
  packages: [{manifest:ROOT+"/syncler/v7/manifest",description:"VelaSource Network Express v7"}]
};
const manifest = {
  name:"VelaSource Network — Express v7",id:"community.velasource.network.v7",
  version:VERSION,classPath:"",permaUrl:ROOT+"/syncler/v7/express",type:"express"
};
const definition = {
  _manifest:{name:"VelaSource Network v7",id:"community.velasource.network.v7",version:VERSION},
  velasource:{
    name:"VelaSource — Parallel Licensed Network",enabled:true,base_url:ROOT+"/",response_type:"json",
    movie:{query:"v7/search?kind=movie&title={query}&year={year}",keywords:"{title}"},
    episode:{query:"v7/search?kind=episode&title={query}&season={season}&episode={episode}",keywords:"{title}"},
    json_format:{results:"results",title:"title",url:"url",size:"sizeBytes"}
  }
};
const TTL=120000, MAX_CACHE=150;
const cache=new Map(), status=new Map();
const codecs = /^(?:4k|2160p|1080p|720p|480p|360p|h264|h265|x264|x265|hevc|av1|vp8|vp9|uhd|fhd|hd|movie|film|full)$/;
const badParts = /(?:^|[.\s_-])(?:trailer|excerpt|extract|preview|teaser|clip|sample|behind.the.scenes|interview|fan.edit)(?:[.\s_-]|$)/i;
const movieExtension=/\.(mp4|m4v|webm|ogv|mkv)$/i;
const asText=x=>typeof x==="string"||typeof x==="number"?String(x):Array.isArray(x)?asText(x[0]):"";
const canon=s=>String(s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const words=s=>canon(s).split(" ").filter(w=>w && !codecs.test(w));
function similarity(a,b){
  const aa=new Set(words(a)),bb=new Set(words(b));
  if(!aa.size||!bb.size)return 0;
  let overlap=0;for(const w of aa)if(bb.has(w))overlap++;
  return overlap/Math.max(aa.size,bb.size);
}
function rights(url){
  try {
    const u=new URL(asText(url));
    if(!["creativecommons.org","www.creativecommons.org"].includes(u.hostname))return false;
    return /^\/(?:licenses\/(?:by(?:-[a-z]+){0,2}|zero)\/|publicdomain\/(?:zero|mark)\/)/.test(u.pathname);
  }catch {return false;}
}
function send(data,code=200){
  return new Response(JSON.stringify(data),{status:code,headers:{
    "content-type":"application/json; charset=utf-8","cache-control":"no-store",
    "access-control-allow-origin":"*","x-content-type-options":"nosniff"}});
}
async function getJson(url,timeoutMs=4700){
  const res=await fetch(url,{signal:AbortSignal.timeout(timeoutMs),headers:{
    accept:"application/json","user-agent":"VelaSource-v7/1.0 (rights-aware movie catalog; https://github.com/ryajohns1-lab/Velasource)"}});
  if(!res.ok)throw Error("HTTP "+res.status);
  const declared=Number(res.headers.get("content-length")||0);
  if(declared>1300000)throw Error("Response exceeds limit");
  const body=await res.text();
  if(body.length>1300000)throw Error("Response exceeds limit");
  return JSON.parse(body);
}
function relevant(title,found,year,wantedYear){
  if(similarity(title,found)<0.78)return false;
  if(wantedYear && year && Math.abs(Number(year)-Number(wantedYear))>1)return false;
  return true;
}
function validateMediaUrl(url,expectedHost){
  try{
    const u=new URL(url);
    if(u.protocol!=="https:")return false;
    return typeof expectedHost==="string"?u.hostname===expectedHost:expectedHost.includes(u.hostname);
  }catch{return false;}
}
function score(item,title,year){
  let n=100*similarity(title,item.title);
  if(year&&item.year)n+=Number(year)===Number(item.year)?10:-5;
  if(/1080p|2160p|4k/i.test(item.filename||""))n+=4;
  if(/\.mp4$/i.test(item.filename||""))n+=5;
  return Math.round(n);
}
async function archive(title,year){
  const q=title.replace(/["\\]/g," ").replace(/[^a-zA-Z0-9 .'-]/g," ").slice(0,85);
  const u=new URL("https://archive.org/advancedsearch.php");
  u.searchParams.set("q",'mediatype:movies AND title:("'+q+'") AND licenseurl:http*');
  for(const f of ["identifier","title","year","licenseurl"])u.searchParams.append("fl[]",f);
  u.searchParams.set("rows","9");u.searchParams.set("output","json");
  const listing=await getJson(u.toString(),5200);
  const docs=(listing.response?.docs||[]).filter(d=>/^[a-zA-Z0-9_.-]{1,120}$/.test(d.identifier||"")
    && rights(d.licenseurl)&&relevant(title,asText(d.title),d.year,year)).slice(0,5);
  const results=await Promise.all(docs.map(async doc=>{
    try{
      const meta=await getJson("https://archive.org/metadata/"+encodeURIComponent(doc.identifier),4500);
      if(!rights(meta.metadata?.licenseurl)||!relevant(title,asText(meta.metadata?.title),doc.year,year))return null;
      const files=(Array.isArray(meta.files)?meta.files:[])
        .filter(f=>typeof f.name==="string"&&f.name.length<220&&movieExtension.test(f.name)
          &&!badParts.test(f.name)&&f.private!=="true");
      // Prefer broadly playable MP4 to an original MKV/WebM when both exist.
      const preference=f=>(/\.mp4$/i.test(f.name)?40:/\.m4v$/i.test(f.name)?35:
        /\.webm$/i.test(f.name)?20:/\.mkv$/i.test(f.name)?5:0)+
        Number(f.source==="original")*4+Number(/1080p|2160p|4k/i.test(f.name))*3;
      files.sort((a,b)=>preference(b)-preference(a));
      const file=files[0];if(!file)return null;
      return {title:asText(meta.metadata.title),year:Number(asText(doc.year))||undefined,
        url:"https://archive.org/download/"+encodeURIComponent(doc.identifier)+"/"+file.name.split("/").map(encodeURIComponent).join("/"),
        filename:file.name,sizeBytes:Number(file.size)||undefined,
        license:asText(meta.metadata.licenseurl),provider:"Internet Archive",originId:"archive:"+doc.identifier};
    }catch{return null;}
  }));
  return results.filter(Boolean);
}
async function commons(title,year){
  const search=new URL("https://commons.wikimedia.org/w/api.php");
  const params={action:"query",generator:"search",gsrsearch:"File:"+title.replace(/[^a-zA-Z0-9 ']/g," ").slice(0,75)+" filetype:video",
    gsrnamespace:"6",gsrlimit:"15",prop:"imageinfo",iiprop:"url|mime|extmetadata|size",
    format:"json",formatversion:"2",origin:"*"};
  Object.entries(params).forEach(([k,v])=>search.searchParams.set(k,v));
  const data=await getJson(search.toString(),5300);
  const items=data?.query?.pages||[];
  const out=[];
  for(const page of items){
    const info=page?.imageinfo?.[0]; if(!info)continue;
    const filename=asText(page.title).replace(/^File:/i,"");
    if(!movieExtension.test(filename)||badParts.test(filename))continue;
    const bare=filename.replace(movieExtension,"").replace(/[._]/g," ").trim();
    if(!relevant(title,bare,null,year))continue;
    const lic=info?.extmetadata?.LicenseUrl?.value;
    if(!rights(lic))continue;
    if(!validateMediaUrl(info.url,["upload.wikimedia.org"]))continue;
    out.push({title:title,year:year?Number(year):undefined,url:info.url,filename,
      sizeBytes:Number(info.size)||undefined,license:asText(lic),
      provider:"Wikimedia Commons",originId:"commons:"+asText(page.pageid||filename)});
  }
  return out.slice(0,6);
}
// Owner feed: explicitly configured deployment-time URL and both feed host and media host allowlists.
// Feed format: {"items":[{"kind":"movie"|"episode","title":"...","year":2008,
//   "season":1,"episode":2,"url":"https://approved-host/file.mp4",
//   "license":"https://creativecommons.org/licenses/by/...", "filename":"..."}]}
// For owner-controlled, commercially licensed media, use "rightsGranted":true
// instead of a CC URL; the feed and media domains must still be on deployment-time allowlists.
// No arbitrary input URLs are fetched; absent env binding leaves this provider disabled.
function authorizedConfig(env){
  if(!env?.AUTHORIZED_FEED_URL||!env?.AUTHORIZED_FEED_HOST||!env?.AUTHORIZED_MEDIA_HOSTS)return null;
  const host=asText(env.AUTHORIZED_FEED_HOST).trim();
  const allowed=asText(env.AUTHORIZED_MEDIA_HOSTS).split(",").map(x=>x.trim()).filter(Boolean);
  if(!allowed.length||!validateMediaUrl(env.AUTHORIZED_FEED_URL,host))return null;
  return {url:env.AUTHORIZED_FEED_URL,allowed};
}
async function authorized(title,year,kind,season,episode,env){
  const cfg=authorizedConfig(env);
  if(!cfg)return [];
  const data=await getJson(cfg.url,4600),items=Array.isArray(data?.items)?data.items:[];
  return items.slice(0,300).filter(item=>item.kind===kind
    && relevant(title,asText(item.title),item.year,year)
    && (kind!=="episode"||(Number(item.season)===season&&Number(item.episode)===episode))
    && (rights(item.license)||item.rightsGranted===true)&&validateMediaUrl(item.url,cfg.allowed)
    && typeof item.url==="string"&&item.url.length<2048)
    .slice(0,15).map(item=>({title:asText(item.title),year:Number(item.year)||undefined,
      season:kind==="episode"?season:undefined,episode:kind==="episode"?episode:undefined,
      episodeVerified:kind==="episode",url:item.url,filename:asText(item.filename)||asText(item.title),
      sizeBytes:Number(item.sizeBytes)||undefined,provider:"Authorized Owner Feed",
      license:rights(item.license)?asText(item.license):"Owner-authorized",
      originId:"owner:"+item.url}));
}
const providerKeys=["Internet Archive","Wikimedia Commons","Authorized Owner Feed"];
function runProvider(name,task){
  const previous=status.get(name)||{failures:0};
  if(previous.openUntil&&previous.openUntil>Date.now())return Promise.resolve({name,items:[],state:"circuit-open"});
  const start=Date.now();
  return Promise.resolve().then(task).then(items=>{
    status.set(name,{state:"ok",failures:0,latencyMs:Date.now()-start,at:Date.now()});
    return {name,items,state:"ok",latencyMs:Date.now()-start};
  }).catch(err=>{
    const failures=(previous.failures||0)+1;
    status.set(name,{state:"error",failures,latencyMs:Date.now()-start,at:Date.now(),
      openUntil:failures>=3?Date.now()+90000:0,error:asText(err?.message).slice(0,90)});
    return {name,items:[],state:"error",error:asText(err?.message).slice(0,90)};
  });
}
function uniqueSorted(results,title,year){
  const seen=new Set(),out=[];
  for(const item of results){
    if(!validateMediaUrl(item.url,["archive.org","upload.wikimedia.org",...(
      [] // Owner-feed media hosts were checked before this merge. Do not admit arbitrary hosts here.
    )]) && item.provider!=="Authorized Owner Feed")continue;
    const key=item.url.split("?")[0].toLowerCase();
    if(seen.has(key))continue;
    seen.add(key);
    out.push({...item,matchScore:score(item,title,year)});
  }
  return out.sort((a,b)=>b.matchScore-a.matchScore).slice(0,30);
}
async function networkSearch(url,env){
  const kind=url.searchParams.get("kind")||"movie";
  const title=(url.searchParams.get("title")||"").trim();
  const year=url.searchParams.get("year")||"";
  const season=Number(url.searchParams.get("season")),episode=Number(url.searchParams.get("episode"));
  if(!["movie","episode"].includes(kind)||title.length<3||title.length>110
      ||!/^([12]\d{3})?$/.test(year)||(
        kind==="episode"&&(!Number.isInteger(season)||season<0||season>99||
          !Number.isInteger(episode)||episode<1||episode>999)))
    return send({error:"Invalid title, year or episode",results:[]},400);
  // Partition cache by deployment-configured feed. Do not reuse authorized
  // results if a deployment changes or removes its feed/allowed media hosts.
  const config=authorizedConfig(env);
  const key=[kind,canon(title),year,season,episode,
    config?.url||"unconfigured",config?.allowed.join(",")||""].join("|");
  const prev=cache.get(key);
  if(prev&&Date.now()-prev.at<TTL)return send({...prev.response,cacheHit:true});
  const jobs=[];
  if(kind==="movie"){
    jobs.push(runProvider("Internet Archive",()=>archive(title,year)));
    jobs.push(runProvider("Wikimedia Commons",()=>commons(title,year)));
  }
  jobs.push(authorizedConfig(env)?runProvider("Authorized Owner Feed",
    ()=>authorized(title,year,kind,season,episode,env)):Promise.resolve({
       name:"Authorized Owner Feed",state:"unconfigured",items:[]}));
  const settled=await Promise.all(jobs);
  const results=uniqueSorted(settled.flatMap(x=>x.items),title,year);
  const reports=settled.map(({name,state,latencyMs,error,items})=>({
    name,status:state,count:items.length,...(latencyMs===undefined?{}:{latencyMs}),...(error?{error}:{})
  }));
  const response={service:"VelaSource",version:VERSION,kind,title,year:year||undefined,
    results,count:results.length,providers:reports,cachedOnly:false,
    note:"Source discovery only. Ovrelixa independently permits Premiumize-confirmed cached media."};
  if(settled.some(x=>x.state==="ok")){
    cache.set(key,{at:Date.now(),response});
    if(cache.size>MAX_CACHE)cache.delete(cache.keys().next().value);
  }
  return send(response);
}
export default {
  async fetch(request,env={}){
    const url=new URL(request.url);
    if(request.method!=="GET")return send({error:"Only GET is supported"},405);
    const path=url.pathname.replace(/\/+$/,"")||"/";
    if(path==="/syncler/v7/vendor")return send(vendor);
    if(path==="/syncler/v7/manifest")return send(manifest);
    if(path==="/syncler/v7/express")return send(definition);
    if(path==="/v7/search")return networkSearch(url,env);
    if(path==="/v7/health"||path==="/v7/providers")return send({
      ok:true,service:"VelaSource provider network",version:VERSION,
      providers:providerKeys.map(name=>({name,configured:name!=="Authorized Owner Feed"||!!authorizedConfig(env),
        ...(status.get(name)||{state:"not-yet-queried"})})),
      cacheEntries:cache.size});
    if(path==="/")return send({name:"VelaSource v7",importUrl:ROOT+"/syncler/v7/vendor/"});
    return send({error:"Not found"},404);
  }
};
