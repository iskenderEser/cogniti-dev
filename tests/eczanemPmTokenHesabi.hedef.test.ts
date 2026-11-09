import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {ECZANEM_TALEP_ACAN_ROLLER} from '@/lib/utils/roller';
import {uuidGecerliMi} from '@/lib/uretim/rpcTemel';
import {partnerJsonOku,partnerYanit} from '@/lib/agora/partnerHttp';
const id='00000000-0000-4000-8000-000000000001';
function route(){const s={user:{id:'session-id'} as null|{id:string},rol:'pm',calls:[] as any[],error:null as null|{code:string;message:string},data:{eski_yayin:false,hesap_turu:'kisisel',blokeli:10,tuketilen:2,serbest:0} as unknown};const exports:Record<string,any>={};
 const deps:Record<string,unknown>={
 '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:s.user}})}}),createAdminClient:()=>({rpc:async(name:string,args:unknown)=>{s.calls.push({name,args});return {data:s.data,error:s.error};}})},
 '@/lib/utils/rolCozucu':{rolCozucu:async()=>s.rol},'@/lib/utils/roller':{ECZANEM_TALEP_ACAN_ROLLER},'@/lib/uretim/rpcTemel':{uuidGecerliMi},'@/lib/agora/partnerHttp':{partnerJsonOku,partnerYanit}};
 vm.runInNewContext(ts.transpileModule(readFileSync('app/(panel)/yayin-yonetimi/api/eczanem-token-hesabi/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,AbortSignal,require:(n:string)=>{assert.ok(n in deps,n);return deps[n];}});
 const req=(body:unknown={yayinId:id},origin='http://localhost')=>new Request('http://localhost/yayin-yonetimi/api/eczanem-token-hesabi',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
 return {s,req,post:exports.POST};}
test('PM ailesi ve Medikal Müdür; admin/firma admin/yönetici/diğer üretici/ecza/TM/UTT kapalı',async()=>{
 const {s,req,post}=route();s.user=null;assert.equal((await post(req())).status,401);s.user={id:'session-id'};
 for(const rol of ['admin','firma_admin','gm','egt_md','ik_md','eczaci','tm','utt','partner']){s.rol=rol;assert.equal((await post(req())).status,403);}
 assert.equal(s.calls.length,0);
 for(const rol of ECZANEM_TALEP_ACAN_ROLLER){s.rol=rol;assert.equal((await post(req({yayinId:id,hesapTuru:'kisisel'}))).status,200);}
 assert.equal(s.calls[0].args.p_auth,'session-id');assert.equal(s.calls[0].args.p_yayin,id);
});
test('firma/sahip/miktar istemciden kabul edilmez; farklı köken reddedilir',async()=>{
 const {s,req,post}=route();assert.equal((await post(req({},'http://foreign'))).status,403);
 for(const field of ['firmaId','sahipId','miktar'])assert.equal((await post(req({yayinId:id,[field]:id}))).status,400);
 assert.equal((await post(req({yayinId:id,hesapTuru:'kko'}))).status,400);assert.equal(s.calls.length,0);
});
test('eski yayın okuma, değişmez hesap ve yetersizlik hatası; hatalı cevap başarı sayılmaz',async()=>{
 const {s,req,post}=route();s.data={eski_yayin:true,hesap_turu:null,blokeli:0,tuketilen:0,serbest:0};assert.equal((await post(req())).status,200);assert.equal(s.calls[0].args.p_tur,null);
 for(const message of ['ECZANEM_TOKEN:yetersiz','ECZANEM_TOKEN:hesap_degistirilemez','ECZANEM_GONDERIM:sure_doldu']){s.error={code:'P0001',message};assert.equal((await post(req())).status,409);}
 s.error={code:'42501',message:'Yetki yok'};assert.equal((await post(req())).status,403);
 s.error=null;s.data={blokeli:0};assert.equal((await post(req())).status,503);
});
