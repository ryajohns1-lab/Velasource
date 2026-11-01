import test from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/velasource-network-api.mjs";
const root="https://velasource-network-api.ryajohns1.workers.dev";
const approved={AUTHORIZED_FEED_URL:"https://feed.authorized.test/catalog.json",
  AUTHORIZED_FEED_HOST:"feed.authorized.test",AUTHORIZED_MEDIA_HOSTS:"media.authorized.test"};
const fixture={items:[
 {kind:"episode",title:"Amber Sky",year:2026,season:1,episode:2,
  url:"https://media.authorized.test/amber/1x02.mp4",rightsGranted:true,
  filename:"Amber.Sky.S01E02.1080p.mp4"},
 {kind:"episode",title:"Amber Sky",year:2026,season:1,episode:3,
  url:"https://media.authorized.test/amber/1x03.mp4",rightsGranted:true},
 {kind:"episode",title:"Amber Sky",year:2026,season:1,episode:2,
  url:"https://evil.example.test/amber/1x02.mp4",rightsGranted:true},
 {kind:"episode",title:"Amber Sky",year:2026,season:1,episode:2,
  url:"http://media.authorized.test/amber/untrusted.mp4",rightsGranted:true},
 {kind:"episode",title:"Amber Sky",year:2026,season:1,episode:2,
  url:"https://media.authorized.test/amber/unlicensed.mp4"},
 {kind:"episode",title:"Elsewhere",year:2026,season:1,episode:2,
  url:"https://media.authorized.test/elsewhere.mp4",rightsGranted:true}
]};
const oldFetch=globalThis.fetch;
test("authorized TV feeds enforce title, season, episode, host, HTTPS and attested rights",async()=>{
 globalThis.fetch=async(url)=>{
  assert.equal(String(url),approved.AUTHORIZED_FEED_URL);
  return new Response(JSON.stringify(fixture),{status:200,headers:{"content-type":"application/json"}});
 };
 try {
  const url=root+"/v7/search?kind=episode&title=Amber%20Sky&year=2026&season=1&episode=2";
  const response=await worker.fetch(new Request(url),approved);
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.results.length,1);
  assert.equal(body.results[0].url,"https://media.authorized.test/amber/1x02.mp4");
  assert.equal(body.results[0].license,"Owner-authorized");
  assert.equal(body.results[0].episodeVerified,true);
  assert.equal(body.providers[0].status,"ok");
  const cached=await(await worker.fetch(new Request(url),approved)).json();
  assert.equal(cached.cacheHit,true);
  const other=await(await worker.fetch(new Request(url.replace("episode=2","episode=8")),approved)).json();
  assert.equal(other.results.length,0);
  const notConfigured=await(await worker.fetch(new Request(url),{})).json();
  assert.equal(notConfigured.providers[0].status,"unconfigured");
  assert.equal(notConfigured.results.length,0);
 } finally {globalThis.fetch=oldFetch;}
});
test("unlisted feed domains cannot trigger outbound network requests",async()=>{
 let calls=0;
 globalThis.fetch=async()=>{calls++;throw Error("Outbound network should not be called");};
 try{
  const request=new Request(root+"/v7/search?kind=episode&title=Other%20Show&season=2&episode=3");
  const invalid={...approved,AUTHORIZED_FEED_URL:"https://untrusted.test/feed.json"};
  const response=await worker.fetch(request,invalid);
  const result=await response.json();
  assert.equal(result.providers[0].status,"unconfigured");
  assert.equal(result.results.length,0);
  assert.equal(calls,0);
 }finally{globalThis.fetch=oldFetch;}
});
test("invalid show requests reject before provider lookup",async()=>{
 const missing=await worker.fetch(new Request(root+"/v7/search?kind=episode&title=Amber%20Sky&season=1"));
 assert.equal(missing.status,400);
 const invalid=await worker.fetch(new Request(root+"/v7/search?kind=movie&title=%2E"));
 assert.equal(invalid.status,400);
});
