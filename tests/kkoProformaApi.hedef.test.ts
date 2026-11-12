import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { partnerJsonOku, partnerYanit } from "@/lib/agora/partnerHttp";
import { uuidGecerliMi } from "@/lib/uretim/rpcTemel";
import { kkoProformaListesiGecerli, proformaOnayiGecerli } from "@/lib/satinAlma/kkoProforma";
import { firmaAdminIstegiIzinliMi } from "@/lib/admin/firmaAdminErisimi";
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12,"0")}`;
function setup() {
 const state = { allowed: true, code: null as string|null, data: null as unknown };
 const calls: { name: string; args: Record<string,unknown> }[] = [];
 const exports: { GET?: (r:Request,c:unknown)=>Promise<Response>; POST?: (r:Request,c:unknown)=>Promise<Response> } = {};
 const deps: Record<string,unknown> = {
  "@/lib/admin/firmaYonetimOkuma": { firmaYonetimOkumaKontrol: async () => state.allowed ? { gecerli:true,kullaniciId:id(10) } : { gecerli:false,yanit:Response.json({}, {status:403}) } },
  "@/lib/supabase/server": { createAdminClient: () => ({ rpc:async (name:string,args:Record<string,unknown>) => { calls.push({name,args}); return { data:state.data,error:state.code?{code:state.code}:null }; } }) },
  "@/lib/agora/partnerHttp": { partnerJsonOku,partnerYanit }, "@/lib/uretim/rpcTemel": { uuidGecerliMi },
  "@/lib/satinAlma/kkoProforma": { kkoProformaListesiGecerli,proformaOnayiGecerli },
 };
 vm.runInNewContext(ts.transpileModule(readFileSync("app/admin/api/firmalar/[firma_id]/kko-proformalar/route.ts","utf8"),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
 }).outputText,{exports,URL,AbortSignal,Response,require:(n:string)=>deps[n]??assert.fail(n)});
 const url=`http://localhost/admin/api/firmalar/${id(1)}/kko-proformalar`;
 return {state,calls,
  get:(q="")=>exports.GET!(new Request(url+q),{params:Promise.resolve({firma_id:id(1)})}),
  post:(body:unknown,origin="http://localhost")=>exports.POST!(new Request(url,{method:"POST",headers:{"Content-Type":"application/json",origin},body:JSON.stringify(body)}),{params:Promise.resolve({firma_id:id(1)})}),
 };
}
test("onay oturum kimliğine ve firmaya bağlanır, dış origin ve yetkisiz çağrı engellenir",async()=>{
 const s=setup();
 s.state.data={tur:"admin",onaylayan:"Admin",tarih:"2026-11-10T12:00:00Z",aciklama:"Firma talebi"};
 assert.equal((await s.post({siparisId:id(3),aciklama:" Firma talebi ",onaylayan:"sahte",rol:"firma_admin"})).status,200);
 assert.equal(s.calls[0].name,"cogniti_kko_proforma_onayla");
 assert.deepEqual(JSON.parse(JSON.stringify(s.calls[0].args)),{p_auth_id:id(10),p_firma:id(1),p_siparis:id(3),p_aciklama:"Firma talebi"});
 assert.equal((await s.post({siparisId:id(3),aciklama:"not"},"http://baska")).status,403);
 s.state.allowed=false;assert.equal((await s.post({siparisId:id(3),aciklama:"not"})).status,403);
 assert.equal(s.calls.length,1);
});
test("boş admin açıklaması DB reddi başarıya çevrilmez, bozuk istek RPCye gitmez",async()=>{
 const s=setup();
 s.state.code="22023";assert.equal((await s.post({siparisId:id(3),aciklama:""})).status,400);
 for(const body of [{siparisId:"bad",aciklama:"not"},{siparisId:id(3),aciklama:"a".repeat(2001)},{siparisId:id(3),aciklama:"\0"}])assert.equal((await s.post(body)).status,400);
 assert.equal(s.calls.length,1);
 s.state.code=null;s.state.data={};assert.equal((await s.post({siparisId:id(3),aciklama:"not"})).status,503);
});
test("onaylı liste isteği sunucuya aktarılır, geçersiz sayfa reddedilir",async()=>{
 const s=setup();s.state.data={firma_id:id(1),siparisler:[],toplam:0,sayfa:0,sayfa_boyutu:20,admin_onayi:true};
 assert.equal((await s.get("?onayli=1")).status,200);assert.equal(s.calls[0].args.p_sadece_onayli,true);
 for(const q of ["?sayfa=-1","?onayli=1&onayli=0","?onayli=x","?q="+"a".repeat(81)])assert.equal((await s.get(q)).status,400);
 assert.equal(s.calls.length,1);
});
test("firma admini yalnız kendi proforma alanında GET ve POST kullanabilir",()=>{
 const yol=(n:number)=>`/admin/api/firmalar/${id(n)}/kko-proformalar`;
 for(const method of ["GET","HEAD","POST"])assert.equal(firmaAdminIstegiIzinliMi(yol(1),method,new URLSearchParams(),id(1)),true);
 for(const method of ["PUT","DELETE"])assert.equal(firmaAdminIstegiIzinliMi(yol(1),method,new URLSearchParams(),id(1)),false);
 assert.equal(firmaAdminIstegiIzinliMi(yol(2),"POST",new URLSearchParams(),id(1)),false);
});
