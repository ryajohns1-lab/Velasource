#!/usr/bin/env node
// Test the *public* VelaSource API from an independent GitHub runner,
// not just its deployed metadata. Does not query third-party scrapers.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root='https://velasource-demo-api.ryajohns1.workers.dev';
async function get(url) {
  const r=await fetch(url,{signal:AbortSignal.timeout(15000),headers:{accept:'application/json'}});
  assert.equal(r.status,200,`HTTP ${r.status} for ${url}`);
  assert.match(r.headers.get('content-type')??'',/application\/json/);
  return r.json();
}
const health=await get(root+'/health');
assert.equal(health.ok,true);
const matching=await get(root+'/search?kind=movie&title=Big%20Buck%20Bunny&year=2008&imdbId=tt1254207');
assert.equal(matching.count,1,`Expected one licensed result; got ${JSON.stringify(matching)}`);
assert.equal(matching.results.length,1);
assert.match(matching.results[0].title,/Big Buck Bunny/i);
assert.match(matching.results[0].url,/^https:\/\//);
const elsewhere=await get(root+'/search?kind=movie&title=Wildwood&year=2026');
assert.equal(elsewhere.count,0,`Test provider must not give unrelated titles: ${JSON.stringify(elsewhere)}`);
const raw='https://raw.githubusercontent.com/ryajohns1-lab/Velasource/main';
for (const name of ['vendor-v3.json','package-v3.json','express-v3.json']) {
  const remote=await get(raw+'/'+name);
  const local=JSON.parse(readFileSync(name,'utf8'));
  assert.deepEqual(remote,local,`Published GitHub JSON differs from local for ${name}`);
  console.log(`RAW OK ${name} ${JSON.stringify({keys:Object.keys(remote)})}`);
}
const exp=JSON.parse(readFileSync('express-v3.json','utf8'));
assert.equal(exp.velasource.base_url,root+'/');
assert.equal(exp.velasource.json_format.results,'results');
assert.equal(exp.velasource.json_format.title,'title');
assert.equal(exp.velasource.json_format.url,'url');
console.log(JSON.stringify({healthy:true,matchingResults:matching.count,unrelatedResults:elsewhere.count,source:root,packageVersion:exp._manifest.version},null,2));
