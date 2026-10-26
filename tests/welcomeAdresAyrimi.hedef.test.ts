import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as roles from '@/lib/utils/roller';
import * as baslangic from '@/lib/panel/baslangic';
function load(path:string,modules:Record<string,unknown>){const exports:Record<string,any>={};const code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{exports,URL,process:{env:{}},require:(n:string)=>{assert(n in modules,n);return modules[n];}});return exports;}
function ortam(user:unknown=null,refreshCookie=false){let authReads=0,roleReads=0;const fresh={name:'sb-test-auth-token',value:'refreshed'};
 const response=(r:Response)=>Object.assign(r,{cookies:{values:[] as unknown[],getAll(){return this.values;},set(cookie:unknown,value?:unknown){this.values.push(typeof cookie==='string'?{name:cookie,value}:cookie);}}});
 const modules:Record<string,unknown>={
  '@/lib/panel/baslangic':baslangic,'@/lib/utils/roller':roles,
  '@supabase/ssr':{createServerClient:(_u:unknown,_k:unknown,opts:any)=>({auth:{getUser:async()=>{authReads++;if(refreshCookie)opts.cookies.setAll([fresh]);return{data:{user}};}}})},
  '@supabase/supabase-js':{createClient:()=>{throw Error('Beklenmeyen veri isteği');}},
  'next/server':{NextResponse:{next:()=>response(new Response(null)),redirect:(url:URL)=>response(new Response(null,{status:307,headers:{location:String(url)}})),json:Response.json,rewrite:()=>{throw Error('Welcome ve panel rewrite ile birleştirilemez');}}},
  '@/lib/utils/rolCozucu':{rolCozucu:async()=>{roleReads++;return 'utt';}},
  '@/lib/eclub/firmaGezinme':{eclubFirmaRotasiKapsami:()=>[]},'@/lib/eclub/kisiErisim':{eclubKisiErisimi:()=>{throw Error('Beklenmeyen kişi sorgusu');}},'@/lib/eczanem/erisim':{ECZANEM_KAPALI_MESAJI:'Kapalı',eczanemRolErisimi:()=>{throw Error('Beklenmeyen modül sorgusu');}},
 };
 const proxy=load('proxy.ts',modules).proxy;
 return{get authReads(){return authReads;},get roleReads(){return roleReads;},request:(path:string)=>proxy({url:'http://localhost'+path,nextUrl:new URL('http://localhost'+path),cookies:{getAll:()=>[],set:()=>{}}})};
}
for(const path of ['/','/welcome'])test(`${path} oturumdan bağımsız herkese açıktır; auth veya rol sorgusu yapılmaz`,async()=>{
 for(const user of [null,{id:'utt',app_metadata:{}},{id:'davet',app_metadata:{eclub_davet_bekliyor:true}}]){const o=ortam(user);const r=await o.request(path);assert.equal(r.status,200);assert.equal(o.authReads,0);assert.equal(o.roleReads,0);}
});
test('oturumsuz /ana-sayfa welcome içeriği sunmaz; /login adresine yönlenir',async()=>{
 const o=ortam(null,true),r=await o.request('/ana-sayfa');assert.equal(r.status,307);assert.equal(r.headers.get('location'),'http://localhost/login');assert.equal(r.headers.get('cache-control'),'private, no-store');assert.deepEqual(JSON.parse(JSON.stringify(r.cookies.getAll())),[{name:'sb-test-auth-token',value:'refreshed'}]);assert.equal(o.authReads,1);
});
test('oturumlu /ana-sayfa panel rotasında kalır; welcome veya rol dönüşü yoktur',async()=>{
 const o=ortam({id:'utt',app_metadata:{}}),r=await o.request('/ana-sayfa');assert.equal(r.status,200);assert.equal(r.headers.get('location'),null);assert.equal(r.headers.get('cache-control'),'private, no-store');assert.equal(o.authReads,1);assert.equal(o.roleReads,0);
});
test('kök adres yalnız /welcome yönlendirmesidir',()=>{
 const targets:string[]=[];const m=load('app/page.tsx',{'next/navigation':{redirect:(p:string)=>{targets.push(p);}}});m.default();assert.deepEqual(targets,['/welcome']);
});
