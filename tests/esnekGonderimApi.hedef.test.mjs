import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const compile=(path,deps={},extra={})=>{const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,Response,URL,TextDecoder,...extra,require:n=>n in deps?deps[n]:assert.fail(n)});return exports;};
const contract=compile('lib/eclub/gonderimApi.ts',{'@/lib/zaman/kontrol':{trGunu:d=>d.toISOString().slice(0,10)}});
const http=compile('lib/agora/partnerHttp.ts');
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
function setup({role='utt',error=null,replay=false}={}){
 const calls=[],notifications=[];
 const db={from(table){const q={select(){return q},eq(){return q},in(){return q},maybeSingle(){return q},then(resolve,reject){return Promise.resolve({data:table==='kullanicilar'?{firma_id:id(1),takim_id:id(2)}:[{yayin_id:id(10),firma_id:id(1),takim_id:id(2),arac_turu:'video',urun_adi:'Ürün'}],error:null}).then(resolve,reject)}};return q;},async rpc(name,args){calls.push({name,args});return{error,data:error?null:{yeniden_deneme:replay,sonuclar:[{kisi_id:id(20),yayin_id:id(10),uygun:true,kaydedildi:true,oneri_id:id(30)}],haftalik_ozet:[]}}}};
 const handler=compile('app/(panel)/eclub/oneriler/api/route.ts',{
  'next/server':{NextResponse:{json:Response.json.bind(Response)}},'@/lib/agora/partnerHttp':http,
  '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:id(5)}},error:null})}}),createAdminClient:()=>db},
  '@/lib/utils/rolCozucu':{rolCozucu:async()=>role},'@/lib/utils/roller':{TUKETICI_ROLLER:['utt','kd_utt']},
  '@/lib/eclub/gonderimApi':contract,'@/lib/eclub/oneriKapsam':{eclubYayinKapsamindaMi:()=>true},
  '@/lib/ogrenmeAraci/bayraklar':{yayinAraciKullanimaAcikMi:()=>true},
  '@/lib/utils/eclubBildirim':{eclubBildirimOlustur:async x=>notifications.push(x)},
  '@/lib/utils/hataIsle':{yetkiHatasi:()=>Response.json({}, {status:401}),rolHatasi:x=>Response.json({hata:x},{status:403}),validasyonHatasi:x=>Response.json({hata:x},{status:400}),isKuraluHatasi:x=>Response.json({hata:x},{status:422}),hataYaniti:x=>Response.json({hata:x},{status:503}),sunucuHatasi:e=>{throw e;}}
 });
 return {calls,notifications,post:(extra={},origin='http://localhost')=>handler.POST(new Request('http://localhost/eclub/oneriler/api',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({islem:'gonder',yayin_idler:[id(10)],kisi_idler:[id(20)],islem_anahtari:id(40),...extra})}))};
}
test('UTT hesap seçmeden kanonik dağıtım RPCsi çağırır; token hesabı göndermez',async()=>{const s=setup();assert.equal((await s.post({firma_id:id(999),gonderen_id:id(999)})).status,201);assert.equal(s.calls.length,1);assert.equal(s.calls[0].name,'eclub_yayin_toplu_islem');assert.equal(s.calls[0].args.p_utt_id,id(5));assert.equal(s.calls[0].args.p_hesap,undefined);assert.equal(s.notifications.length,1);});
test('UTTnin token hesabı seçme girişimi yazmadan reddedilir',async()=>{for(const token_hesap_turu of ['kisisel','firma_ortak','other']){const s=setup();assert.equal((await s.post({token_hesap_turu})).status,400);assert.equal(s.calls.length,0);}});
test('Gönderim hatasında başarı veya bildirim oluşturulmaz',async()=>{const s=setup({error:{code:'P0001',message:'ECLUB_GONDERIM:yayin_token_kaydi_yok'}});assert.equal((await s.post()).status,503);assert.equal(s.notifications.length,0);});
test('Tekrarlanmış sonuçta bildirim tekrarlanmaz',async()=>{const s=setup({replay:true});assert.equal((await s.post()).status,201);assert.equal(s.notifications.length,0);});
test('Önizleme eski kanonik uygunluk RPCsinde kalır; tüketim bağlanmaz',async()=>{const s=setup();assert.equal((await s.post({islem:'kontrol',token_hesap_turu:null})).status,200);assert.equal(s.calls[0].name,'eclub_yayin_toplu_islem');assert.equal(s.calls[0].args.p_onizleme,true);assert.equal(s.notifications.length,0);});
test('Diğer roller ve farklı köken istekler hiçbir RPCye ulaşamaz',async()=>{for(const role of ['pm','gm','tm','firma_admin','admin']){const s=setup({role});assert.equal((await s.post()).status,403);assert.equal(s.calls.length,0);}const s=setup();assert.equal((await s.post({},'https://foreign.example')).status,403);assert.equal(s.calls.length,0);});
