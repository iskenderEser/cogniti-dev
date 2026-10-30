import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const code=ts.transpileModule(readFileSync(new URL("../app/(panel)/token/api/rapor/route.ts",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function setup(user={id:"user-a"},error=null,data={hesap_var:true}){const calls=[];const modules={"next/server":{NextResponse:{json:Response.json.bind(Response)}},"@/lib/supabase/server":{createClient:async()=>({auth:{getUser:async()=>({data:{user},error:null})}}),createAdminClient:()=>({rpc:async(name,args)=>{calls.push({name,args});return {data,error};}})},"@/lib/utils/hataIsle":{yetkiHatasi:()=>Response.json({hata:"Yetkisiz"},{status:401}),validasyonHatasi:()=>Response.json({hata:"Geçersiz"},{status:400}),sunucuHatasi:e=>{throw e;}}};const exports={};vm.runInNewContext(code,{exports,console,require:n=>modules[n]});return{calls,get:query=>exports.GET({nextUrl:{searchParams:new URLSearchParams(query)}})}}
test("Kimliği doğrulanmamış kullanıcı rapora erişemez",async()=>{const s=setup(null);assert.equal((await s.get("")).status,401);assert.equal(s.calls.length,0)});
test("Firma ve kimlik istemciden değil oturumdan belirlenir",async()=>{const s=setup();assert.equal((await s.get("firma_id=baska&kullanici_id=baska&kapsam=benim")).status,200);assert.deepEqual(JSON.parse(JSON.stringify(s.calls[0].args)),{p_kullanici:"user-a"})});
test("Eski filtreler kullanılmaz; hareket ve alıcı bilgisi yanıttan çıkarılır",async()=>{const s=setup(undefined,null,{hesap_var:true,toplam:3,gun_sonu:{hazir:true},kayitlar:[{alicilar:[{alici:"özel veri"}]}]});const res=await s.get("kapsam=firma&tur=yayin&sayfa=1&arama=kişi");assert.equal(res.status,200);assert.deepEqual(JSON.parse(JSON.stringify(s.calls[0].args)),{p_kullanici:"user-a"});assert.deepEqual(await res.json(),{hesap_var:true,toplam:3,gun_sonu:{hazir:true}});assert.equal(res.headers.get("Cache-Control"),"private, no-store")});
test("Erişim reddi ve SQL hatası güvenli cevap verir",async()=>{assert.equal((await setup({id:"eczaci"},{code:"42501"}).get("")).status,401);const res=await setup({id:"user"},{code:"XX000",message:"gizli"}).get("");assert.equal(res.status,500);assert.doesNotMatch(JSON.stringify(await res.json()),/gizli/)});
test('BM statları oturum kimliğiyle bölge toplamını veya seçilen UTTyi ister',async()=>{
 const utt='00000000-0000-4000-8000-000000000004';
 for(const value of [null,utt]){
  const data={hesap_var:true,uttler:[{utt_id:utt,utt_adi:'Deneme Temsilci'}],secili_utt_id:value,gun_sonu:{firma_toplam_token:31,eclub_token:11,eczanem_token:10}};
  const s=setup(undefined,null,data);const res=await s.get(`gorunum=bm${value?`&utt_id=${value}`:''}&kullanici_id=baska&firma_id=baska`);
  assert.equal(res.status,200);assert.deepEqual(JSON.parse(JSON.stringify(s.calls)),[{name:'cogniti_token_bm_raporu',args:{p_kullanici:'user-a',p_utt:value}}]);
  assert.deepEqual(await res.json(),data);
 }
 for(const q of ['gorunum=bm&utt_id=invalid',`utt_id=${utt}`]){const s=setup();assert.equal((await s.get(q)).status,400);assert.equal(s.calls.length,0);}
 const denied=setup(undefined,{code:'42501'});assert.equal((await denied.get(`gorunum=bm&utt_id=${utt}`)).status,401);
});
test('TM statları takım, BM bölgesi ve UTT kapsamını sunucu kimliğiyle ister',async()=>{
 const bm='00000000-0000-4000-8000-000000000003',utt='00000000-0000-4000-8000-000000000004';
 for(const [region,target] of [[null,null],[bm,null],[bm,utt]]){
  const data={hesap_var:true,bmler:[{bm_id:bm,bm_adi:'Deneme Müdür'}],secili_bm_id:region,uttler:[],secili_utt_id:target};
  const s=setup(undefined,null,data);const response=await s.get(`gorunum=tm${region?`&bm_id=${region}`:''}${target?`&utt_id=${target}`:''}&kullanici_id=baska`);
  assert.equal(response.status,200);assert.deepEqual(await response.json(),data);
  assert.deepEqual(JSON.parse(JSON.stringify(s.calls)),[{name:'cogniti_token_tm_raporu',args:{p_kullanici:'user-a',p_bm:region,p_utt:target}}]);
 }
 for(const q of ['gorunum=tm&bm_id=invalid',`gorunum=tm&utt_id=${utt}`,`gorunum=bm&bm_id=${bm}`,`bm_id=${bm}`,`gorunum=tm&bm_id=${bm}&utt_id=invalid`]){
  const s=setup();assert.equal((await s.get(q)).status,400);assert.equal(s.calls.length,0);
 }
 assert.equal((await setup(undefined,{code:'42501'}).get(`gorunum=tm&bm_id=${bm}`)).status,401);
});
test('Yönetici statları firma/TM/BM/UTT kapsamıyla sunucu kimliğini kullanır',async()=>{
 const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
 for(const [tm,bm,utt]of [[null,null,null],[id(2),null,null],[id(2),id(3),null],[id(2),id(3),id(4)]]){
  const data={hesap_var:true,tmler:[{tm_id:id(2),tm_adi:'Takım Müdürü'}],secili_tm_id:tm,bmler:[],secili_bm_id:bm,uttler:[],secili_utt_id:utt};
  const s=setup(undefined,null,data);const response=await s.get(`gorunum=yonetici${tm?`&tm_id=${tm}`:''}${bm?`&bm_id=${bm}`:''}${utt?`&utt_id=${utt}`:''}&kullanici_id=baska&firma_id=baska`);
  assert.equal(response.status,200);assert.deepEqual(await response.json(),data);
  assert.deepEqual(JSON.parse(JSON.stringify(s.calls)),[{name:'cogniti_token_yonetici_raporu',args:{p_kullanici:'user-a',p_tm:tm,p_bm:bm,p_utt:utt}}]);
 }
 for(const q of ['gorunum=yonetici&tm_id=invalid',`gorunum=yonetici&bm_id=${id(3)}`,`gorunum=yonetici&utt_id=${id(4)}`,`gorunum=yonetici&tm_id=${id(2)}&utt_id=${id(4)}`,`gorunum=tm&tm_id=${id(2)}`]){
  const s=setup();assert.equal((await s.get(q)).status,400);assert.equal(s.calls.length,0);
 }
 assert.equal((await setup(undefined,{code:'42501'}).get(`gorunum=yonetici&tm_id=${id(2)}`)).status,401);
});
