import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { gonderimOnizlemeIstegiGecerli, gonderimTokenOnizlemesiGecerli } from '@/lib/satinAlma/gonderimOnizleme';
import { satinAlmaBakiyesiGorebilir } from '@/lib/satinAlma/bakiyeOzeti';
import { partnerJsonOku, partnerYanit } from '@/lib/agora/partnerHttp';
const id='00000000-0000-4000-8000-000000000001';
const body={akis:'yayin_acilis',bakiyeTuru:'kisisel',kaynakIdler:[id],aliciIdler:[],planTarihi:null};
const result={akis:'yayin_acilis',bakiye_turu:'kisisel',planli:false,uygun_kayit:1,atlanan_kayit:0,gereken_token:3,kullanilabilir_token:2,islem_sonrasi:0,eksik_token:1,yeterli:false,gercek_gonderim_acik:false,aciklama:'Önizleme'};
test('seçim sözleşmesi: istemciden miktar, kimlik veya firma alınmaz',()=>{
 assert.ok(gonderimOnizlemeIstegiGecerli(body));
 for(const alan of ['firmaId','sahipId','gerekenToken','gonderenId'])assert.equal(gonderimOnizlemeIstegiGecerli({...body,[alan]:id}),false);
 for(const x of [{...body,kaynakIdler:[id,id]},{...body,planTarihi:'2027-02-30'},{...body,planTarihi:'2027-01-01T00:00Z'},{...body,akis:'uydurma'},{...body,akis:'eclub_oneri'},{...body,aliciIdler:[id]}])assert.equal(gonderimOnizlemeIstegiGecerli(x),false);
 assert.ok(gonderimOnizlemeIstegiGecerli({...body,akis:'eclub_oneri',aliciIdler:[id],planTarihi:'2027-01-01'}));
});
test('hesap sonucu tutarlılığı ve planlı gönderimin kapalı olması zorunludur',()=>{
 assert.ok(gonderimTokenOnizlemesiGecerli(result));
 for(const x of [{...result,yeterli:true},{...result,eksik_token:0},{...result,planli:true,gercek_gonderim_acik:true},{...result,gereken_token:NaN},{...result,uygun_kayit:-1}])assert.equal(gonderimTokenOnizlemesiGecerli(x),false);
});
function endpoint(){
 const s={user:{id:'session-id'} as null|{id:string},rol:'pm',data:result as unknown,error:null as null|{code:string},calls:[] as any[]};const exports:Record<string,any>={};
 const deps:Record<string,unknown>={
  '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:s.user}})}}),createAdminClient:()=>({rpc:async(name:string,args:unknown)=>{s.calls.push({name,args});return {data:s.data,error:s.error};}})},
  '@/lib/utils/rolCozucu':{rolCozucu:async()=>s.rol},'@/lib/satinAlma/bakiyeOzeti':{satinAlmaBakiyesiGorebilir},'@/lib/satinAlma/gonderimOnizleme':{gonderimOnizlemeIstegiGecerli,gonderimTokenOnizlemesiGecerli},'@/lib/agora/partnerHttp':{partnerJsonOku,partnerYanit},
 };
 vm.runInNewContext(ts.transpileModule(readFileSync('app/api/gonderim-token-onizleme/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,AbortSignal,require:(n:string)=>{assert.ok(n in deps,n);return deps[n];}});
 const req=(b:unknown=body,origin='http://localhost')=>new Request('http://localhost/api/gonderim-token-onizleme',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(b)});
 return {s,post:exports.POST,req};
}
test('HTTP oturum/rol ve kaynak köken kontrolü; yalnız oturum kimliği RPCye gider',async()=>{
 const {s,post,req}=endpoint();s.user=null;assert.equal((await post(req())).status,401);s.user={id:'session-id'};
 for(const rol of ['admin','partner','eczaci','musteri']){s.rol=rol;assert.equal((await post(req())).status,403);}s.rol='pm';
 assert.equal((await post(req(body,'http://baskasi'))).status,403);
 assert.equal((await post(req({...body,gerekenToken:0}))).status,400);assert.equal(s.calls.length,0);
 const r=await post(req());assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/no-store/);assert.equal(s.calls[0].args.p_auth_id,'session-id');assert.equal(s.calls[0].name,'cogniti_gonderim_token_onizle');
});
test('yetki/kural/kurulum hataları ve seçime uymayan cevap güvenli reddedilir',async()=>{
 const {s,post,req}=endpoint();for(const [code,status] of [['42501',403],['22023',400],['PGRST202',503]]){s.error={code};assert.equal((await post(req())).status,status);}
 s.error=null;s.data={...result,bakiye_turu:'firma_ortak'};assert.equal((await post(req())).status,503);
 s.data={...result,planli:true,gercek_gonderim_acik:true};assert.equal((await post(req())).status,503);
});
