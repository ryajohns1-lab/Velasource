#!/usr/bin/env node
// External check of the exact VelaSource vendor -> one-file Express definition -> search chain.
// No Ovrelixa app code, debrid credentials or third-party index queries are involved.
import assert from 'node:assert/strict';
const origin='https://velasource-demo-api.ryajohns1.workers.dev';
async function readJson(url, expectedType = true) {
  const result=await fetch(url,{signal:AbortSignal.timeout(15000),headers:{accept:'application/json,text/plain;q=0.9'}});
  const body=await result.text();
  assert.equal(result.status,200,`GET ${url}: HTTP ${result.status}: ${body.slice(0,300)}`);
  if(expectedType) assert.match(result.headers.get('content-type')??'',/application\/json/);
  let parsed;
  try { parsed=JSON.parse(body); } catch(e) { throw new Error(`Invalid JSON at ${url}: ${body.slice(0,300)}`); }
  return parsed;
}
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
