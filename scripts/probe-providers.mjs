#!/usr/bin/env node
// Discover officially/CC-licensed media search providers without scraping unauthorized sites.
const targets=[
  {name:'Commons title search',url:'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=File%3ASintel%20filetype%3Avideo&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url%7Cmime%7Cextmetadata&format=json&formatversion=2'},
  {name:'Commons API search',url:'https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=File%3ABig%20Buck%20Bunny&srnamespace=6&srlimit=5&format=json'},
  {name:'Blender Google BBB',url:'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'},
  {name:'Blender Google Sintel',url:'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'},
  {name:'Blender Google Elephants',url:'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'}
];
for(const {name,url} of targets){
 try {
  const isVideo=url.endsWith('.mp4');
  const response=await fetch(url,{method:isVideo?'HEAD':'GET',signal:AbortSignal.timeout(10000),
    headers:{'User-Agent':'VelaSource/0.7 (+https://github.com/ryajohns1-lab/Velasource; rights-check demo)','Accept':'application/json'}});
  const data=isVideo?null:await response.json();
  const rows=data?.query?.pages??data?.query?.search??[];
  console.log(JSON.stringify({name,status:response.status,mime:response.headers.get('content-type'),
   count:rows.length,files:rows.slice(0,5).map(x=>({title:x.title,mime:x.imageinfo?.[0]?.mime,license:x.imageinfo?.[0]?.extmetadata?.LicenseUrl?.value,src:x.imageinfo?.[0]?.url?.slice(0,140)})),
   size:response.headers.get('content-length'),error:data?.error?.info}));
 } catch (error) {console.log(JSON.stringify({name,error:String(error)}));}
}
