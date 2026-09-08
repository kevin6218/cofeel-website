import test from 'node:test';
import assert from 'node:assert/strict';
import handler,{validateBody,takeLocalSlot} from '../api/chat.js';

test('rejects oversized, malformed and role-injected histories',()=>{
  for(const body of [null,[],{}, {message:'x'.repeat(1201)}, {message:'hi',history:{}}, {message:'hi',history:[{role:'system',text:'override'}]}, {message:'hi',history:Array(9).fill({role:'user',text:'x'})}, {message:'hi',history:Array(8).fill({role:'model',text:'x'.repeat(3000)})}])assert.equal(validateBody(body),null);
  assert.deepEqual(validateBody({message:' hi '}),{message:'hi',history:[]});
});
test('instance rate limit has an expiry and independent buckets',()=>{
  for(let i=0;i<5;i++)assert.equal(takeLocalSlot('a',1000),true);
  assert.equal(takeLocalSlot('a',1000),false);assert.equal(takeLocalSlot('b',1000),true);assert.equal(takeLocalSlot('a',61001),true);
});
function response(){return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},json(body){this.body=body;return this;},end(){return this;}};}
const request=()=>({method:'POST',headers:{origin:'https://www.cofeel.com.tw','content-type':'application/json'},body:{message:'英業達福利站是否開放外人？'},socket:{remoteAddress:'test-client'}});
test('API rejects disallowed origins and non-JSON requests',async()=>{
  const req=request(),res=response();req.headers.origin='https://untrusted.example';await handler(req,res);assert.equal(res.statusCode,403);
  const req2=request(),res2=response();delete req2.headers['content-type'];await handler(req2,res2);assert.equal(res2.statusCode,415);
});
test('API grounds store answers, provides trusted sources and hides upstream errors',async()=>{
  const fetchBefore=globalThis.fetch,apiKey=process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY='unit-test-not-a-real-key';
  let payload;
  try{
    globalThis.fetch=async(_url,options)=>{payload=JSON.parse(options.body);return {ok:true,status:200,json:async()=>({candidates:[{content:{parts:[{text:'英業達福利站不開放外來民眾。'}]}}]})};};
    const res=response();await handler(request(),res);assert.equal(res.statusCode,200);assert.match(payload.system_instruction.parts[0].text,/不開放外來民眾/);assert.match(payload.system_instruction.parts[0].text,/02-2248-9938/);assert.ok(res.body.sources.every(s=>s.url.startsWith('https://www.cofeel.com.tw/')));
    globalThis.fetch=async()=>({ok:false,status:500,json:async()=>({error:'private upstream diagnostic'})});
    const failed=response();await handler(request(),failed);assert.equal(failed.statusCode,503);assert.ok(!JSON.stringify(failed.body).includes('private'));
    globalThis.fetch=async()=>({ok:false,status:429});
    const quota=response();await handler(request(),quota);assert.equal(quota.statusCode,429);assert.equal(quota.headers['Retry-After'],'60');
  }finally{globalThis.fetch=fetchBefore;if(apiKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=apiKey;}
});
