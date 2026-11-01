// Public smoke test only: one Creative Commons BY 3.0 video title.
// This is not the Node.js VelaSource search engine; never request arbitrary sites.
const FILM = Object.freeze({
  title: 'Big Buck Bunny (2008) · CC BY 3.0 · Test Stream',
  releaseName: 'Big.Buck.Bunny.2008.1080p.H264.CCBY3.Test.mp4',
  url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  provider: 'VelaSource Licensed Sample',
  matchTier: 'high',
  episodeVerified: true,
});
function response(body,status=200){
 return new Response(JSON.stringify(body),{status,headers:{
  'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=45',
  'access-control-allow-origin':'*','x-content-type-options':'nosniff'}});
}
function normal(title){return title.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().slice(0,140);}
export default { async fetch(request) {
 const u=new URL(request.url);
 if(request.method!=='GET')return response({error:'GET only'},405);
 if(u.pathname==='/health')return response({ok:true,service:'VelaSource Express adapter smoke test',mode:'licensed-demo',providers:1});
 if(u.pathname==='/search'||u.pathname==='/v1/express/search'){
  const kind=u.searchParams.get('kind')||'movie';
  const title=normal(u.searchParams.get('title')||'');
  if(!['movie','episode'].includes(kind)||!title||title.length>140)
   return response({error:'invalid search',results:[]},400);
  const match=kind==='movie'&&(title==='big buck bunny'||title==='big buck bunny 2008'||
    (u.searchParams.get('imdbId')==='tt1254207'&&title.startsWith('big buck bunny')));
  return response({service:'VelaSource',mode:'licensed-demo',results:match?[FILM]:[],count:match?1:0,
   providerReports:[{name:'VelaSource Licensed Sample',status:'ok',count:match?1:0}]});
 }
 if(u.pathname==='/')return response({name:'VelaSource demo adapter',routes:['/health','/search?kind=movie&title=Big%20Buck%20Bunny']});
 return response({error:'not found'},404);
}};
