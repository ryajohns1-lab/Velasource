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