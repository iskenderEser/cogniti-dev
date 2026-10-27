import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const code=ts.transpileModule(readFileSync(new URL("../app/(panel)/token/api/rapor/route.ts",import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function setup(user={id:"user-a"},error=null){const calls=[];const modules={"next/server":{NextResponse:{json:Response.json.bind(Response)}},"@/lib/supabase/server":{createClient:async()=>({auth:{getUser:async()=>({data:{user},error:null})}}),createAdminClient:()=>({rpc:async(name,args)=>{calls.push({name,args});return {data:{hesap_var:true},error};}})},"@/lib/utils/hataIsle":{yetkiHatasi:()=>Response.json({hata:"Yetkisiz"},{status:401}),validasyonHatasi:()=>Response.json({hata:"Geçersiz"},{status:400}),sunucuHatasi:e=>{throw e;}}};const exports={};vm.runInNewContext(code,{exports,console,require:n=>modules[n]});return{calls,get:query=>exports.GET({nextUrl:{searchParams:new URLSearchParams(query)}})}}
test("Kimliği doğrulanmamış kullanıcı rapora erişemez",async()=>{const s=setup(null);assert.equal((await s.get("")).status,401);assert.equal(s.calls.length,0)});
test("Firma ve kimlik istemciden değil oturumdan belirlenir",async()=>{const s=setup();assert.equal((await s.get("firma_id=baska&kullanici_id=baska&kapsam=benim")).status,200);assert.deepEqual(JSON.parse(JSON.stringify(s.calls[0].args)),{p_kullanici:"user-a",p_kapsam:"benim",p_sayfa:0,p_arama:"",p_tur:""})});
test("Geçersiz kapsam, işlem ve sayfa veritabanına gönderilmez",async()=>{const s=setup();for(const q of ["kapsam=firma","tur=bilinmeyen","sayfa=-1","sayfa=100001"])assert.equal((await s.get(q)).status,400);assert.equal(s.calls.length,0)});
test("Erişim reddi ve SQL hatası güvenli cevap verir",async()=>{assert.equal((await setup({id:"eczaci"},{code:"42501"}).get("")).status,401);const res=await setup({id:"user"},{code:"XX000",message:"gizli"}).get("");assert.equal(res.status,500);assert.doesNotMatch(JSON.stringify(await res.json()),/gizli/)});
