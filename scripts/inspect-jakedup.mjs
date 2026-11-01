#!/usr/bin/env node
const urls=['https://jakedup.com/syncler/vendor','https://jakedup.com/syncler/express/manifest','https://jakedup.com/syncler/express'];
for(const url of urls) {
  try{
    const r=await fetch(url,{signal:AbortSignal.timeout(12000),headers:{Accept:'application/json,text/html;q=0.9'}});
    const s=await r.text();
    let j;try{j=JSON.parse(s)}catch{}
    console.log(JSON.stringify({url,status:r.status,final:r.url,type:r.headers.get('content-type'),bytes:s.length,
      keys:j&&typeof j==='object'?Object.keys(j).slice(0,18):[],json:(url.endsWith('/manifest')||url.endsWith('/vendor'))?j:undefined,
      firstRules:url.endsWith('/express')&&j?Object.keys(j).slice(0,6).map(x=>[x,typeof j[x]==='object'?{base_url:j[x]?.base_url,response_type:j[x]?.response_type,hasMovie:!!j[x]?.movie,hasEpisode:!!j[x]?.episode}:typeof j[x]]):undefined}));
  }catch(e){console.log(JSON.stringify({url,error:String(e)}))}
}
