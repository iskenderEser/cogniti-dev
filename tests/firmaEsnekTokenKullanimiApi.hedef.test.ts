import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {partnerYanit} from '@/lib/agora/partnerHttp';
import {uuidGecerliMi} from '@/lib/uretim/rpcTemel';
import {esnekKullanimRaporuGecerli} from '@/lib/satinAlma/kullanimRaporu';
import {firmaAdminIstegiIzinliMi} from '@/lib/admin/firmaAdminErisimi';
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
function setup(){
 const state={allowed:true,code:null as string|null,data:{firma_id:id(1),hesap_id:null,hesaplar:[],satirlar:[],kayit_sayisi:0,tuketim_toplami:0,sayfa:0} as unknown};const calls:{name:string;args:Record<string,unknown>}[]=[];
 const exports={} as {GET:(r:Request,c:{params:Promise<{firma_id:string}>})=>Promise<Response>};
 const deps:Record<string,unknown>={
  '@/lib/agora/partnerHttp':{partnerYanit},'@/lib/uretim/rpcTemel':{uuidGecerliMi},'@/lib/satinAlma/kullanimRaporu':{esnekKullanimRaporuGecerli},
  '@/lib/admin/firmaYonetimOkuma':{firmaYonetimOkumaKontrol:async()=>state.allowed?{gecerli:true,kullaniciId:id(10)}:{gecerli:false,yanit:Response.json({hata:'Yetki yok'},{status:403})}},
  '@/lib/supabase/server':{createAdminClient:()=>({rpc:async(name:string,args:Record<string,unknown>)=>{calls.push({name,args});return{data:state.data,error:state.code?{code:state.code}:null};}})},
 };
 vm.runInNewContext(ts.transpileModule(readFileSync('app/admin/api/firmalar/[firma_id]/esnek-token-kullanimi/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,URL,AbortSignal,require:(n:string)=>deps[n]??assert.fail(n)});
 return{state,calls,get:(query='',firma=id(1))=>exports.GET(new Request(`http://localhost/admin/api/firmalar/${firma}/esnek-token-kullanimi${query}`),{params:Promise.resolve({firma_id:firma})})};
}
test('firma ve oturum kimliği kontrollü okuma RPCsine taşınır',async()=>{const s=setup();const r=await s.get();assert.equal(r.status,200);assert.match(r.headers.get('cache-control')??'',/no-store/);assert.equal(s.calls[0].name,'cogniti_firma_esnek_token_kullanimi');assert.equal(s.calls[0].args.p_auth_id,id(10));assert.equal(s.calls[0].args.p_firma,id(1));});
test('yetkisiz okuma, geçersiz firma ve sayfa RPC çağırmaz',async()=>{const s=setup();s.state.allowed=false;assert.equal((await s.get()).status,403);s.state.allowed=true;assert.equal((await s.get('','bad')).status,400);for(const q of ['?sayfa=-1','?sayfa=1.5','?sayfa=1000001','?sayfa=0&sayfa=1','?hesap=bad','?hesap='+id(100)+'&hesap='+id(101)])assert.equal((await s.get(q)).status,400);assert.equal(s.calls.length,0);});
test('SQL eksikliği, DB yetki hatası ve yabancı firma/bozuk yanıt boş listeye çevrilmez',async()=>{const s=setup();for(const [code,status] of [['PGRST202',503],['42501',403],['XX000',503]] as const){s.state.code=code;assert.equal((await s.get()).status,status);}s.state.code=null;for(const data of [null,{firma_id:id(2),hesap_id:null,hesaplar:[],satirlar:[],kayit_sayisi:0,tuketim_toplami:0,sayfa:0},{firma_id:id(1),hesap_id:null,hesaplar:[],satirlar:[],kayit_sayisi:0,tuketim_toplami:0,sayfa:1}]){s.state.data=data;assert.equal((await s.get()).status,503);}});
test('firma admini yalnız kendi firma listesini GET/HEAD ile okuyabilir',()=>{const p=new URLSearchParams();const path=(n:number)=>`/admin/api/firmalar/${id(n)}/esnek-token-kullanimi`;for(const m of ['GET','HEAD'])assert.equal(firmaAdminIstegiIzinliMi(path(1),m,p,id(1)),true);for(const m of ['POST','PUT','DELETE'])assert.equal(firmaAdminIstegiIzinliMi(path(1),m,p,id(1)),false);assert.equal(firmaAdminIstegiIzinliMi(path(2),'GET',p,id(1)),false);});

test('bozuk hesap ve tüketim kaydı doğrulamadan geçmez',()=>{const base={firma_id:id(1),hesap_id:null,hesaplar:[],satirlar:[],kayit_sayisi:0,tuketim_toplami:0,sayfa:0};assert.equal(esnekKullanimRaporuGecerli(base),true);for(const d of [{...base,hesap_id:id(100)},{...base,hesaplar:[null]},{...base,satirlar:[{}]},{...base,tuketim_toplami:-1}])assert.equal(esnekKullanimRaporuGecerli(d),false);});
