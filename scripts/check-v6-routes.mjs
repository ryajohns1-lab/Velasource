#!/usr/bin/env node
// Dedicated regression for iPhone HTTP 404 /syncler/v6/manifest/.
// Independent of the Internet Archive API.
import assert from 'node:assert/strict';
const base='https://velasource-demo-api.ryajohns1.workers.dev';
async function json(path) {
  const res=await fetch(base+path,{headers:{Accept:'application/json,text/html;q=0.9'},signal:AbortSignal.timeout(12000)});
  const body=await res.text();
  assert.equal(res.status,200,path+' returned HTTP '+res.status+': '+body.slice(0,160));
  assert.match(res.headers.get('content-type')??'',/application\/json/);
  return JSON.parse(body);
}
const catalog=await json('/syncler/v6/vendor/');
assert.equal(catalog.packages.length,1);
const paths=['/syncler/v6/manifest','/syncler/v6/express'];
for(const path of paths){
  const plain=await json(path);
  const slash=await json(path+'/');
  assert.deepEqual(slash,plain,'Trailing slash must not change '+path);
  console.log('PASS HTTP 200 and equal JSON: '+path+' and '+path+'/');
}
const manifest=await json('/syncler/v6/manifest/');
assert.equal(manifest.type,'express');
assert.equal(manifest.version,6);
assert.equal(manifest.permaUrl,base+'/syncler/v6/express');
const rules=await json('/syncler/v6/express/');
assert.equal(rules._manifest.version,6);
assert.equal(rules.archive.response_type,'json');
console.log('PASS VelaSource v6 vendor import chain (route only; archive network not required)');
