import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const code=ts.transpileModule(readFileSync(new URL("../app/(panel)/token/api/kko/route.ts",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function setup({user={id:"user-a"},error=null}={}) {
 const calls=[]; const modules={
  "next/server":{NextResponse:{json:Response.json.bind(Response)}},
  "@/lib/supabase/server":{createClient:async()=>({auth:{getUser:async()=>({data:{user},error:null})}}),createAdminClient:()=>({rpc:async(name,args)=>{calls.push({name,args});return {data:{onay_gerekli:true},error};}})},
  "@/lib/utils/hataIsle":{yetkiHatasi:()=>Response.json({hata:"Yetkisiz"},{status:401}),validasyonHatasi:m=>Response.json({hata:m},{status:400}),sunucuHatasi:e=>{throw e;}}
 };
 const exports={}; vm.runInNewContext(code,{exports,console,require:n=>modules[n]});return {calls,api:exports};
}
const uuid="550e8400-e29b-41d4-a716-446655440000";
test("Oturumu olmayan kullanıcı onay işlemi yapamaz",async()=>{const x=setup({user:null});assert.equal((await x.api.GET()).status,401);assert.equal((await x.api.POST({json:async()=>({onay_surumu:uuid})})).status,401);assert.equal(x.calls.length,0)});
test("Onayda kişi oturumdan alınır ve istemci firma veya miktar seçemez",async()=>{const x=setup();assert.equal((await x.api.POST({json:async()=>({onay_surumu:uuid,firma_id:"diger",miktar:99999})})).status,200);assert.deepEqual(JSON.parse(JSON.stringify(x.calls[0].args)),{p_kullanici:"user-a",p_surum:uuid})});
test("Geçersiz onay anahtarı veritabanına gönderilmez",async()=>{const x=setup();assert.equal((await x.api.POST({json:async()=>({onay_surumu:"invalid"})})).status,400);assert.equal(x.calls.length,0)});
test("Yetkisiz ve eski onay açıklayıcı hata ile döner",async()=>{for(const [reason,status] of [["kko_yetkisiz",403],["kko_guncel_degil",409]]){const x=setup({error:{message:`COGNITI_TOKEN:${reason}`}});assert.equal((await x.api.POST({json:async()=>({onay_surumu:uuid})})).status,status)}});
