import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { satinAlmaBakiyesiGorebilir, satinAlmaBakiyeOzetiGecerli } from '@/lib/satinAlma/bakiyeOzeti';
import { TUM_ROLLER } from '@/lib/utils/roller';
const bos={paket:null,toplam:0,kullanilan:0,kalan:0,suresi_dolan:0,ayrilan:0};
const veri={kisisel:null,firma_ortak:bos};
test('bakiyeyi görme yetkisi satın almadan ayrıdır',()=>{
 for(const rol of TUM_ROLLER)assert.equal(satinAlmaBakiyesiGorebilir(rol),rol!=='admin',rol);
 for(const rol of ['partner','eczaci','ikinci_eczaci','yardimci_eczaci','eczane_teknisyeni','musteri',''])assert.equal(satinAlmaBakiyesiGorebilir(rol),false);
});
test('boş/aktif/süresi dolan ve ayrılmış bakiye doğrulanır; eksik/yanlış sayılar reddedilir',()=>{
 assert.ok(satinAlmaBakiyeOzetiGecerli(veri));
 assert.ok(satinAlmaBakiyeOzetiGecerli({...veri,kisisel:{paket:'esnek',toplam:3000,kullanilan:1000,kalan:1000,suresi_dolan:500,ayrilan:500}}));
 for(const x of [null,{}, {firma_ortak:bos},{...veri,firma_ortak:{...bos,kalan:-1}},{...veri,firma_ortak:{...bos,kalan:100}},{...veri,firma_ortak:{...bos,toplam:'0'}},{...veri,firma_ortak:{...bos,paket:'esnek'}}])assert.equal(satinAlmaBakiyeOzetiGecerli(x),false);
});
function route() {
 const state={user:{id:'oturum-kimligi'} as null|{id:string},rol:'pm',error:null as null|{code:string},data:veri as unknown,calls:[] as any[]};
 const exports:Record<string,any>={};
 const deps:Record<string,unknown>={
  '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:state.user}})}}),createAdminClient:()=>({rpc:async(name:string,args:unknown)=>{state.calls.push({name,args});return {data:state.data,error:state.error};}})},
  '@/lib/utils/rolCozucu':{rolCozucu:async()=>state.rol},'@/lib/satinAlma/bakiyeOzeti':{satinAlmaBakiyesiGorebilir,satinAlmaBakiyeOzetiGecerli},
 };
 vm.runInNewContext(ts.transpileModule(readFileSync('app/api/token-bakiyeleri/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,Response,AbortSignal,require:(n:string)=>{assert.ok(n in deps,n);return deps[n];}});
 return {state,get:exports.GET};
}
test('API oturum/rol kapısı, kimlik kapsamı ve özel önbellek başlığı',async()=>{
 const {state,get}=route();state.user=null;assert.equal((await get()).status,401);state.user={id:'oturum-kimligi'};
 for(const rol of ['admin','partner','eczaci','musteri']){state.rol=rol;assert.equal((await get()).status,403);}assert.equal(state.calls.length,0);
 for(const rol of ['pm','gm','firma_admin','tm','utt']){state.rol=rol;const r=await get(new Request('http://localhost/api/token-bakiyeleri?firma=hedef&sahip=baskasi'));assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'private, no-store');}
 assert.equal(JSON.stringify(state.calls[0].args),JSON.stringify({p_auth_id:'oturum-kimligi'}));
});
test('eksik SQL, SQL yetki reddi ve bozuk bakiye başarı/sıfır gibi gösterilmez',async()=>{
 const {state,get}=route();state.error={code:'42501'};assert.equal((await get()).status,403);
 state.error={code:'PGRST202'};assert.equal((await get()).status,503);
 state.error=null;state.data={};assert.equal((await get()).status,503);
});
