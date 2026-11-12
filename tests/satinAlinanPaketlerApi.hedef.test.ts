import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {partnerYanit} from '@/lib/agora/partnerHttp';
import {uuidGecerliMi} from '@/lib/uretim/rpcTemel';
import {siparisListesiGecerli} from '@/lib/satinAlma/siparisListesi';
import {firmaAdminIstegiIzinliMi} from '@/lib/admin/firmaAdminErisimi';
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
function setup(){
 const state={allowed:true,code:null as string|null,data:{firma_id:id(1),siparisler:[],toplam:0,sayfa:0,sayfa_boyutu:20} as unknown};const calls:{name:string;args:Record<string,unknown>}[]=[];
 const exports={} as {GET:(r:Request,c:{params:Promise<{firma_id:string}>})=>Promise<Response>};
 const deps:Record<string,unknown>={
  '@/lib/agora/partnerHttp':{partnerYanit},'@/lib/uretim/rpcTemel':{uuidGecerliMi},'@/lib/satinAlma/siparisListesi':{siparisListesiGecerli},
  '@/lib/admin/firmaYonetimOkuma':{firmaYonetimOkumaKontrol:async()=>state.allowed?{gecerli:true,kullaniciId:id(10)}:{gecerli:false,yanit:Response.json({hata:'Yetki yok'},{status:403})}},
  '@/lib/supabase/server':{createAdminClient:()=>({rpc:async(name:string,args:Record<string,unknown>)=>{calls.push({name,args});return{data:state.data,error:state.code?{code:state.code}:null};}})},
 };
 vm.runInNewContext(ts.transpileModule(readFileSync('app/admin/api/firmalar/[firma_id]/satin-alinan-paketler/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL,AbortSignal,require:(n:string)=>deps[n]??assert.fail(n)});
 return{state,calls,get:(query='',firma=id(1))=>exports.GET(new Request(`http://localhost/admin/api/firmalar/${firma}/satin-alinan-paketler${query}`),{params:Promise.resolve({firma_id:firma})})};
}
test('firma ve oturum kimliği kontrollü okuma RPCsine taşınır',async()=>{const s=setup();const r=await s.get();assert.equal(r.status,200);assert.match(r.headers.get('cache-control')??'',/no-store/);assert.equal(s.calls[0].name,'cogniti_firma_satin_alinan_paketler');assert.equal(s.calls[0].args.p_auth_id,id(10));assert.equal(s.calls[0].args.p_firma,id(1));});
test('yetkisiz okuma, geçersiz firma ve sayfa RPC çağırmaz',async()=>{const s=setup();s.state.allowed=false;assert.equal((await s.get()).status,403);s.state.allowed=true;assert.equal((await s.get('','bad')).status,400);for(const q of ['?sayfa=-1','?sayfa=1.5','?sayfa=1000001','?sayfa=0&sayfa=1'])assert.equal((await s.get(q)).status,400);assert.equal(s.calls.length,0);});
test('SQL eksikliği, DB yetki hatası ve yabancı firma/bozuk yanıt boş listeye çevrilmez',async()=>{const s=setup();for(const [code,status] of [['PGRST202',503],['42501',403],['XX000',503]] as const){s.state.code=code;assert.equal((await s.get()).status,status);}s.state.code=null;for(const data of [null,{firma_id:id(2),siparisler:[],toplam:0,sayfa:0,sayfa_boyutu:20},{firma_id:id(1),siparisler:[],toplam:0,sayfa:1,sayfa_boyutu:20}]){s.state.data=data;assert.equal((await s.get()).status,503);}});
test('firma admini yalnız kendi firma listesini GET/HEAD ile okuyabilir',()=>{const p=new URLSearchParams();const path=(n:number)=>`/admin/api/firmalar/${id(n)}/satin-alinan-paketler`;for(const m of ['GET','HEAD'])assert.equal(firmaAdminIstegiIzinliMi(path(1),m,p,id(1)),true);for(const m of ['POST','PUT','DELETE'])assert.equal(firmaAdminIstegiIzinliMi(path(1),m,p,id(1)),false);assert.equal(firmaAdminIstegiIzinliMi(path(2),'GET',p,id(1)),false);});

test('üç paket türünün kayıtlı tutarlarını döndürür, geçersiz türü reddeder', async () => {
 const s = setup();
 const ortak = { siparis_tarihi: '2026-11-10T09:00:00Z', satin_alan_ad_soyad: 'Test Kullanıcı', bakiye_turu: 'kisisel' };
 const siparisler = [
  { ...ortak, kayit_id: id(3), paket_turu: 'esnek', token_adedi: 2500, birim_fiyat: 5.5, toplam_tutar: 13750, kdv: 2750 },
  { ...ortak, kayit_id: id(4), paket_turu: 'abonelik_baslangic', token_adedi: 167, birim_fiyat: 5.9, toplam_tutar: 983.33, kdv: 196.67 },
  { ...ortak, kayit_id: id(5), paket_turu: 'abonelik_devam', token_adedi: 5000, birim_fiyat: 5.9, toplam_tutar: 29500, kdv: 5900 },
 ];
 s.state.data = { firma_id: id(1), siparisler, toplam: 3, sayfa: 0, sayfa_boyutu: 20 };
 const cevap = await s.get();
 assert.equal(cevap.status, 200);
 assert.deepEqual((await cevap.json()).siparisler, siparisler);
 assert.equal((await s.get('?paket=esnek')).status, 503);
 assert.equal(s.calls.at(-1)?.args.p_yalniz_esnek, true);
 s.state.data = { firma_id: id(1), siparisler: siparisler.slice(0, 1), toplam: 1, sayfa: 0, sayfa_boyutu: 20 };
 const esnek = await s.get('?paket=esnek');
 assert.equal(esnek.status, 200);
 assert.deepEqual((await esnek.json()).siparisler, siparisler.slice(0, 1));
 assert.equal((await s.get('?paket=abonelik')).status, 503);
 assert.equal(s.calls.at(-1)?.args.p_paket, 'abonelik');
 s.state.data = { firma_id: id(1), siparisler: siparisler.slice(1), toplam: 2, sayfa: 0, sayfa_boyutu: 20 };
 const abonelik = await s.get('?paket=abonelik');
 assert.equal(abonelik.status, 200);
 assert.deepEqual((await abonelik.json()).siparisler, siparisler.slice(1));
 assert.equal((await s.get('?paket=kko')).status, 503);
 siparisler[0].paket_turu = 'bilinmeyen';
 s.state.data = { firma_id: id(1), siparisler, toplam: 3, sayfa: 0, sayfa_boyutu: 20 };
 assert.equal((await s.get()).status, 503);
});

test('KKÖ kullanım bedelini yalnızca KKÖ sayfasına döndürür', async () => {
 const s = setup();
 const kayit = { kayit_id: id(6), siparis_tarihi: '2026-10-31T21:00:00Z', satin_alan_ad_soyad: 'Test Kullanıcı',
  bakiye_turu: 'kisisel', paket_turu: 'kko', token_adedi: 25, birim_fiyat: 9.9, toplam_tutar: 247.5, kdv: 49.5 };
 s.state.data = { firma_id: id(1), siparisler: [kayit], toplam: 1, sayfa: 0, sayfa_boyutu: 20 };
 const cevap = await s.get('?paket=kko');
 assert.equal(cevap.status, 200);
 assert.equal(s.calls.at(-1)?.args.p_paket, 'kko');
 assert.deepEqual((await cevap.json()).siparisler, [kayit]);
 for (const q of ['', '?paket=esnek', '?paket=abonelik']) assert.equal((await s.get(q)).status, 503);
});

test('arama metnini firma kapsamındaki okuma RPCsine taşır', async () => {
 const s = setup();
 assert.equal((await s.get('?sayfa=0&q=%20Abonelik%20Devam%20')).status, 200);
 assert.equal(s.calls[0].args.p_arama, 'Abonelik Devam');
 for (const q of ['?q=a&q=b', '?q=%00', '?q=' + 'a'.repeat(81)]) {
  assert.equal((await s.get(q)).status, 400);
 }
 assert.equal(s.calls.length, 1);
});
