#!/usr/bin/env node
import assert from "node:assert/strict";
const origin="https://velasource-network-api.ryajohns1.workers.dev";
async function read(path,timeout=15000) {
 const res=await fetch(origin+path,{signal:AbortSignal.timeout(timeout),headers:{accept:"application/json"}});
 const text=await res.text();
 assert.equal(res.status,200,path+" returned HTTP "+res.status+": "+text.slice(0,180));
 assert.match(res.headers.get("content-type")||"",/application\/json/);
 return JSON.parse(text);
}
const vendor=await read("/syncler/v7/vendor/");
const vendorNormal=await read("/syncler/v7/vendor");
assert.deepEqual(vendor,vendorNormal);
const manifest=await read("/syncler/v7/manifest/");
assert.deepEqual(manifest,await read("/syncler/v7/manifest"));
assert.equal(manifest.version,7);
assert.equal(manifest.type,"express");
assert.equal(vendor.packages[0].manifest,origin+"/syncler/v7/manifest");
assert.equal(manifest.permaUrl,origin+"/syncler/v7/express");
const definition=await read("/syncler/v7/express/");
assert.deepEqual(definition,await read("/syncler/v7/express"));
assert.equal(definition._manifest.version,7);
assert.equal(definition.velasource.json_format.results,"results");
assert.equal(definition.velasource.response_type,"json");
console.log("PASS: v7 vendor/manifest/definition, including both trailing-slash forms");
const health=await read("/v7/health");
assert.equal(health.ok,true);
assert.equal(health.version,7);
assert.deepEqual(health.providers.map(x=>x.name),["Internet Archive","Wikimedia Commons","Authorized Owner Feed"]);
console.log("PASS: health exposes three connectors, including unconfigured authorized feed");
const sintel=await read("/v7/search?kind=movie&title=Sintel&year=2010",19000);
assert.equal(sintel.version,7);
assert.equal(sintel.providers.length,3);
assert.equal(sintel.providers[2].status,"unconfigured");
assert.ok(sintel.providers.slice(0,2).some(x=>x.status==="ok"),"At least one public provider should respond");
assert.ok(sintel.results.length>0,"Licensed Sintel search should return at least one real media URL");
for(const item of sintel.results){
 assert.ok(item.matchScore>=78);
 assert.ok(/^https:\/\/(?:archive\.org|upload\.wikimedia\.org)\//.test(item.url));
 assert.ok(/^https:\/\/(?:www\.)?creativecommons\.org\//.test(item.license));
 assert.ok(!/trailer|extract|excerpt|preview|sample/i.test(item.filename||""),"Reject excerpts and teasers");
}
const second=await read("/v7/search?kind=movie&title=Sintel&year=2010");
assert.equal(second.cacheHit,true);
console.log(JSON.stringify({search:"Sintel",items:sintel.results.length,
 sources:sintel.providers.map(x=>({name:x.name,status:x.status,count:x.count,latencyMs:x.latencyMs})),
 cacheHit:second.cacheHit,results:sintel.results.slice(0,4).map(x=>({provider:x.provider,filename:x.filename,score:x.matchScore}))}));
const episode=await read("/v7/search?kind=episode&title=Licensed%20Test%20Show&season=1&episode=1");
assert.equal(episode.results.length,0);
assert.equal(episode.providers.length,1);
assert.equal(episode.providers[0].status,"unconfigured");
console.log("PASS: episode search is fail-closed when no authorized episode feed is configured");
console.log("PASS: VelaSource v7 two-provider live search, dedupe, cache, rights checks and episode guard");
