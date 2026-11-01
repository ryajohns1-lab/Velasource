#!/usr/bin/env node
// External check of the exact VelaSource vendor -> one-file Express definition -> search chain.
// No Ovrelixa app code, debrid credentials or third-party index queries are involved.
import assert from 'node:assert/strict';
const origin='https://velasource-demo-api.ryajohns1.workers.dev';
async function readJson(url, expectedType = true) {
  const result=await fetch(url,{signal:AbortSignal.timeout(15000),headers:{accept:'application/json,text/html;q=0.9'}});
  const body=await result.text();
  assert.equal(result.status,200,`GET ${url}: HTTP ${result.status}: ${body.slice(0,300)}`);
  if(expectedType) assert.match(result.headers.get('content-type')??'',/application\/json/);
  let parsed;
  try { parsed=JSON.parse(body); } catch(e) { throw new Error(`Invalid JSON at ${url}: ${body.slice(0,300)}`); }
  return parsed;
}
// Follow the same JakedUp legacy-Express chain as the Ovrelixa importer:
const classicVendor=await readJson(origin+'/syncler/vendor');
assert.equal(classicVendor.packages.length,1);
const classicManifest=await readJson(classicVendor.packages[0].manifest);
assert.equal(classicManifest.type,'express');
assert.equal(classicManifest.version,5);
assert.equal(classicManifest.classPath,'');
assert.equal(classicManifest.permaUrl,origin+'/syncler/express');
assert.equal(Object.hasOwn(classicManifest,'url'),false);
const classicDefinition=await readJson(classicManifest.permaUrl);
assert.equal(classicDefinition._manifest.version,5);
assert.equal(classicDefinition.velasource.response_type,'json');
assert.equal(classicDefinition.velasource.base_url,origin+'/');
assert.equal(classicDefinition.velasource.json_format.results,'results');
assert.equal(classicDefinition.velasource.json_format.title,'title');
assert.equal(classicDefinition.velasource.json_format.url,'url');
const classicFilm=await readJson(origin+'/search?kind=movie&title=Big%20Buck%20Bunny');
assert.equal(classicFilm.results.length,1);
console.log('PASS: JakedUp-style v5 vendor -> Express manifest -> Express provider definition -> licensed search');
// VelaSource v6: genuinely searches explicitly licensed films via the Internet Archive.
const v6Vendor=await readJson(origin+'/syncler/v6/vendor/');
assert.equal(v6Vendor.packages.length,1);
const v6Manifest=await readJson(v6Vendor.packages[0].manifest);
assert.equal(v6Manifest.version,6);
assert.equal(v6Manifest.type,'express');
const v6Rules=await readJson(v6Manifest.permaUrl);
assert.equal(v6Rules._manifest.version,6);
assert.equal(v6Rules.archive.response_type,'json');
const v6Query=await readJson(origin+'/v6/search?kind=movie&title=Sintel&year=2010');
console.log(JSON.stringify({archiveStatus:v6Query.status,archiveCount:v6Query.results.length,archiveChecked:v6Query.checked,
  sample:v6Query.results.slice(0,2).map(x=>({title:x.title,archiveId:x.archiveId,license:x.license}))}));
assert.equal(v6Query.status,'ok','Archive live search must respond without a provider error');
assert.ok(v6Query.results.length>=1,'Expected a licensed Sintel item from Archive');
assert.ok(v6Query.results.every(x=>/^https:\/\/archive\.org\/download\//.test(x.url)&&/creativecommons\.org\//.test(x.license)),'Only explicitly licensed Archive URLs may be returned');
const v6Unrelated=await readJson(origin+'/v6/search?kind=episode&title=Sintel&season=1&episode=1');
assert.equal(v6Unrelated.results.length,0,'Archive must not invent TV episode sources');
console.log('PASS: VelaSource v6 independently loaded live licensed-film provider');
const health=await readJson(origin+'/health');
assert.equal(health.ok,true);
assert.equal(health.version,4);
const vendor=await readJson(origin+'/vendor-v4.json');
assert.equal(vendor.packages.length,1);
const pUrl=vendor.packages[0].manifest;
assert.equal(pUrl,origin+'/package-v4.json');
const pkg=await readJson(pUrl);
assert.equal(pkg._manifest.version,4);
assert.equal(pkg.velasource.base_url,origin+'/');
assert.equal(pkg.velasource.response_type,'json');
assert.equal(pkg.velasource.json_format.results,'results');
assert.equal(pkg.velasource.json_format.title,'title');
assert.equal(pkg.velasource.json_format.url,'url');
const search=new URL(pkg.velasource.movie.query.split('?')[0],pkg.velasource.base_url);
search.searchParams.set('kind','movie');
search.searchParams.set('title','Big Buck Bunny');
search.searchParams.set('year','2008');
search.searchParams.set('imdbId','tt1254207');
const hit=await readJson(search.toString());
assert.equal(hit.count,1,`Expected one demo candidate; got: ${JSON.stringify(hit)}`);
assert.match(hit.results[0].title,/Big Buck Bunny/i);
assert.match(hit.results[0].url,/^https:\/\//);
const miss=await readJson(origin+'/search?kind=movie&title=Wildwood&year=2026');
assert.equal(miss.count,0);
console.log('PASS: hosted vendor -> inline Express manifest -> live search -> licensed candidate');
console.log(JSON.stringify({vendor:origin+'/vendor-v4.json',package:pUrl,candidates:hit.count,unrelated:miss.count,version:pkg._manifest.version},null,2));
