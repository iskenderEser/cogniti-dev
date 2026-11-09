import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { esnekPaketBakiyeTuru, esnekPaketSiparisIstegiGecerli } from '@/lib/satinAlma/esnekPaket';
import { TUM_ROLLER, URETICI_ROLLER, YONETICI_ROLLER } from '@/lib/utils/roller';
import { uuidGecerliMi } from '@/lib/uretim/rpcTemel';
const uuid='00000000-0000-4000-8000-000000000001';
const istek={tokenAdedi:3000,tarifeSurumu:7,birimFiyat:8.2,islemAnahtari:uuid};
test('tüm roller: kişisel, ortak ve kapalı satın alma matrisi',()=>{
 for(const rol of [...TUM_ROLLER,'partner','eczaci','musteri','']) {
  const beklenen=URETICI_ROLLER.includes(rol)?'kisisel':YONETICI_ROLLER.includes(rol)||rol==='firma_admin'?'firma_ortak':null;
  assert.equal(esnekPaketBakiyeTuru(rol),beklenen,rol);
 }
 assert.equal(esnekPaketBakiyeTuru(' PM '),'kisisel');
});
test('kimlik ve sahiplik girdiden alınmaz; geçersiz fiyat ve adet reddedilir',()=>{
 assert.ok(esnekPaketSiparisIstegiGecerli(istek));
 for(const alan of ['firmaId','sahipId','bakiyeTuru','rol','satinAlanId']) assert.equal(esnekPaketSiparisIstegiGecerli({...istek,[alan]:uuid}),false);
 for(const tokenAdedi of [0,3001,-1,3000.5,NaN]) assert.equal(esnekPaketSiparisIstegiGecerli({...istek,tokenAdedi}),false);
 for(const birimFiyat of [0,-1,8.201,Infinity,NaN,1000000001]) assert.equal(esnekPaketSiparisIstegiGecerli({...istek,birimFiyat}),false);
 for(const tarifeSurumu of [0,1.5,2147483648]) assert.equal(esnekPaketSiparisIstegiGecerli({...istek,tarifeSurumu}),false);
});
function sunucu() {
 const state={rol:'pm',user:{id:uuid} as {id:string}|null,rpcHata:null as null|{code:string},veri:{siparis_id:uuid,yeniden_deneme:false} as unknown,calls:[] as {name:string,args:Record<string,unknown>}[]};
 const exports:Record<string,any>={};
 const db={rpc:async(name:string,args:Record<string,unknown>)=>{state.calls.push({name,args});return {data:state.veri,error:state.rpcHata};}};
 const deps:Record<string,unknown>={
  'server-only':{},'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:state.user}})}}),createAdminClient:()=>db},
  '@/lib/utils/rolCozucu':{rolCozucu:async()=>state.rol},'./esnekPaket':{esnekPaketBakiyeTuru,esnekPaketSiparisIstegiGecerli},'@/lib/uretim/rpcTemel':{uuidGecerliMi},
 };
 vm.runInNewContext(ts.transpileModule(readFileSync('lib/satinAlma/esnekPaketSunucu.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,AbortSignal,require:(n:string)=>{assert.ok(n in deps,n);return deps[n];}});
 return {state,run:exports.esnekPaketSiparisiOlustur};
}
test('sunucu oturum ve rol kapısı; TM/admin RPC çağramaz',async()=>{
 const {state,run}=sunucu();state.user=null;assert.equal((await run(istek)).status,401);
 state.user={id:uuid};for(const rol of ['tm','admin','iu','utt','partner']){state.rol=rol;assert.equal((await run(istek)).status,403);}
 assert.equal(state.calls.length,0);
 state.rol='firma_admin';assert.equal((await run({...istek,firmaId:uuid})).status,400);assert.equal(state.calls.length,0);
 assert.equal((await run(istek)).ok,true);assert.equal(state.calls[0].args.p_auth_id,uuid);
 assert.deepEqual(Object.keys(state.calls[0].args).sort(),['p_anahtar','p_auth_id','p_birim_fiyat','p_tarife_surumu','p_token_adedi']);
});
test('fiyat değişimi, yetki, eksik kurulum ve belirsiz sonuç başarı gösterilmez',async()=>{
 const {state,run}=sunucu();for(const [code,status] of [['P0001',409],['42501',403],['22023',400],['PGRST202',503]]){state.rpcHata={code};assert.equal((await run(istek)).status,status);}
 state.rpcHata=null;state.veri=null;assert.equal((await run(istek)).status,503);
 state.veri={siparis_id:uuid,yeniden_deneme:true};assert.equal((await run(istek)).yenidenDeneme,true);
});
test('modalda onaylanan hesap rol değiştiğinde sessizce değiştirilmez',async()=>{
 const {state,run}=sunucu();
 assert.equal((await run(istek,'firma_ortak')).status,403);assert.equal(state.calls.length,0);
 assert.equal((await run(istek,'kisisel')).ok,true);
});
